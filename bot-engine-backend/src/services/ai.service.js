const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const { searchRelevantContext } = require('./rag.service');
const { sendWhatsAppText, sendWhatsAppImage } = require('./whatsapp.service');
const { sendTelegramAlert, escapeHTML } = require('./telegram.service');
const { toFile } = require('groq-sdk/uploads');

// Repositories & Config
const tenantRepo = require('../repositories/tenant.repository');
const orderRepo = require('../repositories/order.repository');
const sessionRepo = require('../repositories/session.repository');
const productRepo = require('../repositories/product.repository');
const messageRepo = require('../repositories/message.repository');
const { AI_PRICING, COPY, HANDOFF_SILENCE_DURATION_MS } = require('../config/constants');

async function sendWhatsAppAI(phone_number_id, token, to, text, tenant_id, customer_name = null) {
    try {
        // 1. Cargar Datos del Tenant
        const tenant = await tenantRepo.getTenantById(tenant_id);
        if (!tenant) throw new Error("Tenant no encontrado en la base de datos.");

        const rules = await tenantRepo.getBusinessRules(tenant_id);
        const rulesText = rules.length > 0 
            ? rules.map(r => `Regla(${r.q}): ${r.a}`).join(' | ') 
            : "";
        
                // --- CONSTRUCCIÓN DEL CEREBRO UNIVERSAL TIER 2 (OPTIMIZADO PARA 20B) ---
        // Este bloque aplica para CUALQUIER empresa nueva que contrate el bot Tier 2.
        
        let sysPrompt = `Eres IA de ventas de ${tenant.name}. Sé amable y persuasivo. Evita menús numéricos.\n`;

        if (customer_name) {
            sysPrompt += `Cliente: ${customer_name}.\n`;
        } else {
            sysPrompt += `Al inicio pregunta el nombre. Usa 'register_customer_name' para guardarlo.\n`;
        }

        sysPrompt += `Reglas:
1. Resuelve con catálogo. NO transfieras a humano prematuramente.
2. Siempre incluye texto conversacional al usar herramientas.
3. 'transfer_to_human' SOLO si exige humano o da datos para finalizar.
4. Solo atiende temas de ${tenant.name}.
5. Cierra natural (sin frases robóticas tipo "¿en qué más ayudo?").
6. Sin tablas ni IDs técnicos. Usa viñetas.
Empresa: ${tenant.name} | Industria: ${tenant.business_vertical || 'Retail'}
`;
        const tenantPrompt = tenant.system_prompt ? tenant.system_prompt.trim() : "Vende con el catálogo.";
        sysPrompt += `Instrucción: ${tenantPrompt}\nReglas:\n${rulesText}\nPrecios asumen moneda oficial: ${tenant.currency || 'USD'}.`;

        // 2. Cargar Historial de Conversación
        const dbHistory = await messageRepo.getRecentMessagesForAI(tenant_id, to, 4);

        // QA FIX: Evitar duplicación del mensaje actual del usuario si ya está en DB (por concurrencia de inserción)
        const lastMsg = dbHistory.length > 0 ? dbHistory[dbHistory.length - 1] : null;
        const isMsgAlreadyInHistory = lastMsg && lastMsg.role === 'user' && lastMsg.content === text;

        // 3. RAG y Fallbacks
        let ragContext = await searchRelevantContext(tenant_id, text);
        
        // QA FIX: Filtrar por similitud mínima para que el fallback del catálogo pueda activarse
        if (ragContext && ragContext.length > 0) {
            ragContext = ragContext.filter(d => d.similarity === undefined || d.similarity > 0.15);
        }
        
        if (!ragContext || ragContext.length === 0) {
            const defaultCatalog = await productRepo.getCatalog(tenant_id, 10);
            if (defaultCatalog && defaultCatalog.length > 0) {
                ragContext = defaultCatalog.map(p => ({
                    reference_id: p.id,
                    content: `${p.name}|Precio:${p.price}|Desc:${p.description || ''}`
                }));
            }
        }

        let contextMsg = "";
        if (ragContext && ragContext.length > 0) {
            contextMsg = "CATÁLOGO:\n" + ragContext.map(d => `- ${d.content} (ID:${d.reference_id || ''})`).join('\n') +
            "\nPara vender, usa create_order. Para fotos, añade [IMG_<ID>] al final. NO muestres IDs.";
        }

        // 4. Preparar Mensajes para el LLM
        const messages = [
            { role: "system", content: sysPrompt }
        ];

        // Solo inyectar rol y content (limpieza de tokens)
        const cleanHistory = dbHistory.map(m => ({ role: m.role, content: m.content }));
        if (!isMsgAlreadyInHistory) {
            messages.push(...cleanHistory);
            if (contextMsg) {
                messages.push({ role: "system", content: contextMsg });
            }
            messages.push({ role: "user", content: text });
        } else {
            const historyWithoutLast = cleanHistory.slice(0, -1);
            messages.push(...historyWithoutLast);
            if (contextMsg) {
                messages.push({ role: "system", content: contextMsg });
            }
            messages.push(cleanHistory[cleanHistory.length - 1]);
        }

        const tools = [];
        if (!customer_name) {
            tools.push({
                type: "function",
                function: {
                    name: "register_customer_name",
                    description: "Guarda nombre de cliente.",
                    parameters: { type: "object", properties: { name: { type: "string" } }, required: ["name"] }
                }
            });
        }
        if (text.match(/comprar|quiero|pedido|encargo|enviar|dirección|mandar|unidades|litros/i)) {
            tools.push({
                type: "function",
                function: {
                    name: "create_order",
                    description: "Registra pedido SOLO con productos confirmados Y dirección.",
                    parameters: { type: "object", properties: { items: { type: "array", items: { type: "object", properties: { product: { type: "string" }, quantity: { type: "integer" } } } }, delivery_address: { type: "string" } } }
                }
            });
        }
        if (text.match(/humano|asesor|agente|persona real|contacto|representante/i)) {
            tools.push({
                type: "function",
                function: {
                    name: "transfer_to_human",
                    description: "Solo si el cliente exige humano explícitamente.",
                    parameters: { type: "object", properties: {} }
                }
            });
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000); // 12 segundos máximo
        
        const payload = {
            messages: messages,
            model: "openai/gpt-oss-20b",
            temperature: 0.3,
            max_tokens: 500
        };
        if (tools.length > 0) {
            payload.tools = tools;
            payload.tool_choice = "auto";
        }

        let completion;
        try {
            completion = await groq.chat.completions.create(payload, { signal: controller.signal });
            clearTimeout(timeout);
        } catch (apiErr) {
            clearTimeout(timeout);
            throw apiErr; 
        }

        const pTokens = completion.usage?.prompt_tokens || 0;
        const cTokens = completion.usage?.completion_tokens || 0;
        const costUsd = (pTokens / 1000000 * AI_PRICING.PROMPT_TOKENS_PER_MILLION) + (cTokens / 1000000 * AI_PRICING.COMPLETION_TOKENS_PER_MILLION);
        await messageRepo.logUsage(tenant_id, pTokens, cTokens, costUsd);

        
        const responseMessage = completion.choices[0].message;
        let finalResponseText = responseMessage.content || "";

        if (responseMessage.tool_calls) {
            for (const toolCall of responseMessage.tool_calls) {
                if (toolCall.function.name === 'create_order') {
                    try {
                        const args = JSON.parse(toolCall.function.arguments);
                        if (!args.items || args.items.length === 0) {
                            finalResponseText += `\n\n¿Qué productos deseas comprar? Indícame los nombres y cantidades.`;
                        } else if (!args.delivery_address || args.delivery_address.trim().length < 4) {
                            finalResponseText += `\n\nPara registrar tu pedido, por favor bríndame tu dirección de entrega completa.`;
                        } else {
                            let validatedItems = [];
                            if (Array.isArray(args.items)) {
                                const validItemsInput = args.items.filter(i => i.product && typeof i.product === 'string' && i.product.trim().length > 0 && !isNaN(parseInt(i.quantity, 10)));
                                if (validItemsInput.length > 0) {
                                    const searchTerms = validItemsInput.map(i => `%${i.product.trim()}%`);
                                    const productsFound = await productRepo.findProductsByName(tenant_id, searchTerms);
                                    
                                    for (let item of validItemsInput) {
                                        const qty = parseInt(item.quantity, 10);
                                        if (qty <= 0 || qty > 999) continue;
                                        const itemLow = item.product.toLowerCase().trim();
                                        
                                        // QA FIX: Validación bidireccional del nombre del producto
                                        const dbProd = productsFound.find(p => {
                                            const dbLow = p.name.toLowerCase().trim();
                                            return dbLow.includes(itemLow) || itemLow.includes(dbLow);
                                        });
                                        
                                        if (dbProd) {
                                            validatedItems.push({ product: dbProd.name, quantity: qty, price: dbProd.price });
                                        }
                                    }
                                }
                            }
                            if (validatedItems.length === 0) {
                                finalResponseText += `\n\nLo siento, no pude validar los productos en tu carrito. Intenta con los nombres exactos del catálogo.`;
                            } else {
                                let cartText = validatedItems.map(i => `${i.quantity}x ${i.product}`).join(', ');
                                await orderRepo.createOrder(tenant_id, to, validatedItems, args.delivery_address);
                                finalResponseText += `\n\n${COPY.ORDER_SUCCESS} Resumen: ${cartText}. Dirección: ${args.delivery_address}.`;
                                
                                // --- TELEGRAM ALERT ---
                                let total = 0;
                                let cartSummaryAlert = validatedItems.map(item => {
                                    total += (item.price * item.quantity);
                                    return `🛒 ${item.quantity}x ${item.product}`;
                                }).join('\n');
                                sendTelegramAlert(tenant_id, `✅ <b>NUEVO PEDIDO (Tier 2 - IA)</b> ✅\n\n<b>Teléfono:</b> ${to}\n<b>Dirección:</b> ${escapeHTML(args.delivery_address)}\n\n<b>Productos:</b>\n${escapeHTML(cartSummaryAlert)}\n\n💰 <b>Total:</b> ${tenant.currency || 'USD'} ${total.toFixed(2)}`).catch(e => console.error(e));
                                // ----------------------
                            }
                        }
                    } catch(e) { 
                        console.error("Error parsing create_order args", e); 
                        if (!finalResponseText) finalResponseText = "Lo siento, tuve problemas procesando tu pedido. Por favor, intenta de nuevo.";
                    }
                                } else if (toolCall.function.name === 'register_customer_name') {
                    try {
                        const args = JSON.parse(toolCall.function.arguments);
                        if (args.name && args.name.trim().length > 0) {
                            const sessionRepo = require('../repositories/session.repository');
                            await sessionRepo.setCustomerName(tenant_id, to, args.name.trim());
                            console.log("Customer name registered via AI:", args.name);
                            if (!finalResponseText || finalResponseText.trim().length === 0) {
                                finalResponseText = `¡Mucho gusto, ${args.name.trim().split(' ')[0]}! ¿En qué te puedo ayudar hoy?`;
                            }
                        }
                    } catch(e) { console.error("Error registering customer name", e); }
                } else if (toolCall.function.name === 'transfer_to_human') {
                    const mutedTimestamp = Date.now() + HANDOFF_SILENCE_DURATION_MS;
                    await sessionRepo.setHumanStatus(tenant_id, to, mutedTimestamp);
                    finalResponseText += `\n\n${COPY.HANDOFF_INITIATED}`;
                    
                    // --- TELEGRAM ALERT ---
                    sendTelegramAlert(tenant_id, `⚠️ <b>NUEVO LEAD / ASISTENCIA</b> ⚠️\n\n<b>Teléfono:</b> ${to}\n\nUn cliente ha solicitado atención humana. El bot se ha pausado por 2 horas para este usuario.`).catch(e => console.error(e));
                    // ----------------------
                }
            }
        }
        
        // QA FIX: Fallback si todo falla y finalResponseText está vacío
        if (!finalResponseText || finalResponseText.trim().length === 0) {
            finalResponseText = "¿Podrías aclararme o darme más detalles sobre eso, por favor?";
        }

        if (finalResponseText) {
            const regex = /\[IMG_(\d+)\]/g;
            const faqRegex = /\[FAQ_IMG_(\d+)\]/g;
            let textToSend = finalResponseText;
            let match;
            const imagesToSend = [];
            const faqImagesToSend = [];

            while ((match = regex.exec(finalResponseText)) !== null) {
                imagesToSend.push(parseInt(match[1]));
                textToSend = textToSend.replace(match[0], '');
            }

            // Limpiar tags FAQ_IMG si la IA los incluyó (raro pero posible)
            while ((match = faqRegex.exec(textToSend)) !== null) {
                const idx = parseInt(match[1]);
                if (rules[idx] && rules[idx].image_url) {
                    faqImagesToSend.push({ url: rules[idx].image_url, caption: rules[idx].q });
                }
                textToSend = textToSend.replace(match[0], '');
            }

            // DETECCIÓN AUTOMÁTICA: Si la respuesta coincide con una regla que tiene imagen, enviarla
            // Esto NO depende de que la IA incluya el tag [FAQ_IMG_X]
            if (faqImagesToSend.length === 0 && rules.length > 0) {
                const responseLower = finalResponseText.toLowerCase();
                for (const rule of rules) {
                    if (rule.image_url) {
                        // Verificar si la respuesta contiene fragmentos significativos de la regla
                        const ruleKeywords = rule.a.substring(0, 80).toLowerCase();
                        if (responseLower.includes(ruleKeywords.substring(0, 40)) || 
                            responseLower.includes(rule.q.toLowerCase())) {
                            faqImagesToSend.push({ url: rule.image_url, caption: rule.q });
                        }
                    }
                }
            }
            
            textToSend = textToSend.trim();
            if (textToSend.length > 0) {
                await sendWhatsAppText(phone_number_id, token, to, textToSend, tenant_id).catch(e => console.error("Fallo al enviar msj principal:", e));
            }

            if (imagesToSend.length > 0) {
                try {
                    const productsFound = await productRepo.findProductsByIds(tenant_id, imagesToSend);
                    for (const p of productsFound) {
                        if (p && p.image_url) {
                            try {
                                const caption = p.name;
                                await sendWhatsAppImage(phone_number_id, token, to, p.image_url, caption, tenant_id);
                            } catch(err) { console.error("Error enviando imagen", err); }
                        }
                    }
                } catch(e) { console.error("Error en batch imágenes", e); }
            }

            // Enviar imágenes de FAQ (reglas de negocio)
            if (faqImagesToSend.length > 0) {
                for (const faqImg of faqImagesToSend) {
                    try {
                        await sendWhatsAppImage(phone_number_id, token, to, faqImg.url, faqImg.caption, tenant_id);
                    } catch(err) { console.error("Error enviando imagen FAQ:", err); }
                }
            }
        }
    } catch (error) {
        console.error(`Error AI:`, error);
        
        sendTelegramAlert(tenant_id, `⚠️ <b>FALLO DE IA DETECTADO</b> ⚠️\n\n<b>Teléfono:</b> ${to}\nEl sistema de IA falló (posible timeout/saturación de Groq). No se ha silenciado el bot, pero el cliente recibió un mensaje de error.`).catch(e => console.error(e));

        await sendWhatsAppText(phone_number_id, token, to, "Tuve un pequeño problema técnico procesando tu mensaje. ¿Podrías repetirlo por favor?", tenant_id).catch(e => console.error("Fallo msj contingencia:", e));
    }
}

async function transcribeAudio(buffer, tenant_id = null) {
    try {
        const fileObj = await toFile(buffer, 'audio.ogg');
        const completion = await groq.audio.transcriptions.create({
            file: fileObj,
            model: "whisper-large-v3-turbo",
            language: "es",
            response_format: "verbose_json"
        });
        if (tenant_id && completion.duration) {
            const costUsd = completion.duration * 0.0001;
            await messageRepo.logUsage(tenant_id, 0, 0, costUsd);
        }
        return completion.text;
    } catch (e) {
        console.error("Error en Whisper:", e);
        return COPY.AUDIO_ERROR;
    }
}

module.exports = { sendWhatsAppAI, transcribeAudio };
