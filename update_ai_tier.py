import re

with open('bot-engine-backend/index.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update the Webhook to check global mute BEFORE routing by tier
old_webhook_routing = """            // Log incoming message
            await logMessage(tenant.id, from, 'inbound', msgObj.type, user_message || "media");
            

            if (tenant.bot_tier === 1) {"""

new_webhook_routing = """            // Log incoming message
            await logMessage(tenant.id, from, 'inbound', msgObj.type, user_message || "media");
            
            // GLOBAL MUTE CHECK (For human handoff in ANY tier)
            let muteKey = `mute_${tenant.id}_${from}`;
            let muteUntil = chatCache.get(muteKey);
            if (muteUntil && Date.now() < muteUntil) {
                return res.sendStatus(200); // Silent mode active
            }

            if (tenant.bot_tier === 1) {"""

code = code.replace(old_webhook_routing, new_webhook_routing)

# 2. Also remove the redundant mute check inside tier 1
old_tier1_mute = """                let cacheKey = `tier1_${tenant.id}_${from}`;
                let state = chatCache.get(cacheKey) || {};

                if (state.muted_until && Date.now() < state.muted_until) {
                    return res.sendStatus(200); 
                }"""
new_tier1_mute = """                let cacheKey = `tier1_${tenant.id}_${from}`;
                let state = chatCache.get(cacheKey) || {};"""
code = code.replace(old_tier1_mute, new_tier1_mute)

# 3. Modify sendWhatsAppAI function completely
old_sendWhatsAppAI_pattern = re.compile(r'async function sendWhatsAppAI\(phone_number_id, token, to, tenant_id, tenant_name, system_prompt, user_message\) \{.*?(?=// ==========================================)', re.DOTALL)

new_sendWhatsAppAI = """async function sendWhatsAppAI(phone_number_id, token, to, tenant_id, tenant_name, system_prompt, user_message) {
    try {
        const prodResult = await pool.query('SELECT * FROM products WHERE tenant_id = $1 AND is_active = true', [tenant_id]);
        const tenantResult = await pool.query('SELECT business_rules FROM tenants WHERE id = $1', [tenant_id]);
        const business_rules = tenantResult.rows[0]?.business_rules || "";
        
        let catalogoTexto = "CATÁLOGO DE PRODUCTOS:\\n";
        if (prodResult.rows.length === 0) catalogoTexto += "No hay productos.\\n";
        prodResult.rows.forEach(p => catalogoTexto += `- ${p.name}: $${p.price} (${p.description}) (ID_FOTO=${p.id})\\n`);

        let faqTexto = "";
        try {
            if (business_rules) {
                const faqs = JSON.parse(business_rules);
                if (Array.isArray(faqs)) {
                    faqs.forEach(f => faqTexto += `PREGUNTA: ${f.q}\\nRESPUESTA: ${f.a}\\n\\n`);
                } else faqTexto = business_rules;
            }
        } catch(e) { faqTexto = business_rules; }

        const basePrompt = `Eres el asistente virtual oficial de ${tenant_name}.
Tu objetivo es atender a los clientes, mostrarles el catálogo y cerrar ventas.

REGLAS CRÍTICAS:
1. RESPONDE SIEMPRE EN 1 O 2 PÁRRAFOS MÁXIMO. Sé cálido y conciso. Evita respuestas largas y robóticas.
2. Usa el formato de WhatsApp (*negritas*, _cursivas_ y emojis 🚀).
3. SIEMPRE utiliza el catálogo para ofrecer productos. NO INVENTES PRODUCTOS NI PRECIOS.
4. Si el cliente quiere realizar un pedido y te ha dado su dirección, o puedes deducirla, DEBES usar la función 'create_order' para guardar el pedido en el sistema. NO uses texto plano para confirmar el pedido, USA LA FUNCIÓN.
5. Si el cliente está frustrado, tiene un problema complejo o pide explícitamente hablar con un humano o asesor, DEBES usar la función 'transfer_to_human'.
6. Si te piden una foto, responde el mensaje e incluye en cualquier parte del texto el código secreto [IMG_X], reemplazando X por el ID_FOTO del producto.

CATÁLOGO:
${catalogoTexto}

REGLAS DEL NEGOCIO / FAQS:
${faqTexto}

INSTRUCCIONES EXTRA DEL DUEÑO:
${system_prompt || "Sé amable y guía al usuario a realizar una compra."}`;

        // 1. Fetch recent message history for memory!
        const historyRes = await pool.query(
            "SELECT direction, content FROM messages WHERE tenant_id = $1 AND customer_phone = $2 ORDER BY created_at ASC LIMIT 10",
            [tenant_id, to]
        );
        
        let messages = [ { role: "system", content: basePrompt } ];
        for (let row of historyRes.rows) {
            messages.push({
                role: row.direction === 'inbound' ? 'user' : 'assistant',
                content: row.content || ''
            });
        }
        
        // Ensure the current user message is always the last one if it wasn't fetched yet
        if (messages.length === 1 || messages[messages.length-1].content !== user_message) {
            messages.push({ role: "user", content: user_message });
        }

        const tools = [
            {
                type: "function",
                function: {
                    name: "create_order",
                    description: "Crea un pedido oficial en el sistema. Úsalo cuando el cliente ya eligió sus productos y sabes su dirección.",
                    parameters: {
                        type: "object",
                        properties: {
                            items: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        product: { type: "string" },
                                        quantity: { type: "integer" }
                                    }
                                }
                            },
                            delivery_address: { type: "string" }
                        },
                        required: ["items", "delivery_address"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "transfer_to_human",
                    description: "Silencia el bot y notifica a un humano. Úsalo si el cliente pide un asesor, está molesto, o tiene dudas que no puedes resolver.",
                    parameters: {
                        type: "object",
                        properties: {
                            reason: { type: "string" }
                        }
                    }
                }
            }
        ];

        const completion = await groq.chat.completions.create({
            messages: messages,
            model: "llama-3.1-70b-versatile", // Mejor modelo para Tool Calling
            temperature: 0.1,
            max_tokens: 800,
            tools: tools,
            tool_choice: "auto"
        });

        const choice = completion.choices[0];
        
        if (choice.message?.tool_calls) {
            for (let toolCall of choice.message.tool_calls) {
                if (toolCall.function.name === "create_order") {
                    const args = JSON.parse(toolCall.function.arguments);
                    
                    // Insert order into DB
                    await pool.query(
                        "INSERT INTO orders (tenant_id, customer_phone, items, delivery_address) VALUES ($1, $2, $3, $4)",
                        [tenant_id, to, JSON.stringify(args.items), args.delivery_address]
                    );
                    
                    const replyMsg = `✅ ¡Pedido registrado con éxito!\n\nEnviaremos tus productos a: *${args.delivery_address}*.\n\nEn breve un asesor se comunicará contigo para confirmar el pago y el envío. ¡Gracias por comprar en ${tenant_name}!`;
                    await sendWhatsAppText(phone_number_id, token, to, replyMsg, tenant_id);
                    
                    // Silenciar bot porque ya compró y requiere que el dueño cobre
                    chatCache.set(`mute_${tenant_id}_${to}`, Date.now() + (2 * 60 * 60 * 1000));
                    return; // Terminamos
                }
                
                if (toolCall.function.name === "transfer_to_human") {
                    // Mute bot for 2 hours
                    chatCache.set(`mute_${tenant_id}_${to}`, Date.now() + (2 * 60 * 60 * 1000));
                    
                    // Update session status in DB
                    await pool.query("UPDATE chat_sessions SET status = 'humano' WHERE tenant_id = $1 AND user_phone = $2", [tenant_id, to]);
                    
                    const replyMsg = `⏳ Entendido. He pausado mis respuestas automáticas. Un asesor humano te responderá lo más pronto posible.`;
                    await sendWhatsAppText(phone_number_id, token, to, replyMsg, tenant_id);
                    return; // Terminamos
                }
            }
        }

        // Si no usó herramientas, enviamos su respuesta de texto normal
        let aiResponse = choice.message?.content || "";
        if (aiResponse) {
            // Manejar magia visual (imágenes)
            const regex = /\\[IMG_(\\d+)\\]/g;
            let match;
            let hasImages = false;
            while ((match = regex.exec(aiResponse)) !== null) {
                hasImages = true;
                const prodId = match[1];
                const p = prodResult.rows.find(row => row.id == prodId);
                if (p && p.image_url) {
                    try {
                        await fetch(`https://graph.facebook.com/v19.0/${phone_number_id}/messages`, {
                            method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                            body: JSON.stringify({ messaging_product: "whatsapp", to: to, type: "image", image: { link: p.image_url } })
                        });
                        await logMessage(tenant_id, to, 'outbound', 'image', `[Imagen: ${p.name}]`);
                    } catch(e){}
                }
            }
            
            // Limpiar la etiqueta de imagen del texto final para que no se vea el código
            let cleanResponse = aiResponse.replace(/\\[IMG_\\d+\\]/g, "").trim();
            if (cleanResponse) {
                await sendWhatsAppText(phone_number_id, token, to, cleanResponse, tenant_id);
            }
        }

    } catch (error) { 
        console.error("AI Error:", error);
    }
}
"""

code = old_sendWhatsAppAI_pattern.sub(new_sendWhatsAppAI, code)

with open('bot-engine-backend/index.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done")
