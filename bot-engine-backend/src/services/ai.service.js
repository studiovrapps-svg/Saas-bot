const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const { searchRelevantContext } = require('./rag.service');
const { sendWhatsAppText, sendWhatsAppImage, logMessage } = require('./whatsapp.service');
const { toFile } = require('groq-sdk/uploads');

// Repositories & Config
const tenantRepo = require('../repositories/tenant.repository');
const orderRepo = require('../repositories/order.repository');
const sessionRepo = require('../repositories/session.repository');
const productRepo = require('../repositories/product.repository');
const messageRepo = require('../repositories/message.repository');
const { AI_PRICING, COPY, HANDOFF_SILENCE_DURATION_MS } = require('../config/constants');

const chatCache = new Map();

async function sendWhatsAppAI(phone_number_id, token, to, text, tenant_id) {
    try {
        const rules = await tenantRepo.getBusinessRules(tenant_id);
        const rulesText = rules.length > 0 
            ? "REGLAS DE NEGOCIO ESTRICTAS:\n" + rules.map(r => `- Si el usuario pregunta "${r.q}", RESPONDE EXACTAMENTE: "${r.a}"`).join('\n') 
            : "";
        
        let sysPrompt = `Eres un asistente de ventas profesional. Responde de forma concisa y amigable. Si no sabes algo, no inventes. Puedes usar emojis. Nunca ofrezcas productos que no estén en el catálogo provisto.\n${rulesText}`;

        const ragContext = await searchRelevantContext(tenant_id, text);
        let contextMsg = "";
        if (ragContext && ragContext.length > 0) {
            contextMsg = "INFORMACIÓN RECUPERADA DE LA BASE DE CONOCIMIENTOS (CATÁLOGO/DOCS):\n";
            ragContext.forEach(doc => {
                contextMsg += `- [ID: ${doc.metadata?.product_id || 'N/A'}] ${doc.content}\n`;
            });
            contextMsg += "\nUsa esta información para responder al usuario. Si el usuario pide comprar un producto que está en la base de conocimientos, ofrece usar la herramienta create_order indicando los nombres de los productos y la cantidad. Si la información no es suficiente, informa amablemente.\n";
            contextMsg += "INSTRUCCIÓN ESPECIAL PARA IMÁGENES: Si la información contiene el ID de un producto, y es útil para la venta, incluye en tu respuesta exactamente este texto: [IMG_<ID_DEL_PRODUCTO>] donde <ID_DEL_PRODUCTO> es el número de ID. El sistema lo reemplazará por la foto real.";
        }

        const cacheKey = `chat_${tenant_id}_${to}`;
        if (!chatCache.has(cacheKey)) { chatCache.set(cacheKey, []); }
        const history = chatCache.get(cacheKey);

        history.push({ role: "user", content: contextMsg ? `Contexto:\n${contextMsg}\n\nMensaje del usuario: ${text}` : text });
        if (history.length > 8) history.shift();

        const messages = [{ role: "system", content: sysPrompt }, ...history];

        const tools = [
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
                    description: "Transfiere la conversación a un humano si el usuario está enojado, pide hablar con un asesor, o hace una pregunta compleja que no puedes responder.",
                    parameters: { type: "object", properties: {} }
                }
            }
        ];

        const completion = await groq.chat.completions.create({
            messages: messages,
            model: "llama-3.1-70b-versatile",
            temperature: 0.3,
            max_tokens: 500,
            tools: tools,
            tool_choice: "auto"
        });

        // Billing
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
                            finalResponseText += `\n\n📝 Necesito saber exactamente qué productos deseas comprar. Por favor, indícame los nombres y cantidades.`;
                        } else if (!args.delivery_address || args.delivery_address.trim().length < 4) {
                            finalResponseText += `\n\n📍 Para registrar tu pedido, por favor bríndame tu dirección de entrega completa.`;
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
                                        const dbProd = productsFound.find(p => p.name.toLowerCase().includes(itemLow));
                                        
                                        if (dbProd) {
                                            validatedItems.push({ product: dbProd.name, quantity: qty, price: dbProd.price });
                                        }
                                    }
                                }
                            }
                            if (validatedItems.length === 0) {
                                finalResponseText += `\n\nLo siento, no pude validar los productos o cantidades en tu carrito. Por favor, intenta de nuevo.`;
                            } else {
                                let cartText = validatedItems.map(i => `${i.quantity}x ${i.product}`).join(', ');
                                await orderRepo.createOrder(tenant_id, to, validatedItems, args.delivery_address);
                                finalResponseText += `\n\n${COPY.ORDER_SUCCESS} Resumen: ${cartText}. Dirección: ${args.delivery_address}.`;
                                
                                // --- TELEGRAM ALERT ---
                                let total = 0;
                                let cartSummaryAlert = validatedItems.map(item => {
                                    total += (item.price * item.quantity);
                                    return `🛍️ ${item.quantity}x ${item.product}`;
                                }).join('\n');
                                const { sendTelegramAlert, escapeHTML } = require('./telegram.service');
                                sendTelegramAlert(tenant_id, `🚨 <b>NUEVO PEDIDO (Tier 2 - IA)</b> 🚨\n\n<b>Teléfono:</b> ${to}\n<b>Dirección:</b> ${args.delivery_address}\n\n<b>Productos:</b>\n${cartSummaryAlert}\n\n💰 <b>Total:</b> Q${total.toFixed(2)}`).catch(e => console.error(e));
                                // ----------------------
                            }
                        }
                    } catch(e) { console.error("Error parsing create_order args", e); }
                } else if (toolCall.function.name === 'transfer_to_human') {
                    const mutedTimestamp = Date.now() + HANDOFF_SILENCE_DURATION_MS;
                    await sessionRepo.setHumanStatus(tenant_id, to, mutedTimestamp);
                    finalResponseText += `\n\n${COPY.HANDOFF_INITIATED}`;
                    
                    // --- TELEGRAM ALERT ---
                    const { sendTelegramAlert, escapeHTML } = require('./telegram.service');
                    sendTelegramAlert(tenant_id, `⚠️ <b>NUEVO LEAD / ASISTENCIA</b> ⚠️\n\n<b>Teléfono:</b> ${to}\n\nUn cliente ha solicitado atención humana. El bot se ha pausado. Revisa WhatsApp para atenderlo.`).catch(e => console.error(e));
                    // ----------------------
                }
            }
        }

        if (finalResponseText) {
            const regex = /\[IMG_(\d+)\]/g;
            let textToSend = finalResponseText;
            let match;
            const imagesToSend = [];
            while ((match = regex.exec(finalResponseText)) !== null) {
                imagesToSend.push(parseInt(match[1]));
                textToSend = textToSend.replace(match[0], '');
            }
            
            textToSend = textToSend.trim();
            if (textToSend.length > 0) {
                await sendWhatsAppText(phone_number_id, token, to, textToSend, tenant_id);
                history.push({ role: "assistant", content: textToSend });
            }

            if (imagesToSend.length > 0) {
                try {
                    const productsFound = await productRepo.findProductsByIds(tenant_id, imagesToSend);
                    await Promise.all(productsFound.map(async (p) => {
                        if (p && p.image_url) {
                            try {
                                const caption = `[Imagen: ${p.image_url}]\n${p.name}`;
                                await sendWhatsAppImage(phone_number_id, token, to, p.image_url, caption, tenant_id);
                            } catch(err) { console.error("Error enviando imagen", err); }
                        }
                    }));
                } catch(e) { console.error("Error en batch imágenes", e); }
            }
        }
    } catch (error) {
        console.error(`Error AI:`, error);
        await sendWhatsAppText(phone_number_id, token, to, "Lo siento, estoy experimentando dificultades técnicas en este momento. Por favor intenta de nuevo más tarde.", tenant_id);
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
            const costUsd = completion.duration * 0.0001; // Whisper API cost ~$0.006 / minute = $0.0001 per second
            await messageRepo.logUsage(tenant_id, 0, 0, costUsd);
        }
        return completion.text;
    } catch (e) {
        console.error("Error en Whisper:", e);
        return COPY.AUDIO_ERROR;
    }
}

module.exports = { sendWhatsAppAI, chatCache, transcribeAudio };
