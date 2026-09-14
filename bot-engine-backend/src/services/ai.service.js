const pool = require('../config/db');
const Groq = require('groq-sdk');
const NodeCache = require('node-cache');
const { sendWhatsAppText, logMessage } = require('./whatsapp.service'); // Note: we'll have to watch out for circular deps

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const chatCache = new NodeCache({ stdTTL: 900 });

async function sendWhatsAppAI(phone_number_id, token, to, tenant_id, tenant_name, system_prompt, user_message) {
    try {
        const prodResult = await pool.query('SELECT * FROM products WHERE tenant_id = $1 AND is_active = true', [tenant_id]);
        const tenantResult = await pool.query('SELECT business_rules FROM tenants WHERE id = $1', [tenant_id]);
        const business_rules = tenantResult.rows[0]?.business_rules || ``;
        
        let catalogoTexto = `CATÁLOGO DE PRODUCTOS:\n`;
        if (prodResult.rows.length === 0) catalogoTexto += `No hay productos.\n`;
        prodResult.rows.forEach(p => catalogoTexto += `- ${p.name}: $${p.price} (${p.description}) (ID_FOTO=${p.id})\n`);

        let faqTexto = ``;
        try {
            if (business_rules) {
                const faqs = JSON.parse(business_rules);
                if (Array.isArray(faqs)) {
                    faqs.forEach(f => faqTexto += `PREGUNTA: ${f.q}\nRESPUESTA: ${f.a}\n\n`);
                } else faqTexto = business_rules;
            }
        } catch(e) { faqTexto = business_rules; }

        const basePrompt = `Eres el asistente virtual oficial de ${tenant_name}.
Tu objetivo es atender a los clientes, mostrarles el catálogo y cerrar ventas.

REGLAS CRÍTICAS:
1. RESPONDE SIEMPRE EN 1 O 2 PÁRRAFOS MÁXIMO. Sé cálido y conciso. Evita respuestas largas y robóticas.
2. Usa el formato de WhatsApp (*negritas*, _cursivas_ y emojis).
3. SIEMPRE utiliza el catálogo para ofrecer productos. NO INVENTES PRODUCTOS NI PRECIOS.
4. Si el cliente quiere realizar un pedido y te ha dado su dirección, o puedes deducirla, DEBES usar la función 'create_order'.
5. Si el cliente está frustrado, pide un humano o asesor, DEBES usar 'transfer_to_human'.
6. Si te piden una foto, incluye [IMG_X], reemplazando X por el ID_FOTO del producto.

CATÁLOGO:
${catalogoTexto}

REGLAS DEL NEGOCIO / FAQS:
${faqTexto}

INSTRUCCIONES EXTRA:
${system_prompt || `Sé amable y guía al usuario a realizar una compra.`}`;

        const historyRes = await pool.query(
            `SELECT direction, content FROM messages WHERE tenant_id = $1 AND customer_phone = $2 ORDER BY created_at ASC LIMIT 10`,
            [tenant_id, to]
        );
        
        let messages = [ { role: `system`, content: basePrompt } ];
        for (let row of historyRes.rows) {
            messages.push({
                role: row.direction === 'inbound' ? 'user' : 'assistant',
                content: row.content || ''
            });
        }
        
        if (messages.length === 1 || messages[messages.length-1].content !== user_message) {
            messages.push({ role: `user`, content: user_message });
        }

        const tools = [
            {
                type: `function`,
                function: {
                    name: `create_order`,
                    description: `Crea un pedido oficial en el sistema. DEBES buscar en el catálogo el nombre exacto y el PRECIO (price) de cada producto.`,
                    parameters: {
                        type: `object`,
                        properties: {
                            items: { 
                                type: `array`, 
                                items: { 
                                    type: `object`, 
                                    properties: { 
                                        product: { type: `string` }, 
                                        quantity: { type: `integer` },
                                        price: { type: `number`, description: `El precio unitario del producto, extraído del catálogo` }
                                    },
                                    required: [`product`, `quantity`, `price`]
                                } 
                            },
                            delivery_address: { type: `string` }
                        },
                        required: [`items`, `delivery_address`]
                    }
                }
            },
            {
                type: `function`,
                function: {
                    name: `transfer_to_human`,
                    description: `Silencia el bot y notifica a un humano.`,
                    parameters: { type: `object`, properties: { reason: { type: `string` } } }
                }
            }
        ];

        const completion = await groq.chat.completions.create({
            messages: messages,
            model: "openai/gpt-oss-20b",
            temperature: 0.2,
            max_tokens: 250,
            tools: tools,
            tool_choice: "auto"
        });

        try {
            if (completion.usage) {
                const pTokens = completion.usage.prompt_tokens || 0;
                const cTokens = completion.usage.completion_tokens || 0;
                // Groq Llama 3 8b pricing estimation: ~$0.05/1M prompt, ~$0.08/1M completion
                const cost = (pTokens / 1000000 * 0.05) + (cTokens / 1000000 * 0.08);
                await pool.query(
                    'INSERT INTO usage_logs (tenant_id, prompt_tokens, completion_tokens, cost_usd) VALUES ($1, $2, $3, $4)',
                    [tenant_id, pTokens, cTokens, cost]
                );
            }
        } catch(e) { console.error("Error logging tokens", e); }

        console.log('GROQ RESPONSE RAW:', JSON.stringify(completion, null, 2));
        const responseMessage = completion.choices[0].message;
        let finalResponseText = responseMessage.content || "";

        if (responseMessage.tool_calls) {
            for (const toolCall of responseMessage.tool_calls) {
                if (toolCall.function.name === 'create_order') {
                    const args = JSON.parse(toolCall.function.arguments);
                    let cartText = args.items.map(i => `${i.quantity}x ${i.product}`).join(', ');
                    await pool.query(
                        `INSERT INTO orders (tenant_id, customer_phone, items, delivery_address, status) VALUES ($1, $2, $3, $4, 'pendiente')`,
                        [tenant_id, to, JSON.stringify(args.items), args.delivery_address]
                    );
                    finalResponseText += `\n\n✅ ¡Pedido registrado con éxito! Resumen: ${cartText}. Dirección: ${args.delivery_address}.`;
                } else if (toolCall.function.name === 'transfer_to_human') {
                    
                    // Update state in DB instead of cache
                    await pool.query(
                        'INSERT INTO chat_sessions (tenant_id, user_phone, state_data) VALUES ($1, $2, $3) ON CONFLICT (tenant_id, user_phone) DO UPDATE SET state_data = jsonb_set(COALESCE(chat_sessions.state_data, \'{}\'), \'{muted_until}\', $4::jsonb)',
                        [tenant_id, to, JSON.stringify({ muted_until: Date.now() + (2 * 60 * 60 * 1000) }), (Date.now() + (2 * 60 * 60 * 1000)).toString()]
                    );
        
                    finalResponseText += `\n\n👨‍💻 Te estoy transfiriendo con uno de nuestros asesores humanos. Por favor, espera un momento.`;
                }
            }
        }

        if (finalResponseText) {
            // Process images
            const regex = /\[IMG_(\d+)\]/g;
            let textToSend = finalResponseText;
            let match;
            const imagesToSend = [];
            while ((match = regex.exec(finalResponseText)) !== null) {
                imagesToSend.push(match[1]);
                textToSend = textToSend.replace(match[0], '');
            }
            
            await sendWhatsAppText(phone_number_id, token, to, textToSend, tenant_id);

            for (let prod_id of imagesToSend) {
                try {
                    const p = prodResult.rows.find(x => x.id == prod_id);
                    if (p && p.image_url) {
                        await fetch(`https://graph.facebook.com/v19.0/${phone_number_id}/messages`, {
                            method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                            body: JSON.stringify({ messaging_product: `whatsapp`, to: to, type: `image`, image: { link: p.image_url } })
                        });
                        await logMessage(tenant_id, to, 'outbound', 'image', `[Imagen: ${p.name}]`);
                    }
                } catch(e){}
            }
        }

    } catch (error) { console.error(`Error AI:`, error); }
}

const fs = require('fs');

async function transcribeAudio(filePath, tenant_id = null) {
    try {
        const completion = await groq.audio.transcriptions.create({
            file: fs.createReadStream(filePath),
            model: "whisper-large-v3-turbo",
            language: "es", // Forcing Spanish for better regional accuracy
            response_format: "verbose_json"
        });
        if (tenant_id && completion.duration) {
            // Whisper API cost ~$0.006 / minute = $0.0001 per second
            const cost = completion.duration * 0.0001;
            await pool.query(
                'INSERT INTO usage_logs (tenant_id, cost_usd) VALUES ($1, $2)',
                [tenant_id, cost]
            );
        }
        return completion.text;
    } catch (e) {
        console.error("Error en Whisper:", e);
        return "[Error transcribiendo audio]";
    }
}

module.exports = { sendWhatsAppAI, chatCache, transcribeAudio };
