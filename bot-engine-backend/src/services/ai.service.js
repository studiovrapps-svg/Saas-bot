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
            ? "\n\nREGLAS DE NEGOCIO ESTRICTAS:\n" + rules.map((r, i) => `- Si el usuario pregunta "${r.q}", RESPONDE EXACTAMENTE: "${r.a}"${r.image_url ? ` (SIEMPRE incluye al final el cdigo [FAQ_IMG_${i}])` : ''}`).join('\n') 
            : "";
        
                // --- CONSTRUCCIÓN DEL CEREBRO UNIVERSAL TIER 2 (OPTIMIZADO PARA 20B) ---
        // Este bloque aplica para CUALQUIER empresa nueva que contrate el bot Tier 2.
        
        let sysPrompt = `[ROL Y PERSONALIDAD]
Eres el asistente virtual oficial y experto en ventas de ${tenant.name}.
Tu objetivo es brindar atención al cliente de primer nivel: eres sumamente alegre, empático, persuasivo y resolutivo.
NUNCA actúas como un robot tradicional. Evitas los menús numéricos (1, 2, 3...) y mantienes conversaciones fluidas y naturales.

[DIRECTRICES CENTRALES DEL SISTEMA]
1. IDENTIFICACIÓN: `;

        if (customer_name) {
            sysPrompt += `El cliente ya está registrado como "${customer_name}". Llámalo por su nombre de forma natural en la conversación.\n`;
        } else {
            sysPrompt += `Si es el primer mensaje, preséntate con entusiasmo y PREGÚNTALE SU NOMBRE. Cuando te responda con su nombre, ES OBLIGATORIO usar la herramienta 'register_customer_name' para guardarlo.\n`;
        }

        sysPrompt += `2. AUTONOMÍA: Tienes la capacidad de resolver dudas y asesorar ventas por tu cuenta usando el catálogo. NO transfieras a un humano prematuramente. 
3. HERRAMIENTAS Y TEXTO: Si decides usar una herramienta (como registrar un nombre o crear una orden), ESTÁS OBLIGADO a generar también un mensaje de texto conversacional. ¡Nunca envíes una herramienta sola!
4. TRANSFERENCIA: Usa 'transfer_to_human' ÚNICAMENTE si el cliente ya te dio sus datos para finalizar un trámite/venta, o si está enojado/exige un humano.

[EJEMPLOS DE COMPORTAMIENTO IDEAL (FEW-SHOT)]
Usuario: "Hola"
Tú: "¡Hola! Qué gusto saludarte, soy el asistente virtual de ${tenant.name}. ¿Con quién tengo el gusto?"

Usuario: "Me llamo Carlos"
Tú: (Ejecutas register_customer_name) "¡Mucho gusto, Carlos! ¿En qué te puedo ayudar el día de hoy?"

[INFORMACIÓN ESPECÍFICA DE LA EMPRESA ACTUAL]
- Empresa: ${tenant.name}
- Industria: ${tenant.business_vertical || 'Retail'}
- Moneda Oficial: ${tenant.currency || 'USD'}

[REGLAS PERSONALIZADAS DE LA EMPRESA]:
`;
        sysPrompt += (tenant.system_prompt ? tenant.system_prompt.trim() : "Atiende al cliente de la mejor manera basada en el catálogo.");
        sysPrompt += `\n`;
        sysPrompt += rulesText;
        // -----------------------------------------------------------------------
        sysPrompt += `\n\nIMPORTANTE: Los precios recuperados de la base de conocimientos pueden mostrar "USD", pero siempre asume que la cifra numérica ya es el precio final en la moneda oficial del negocio (${tenant.currency || 'USD'}). Muéstralo usando su símbolo correcto.`;

        // 2. Cargar Historial de Base de Datos
        const dbHistory = await messageRepo.getRecentMessagesForAI(tenant_id, to, 8);

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
                    content: `Producto: ${p.name}\nPrecio: ${p.price}\nDescripción: ${p.description || 'N/A'}`
                }));
            }
        }

        let contextMsg = "";
        if (ragContext && ragContext.length > 0) {
            contextMsg = "INFORMACIÓN RECUPERADA DE LA BASE DE CONOCIMIENTOS (CATÁLOGO/DOCS):\n";
            ragContext.forEach(doc => {
                contextMsg += `- [ID: ${doc.reference_id || 'N/A'}] ${doc.content}\n`;
            });
            contextMsg += "\nUsa esta información para responder al usuario. Si el usuario pide comprar un producto que está en la base de conocimientos, ofrece usar la herramienta create_order indicando los nombres exactos y cantidad.";
            contextMsg += "\nINSTRUCCIÓN ESPECIAL PARA IMÁGENES: Si la información contiene el ID de un producto, y consideras que enviar una foto ayudaría a la venta, incluye en tu respuesta este texto exacto: [IMG_<ID>] donde <ID> es el número de ID (ejemplo: [IMG_45]). El sistema reemplazará ese código por la foto real.";
        }

        // 4. Preparar Mensajes para el LLM
        const messages = [];
        messages.push({ role: "system", content: sysPrompt + (contextMsg ? `\n\n${contextMsg}` : "") });
        messages.push(...dbHistory);
        
        // Inyectamos el mensaje actual del usuario solo si no fue precargado en la base de datos en este ms
        if (!isMsgAlreadyInHistory) {
            messages.push({ role: "user", content: text });
        }

        const tools = [
                        {
                type: "function",
                function: {
                    name: "register_customer_name",
                    description: "Guarda permanentemente el nombre del cliente en la base de datos una vez que te lo dice (sólo úsala cuando el usuario te confirme cómo se llama).",
                    parameters: {
                        type: "object",
                        properties: {
                            name: { type: "string", description: "El nombre y/o apellido del cliente" }
                        },
                        required: ["name"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "create_order",
                    description: "Registra un pedido cuando el usuario confirma los productos y las cantidades que desea comprar.",
                    parameters: {
                        type: "object",
                        properties: {
                            items: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        product: { type: "string", description: "Nombre del producto exacto" },
                                        quantity: { type: "integer", description: "Cantidad a comprar" }
                                    },
                                    required: ["product", "quantity"]
                                }
                            },
                            delivery_address: { type: "string", description: "Dirección completa de entrega proporcionada por el usuario" }
                        },
                        required: ["items", "delivery_address"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "transfer_to_human",
                    description: "¡USO RESTRINGIDO! Transfiere la conversación a un humano ÚNICAMENTE en dos casos: 1. El cliente ya te proporcionó sus datos (nombre y dirección) para finalizar un trámite/compra/inscripción. 2. El cliente exige explícita y agresivamente hablar con un operador humano. En cualquier otro caso, RESUELVE la duda tú mismo.",
                    parameters: { type: "object", properties: {} }
                }
            }
        ];

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000); // 12 segundos máximo
        
        let completion;
        try {
            completion = await groq.chat.completions.create({
                messages: messages,
                model: "openai/gpt-oss-20b",
                temperature: 0.3,
                max_tokens: 500,
                tools: tools,
                tool_choice: "auto"
            }, { signal: controller.signal });
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

            while ((match = faqRegex.exec(textToSend)) !== null) {
                const idx = parseInt(match[1]);
                if (rules[idx] && rules[idx].image_url) {
                    faqImagesToSend.push({ url: rules[idx].image_url, caption: rules[idx].q });
                }
                textToSend = textToSend.replace(match[0], '');
            }
            
            textToSend = textToSend.trim();
            if (textToSend.length > 0) {
                await sendWhatsAppText(phone_number_id, token, to, textToSend, tenant_id).catch(e => console.error("Fallo al enviar msj principal:", e));
            }

            if (imagesToSend.length > 0) {
                try {
                    const productsFound = await productRepo.findProductsByIds(tenant_id, imagesToSend);
                    // QA FIX: Iterar secuencialmente para que Meta no desordene las imágenes en WhatsApp
                    for (const p of productsFound) {
                        if (p && p.image_url) {
                            try {
                                // QA FIX: Caption más limpio, sin la URL raw
                                const caption = p.name;
                                await sendWhatsAppImage(phone_number_id, token, to, p.image_url, caption, tenant_id);
                            } catch(err) { console.error("Error enviando imagen", err); }
                        }
                    }
                } catch(e) { console.error("Error en batch imágenes", e); }
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
