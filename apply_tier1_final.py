import re

with open('bot-engine-backend/index.js', 'r', encoding='utf-8') as f:
    code = f.read()

pattern = re.compile(r'if\s*\(tenant\.bot_tier === 1\)\s*\{.*?(?=\}\s*else if\s*\(tenant\.bot_tier >= 2\))', re.DOTALL)

# This time I am using standard python string (not raw) and escaping newlines correctly for javascript!
replacement = """if (tenant.bot_tier === 1) {
                // Manejo de estado de pedido (Opción 3 y fotos de producto)
                let cacheKey = `tier1_${tenant.id}_${from}`;
                let state = chatCache.get(cacheKey) || {};

                // --- PILAR 4: MODO SILENCIO ---
                if (state.muted_until && Date.now() < state.muted_until) {
                    return res.sendStatus(200); // Ignorar mientras esté en silencio
                }

                // Helper para enviar menú principal interactivo
                const sendMainMenu = async () => {
                    let menus = tenant.tier1_menu || [];
                    let rows = [{ id: "btn_catalogo", title: "🛍️ Ver productos" }];
                    menus.forEach((m, idx) => {
                        rows.push({ id: `btn_faq_${idx}`, title: m.title.substring(0, 24) });
                    });
                    
                    let payload = {
                        messaging_product: "whatsapp",
                        to: from,
                        type: "interactive",
                        interactive: {
                            type: "list",
                            header: { type: "text", text: "Menú Principal" },
                            body: { text: tenant.tier1_greeting || `¡Hola! Bienvenido a ${tenant.name}. ¿Cómo podemos ayudarte hoy?` },
                            action: {
                                button: "Ver opciones 👇",
                                sections: [{ title: "Opciones disponibles", rows: rows.slice(0,10) }]
                            }
                        }
                    };
                    await fetch(`https://graph.facebook.com/v19.0/${phone_number_id}/messages`, {
                        method: 'POST', headers: { 'Authorization': `Bearer ${tenant.whatsapp_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
                    });
                };

                const sendInteractiveButtons = async (text, buttons) => {
                    let payload = {
                        messaging_product: "whatsapp",
                        to: from,
                        type: "interactive",
                        interactive: {
                            type: "button",
                            body: { text: text },
                            action: {
                                buttons: buttons.map(b => ({ type: "reply", reply: { id: b.id, title: b.title } }))
                            }
                        }
                    };
                    await fetch(`https://graph.facebook.com/v19.0/${phone_number_id}/messages`, {
                        method: 'POST', headers: { 'Authorization': `Bearer ${tenant.whatsapp_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
                    });
                };

                if (msgObj.type === "text") {
                    let text = user_message.toLowerCase();

                    // --- PILAR 4: HANDOFF A HUMANO (Por texto) ---
                    if (text.includes("asesor") || text.includes("humano")) {
                        chatCache.set(cacheKey, { muted_until: Date.now() + 2 * 60 * 60 * 1000 }, 7200); // 2 horas
                        await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, "👨‍💼 *Conectando con un asesor...*\\n\\nHe notificado a nuestro equipo. Un asesor humano leerá este chat y te responderá a la brevedad. (El bot se pausará temporalmente).");
                        
                        // Pasar sesión a humano en DB
                        if (sessionResult.rows.length > 0) {
                            await pool.query("UPDATE chat_sessions SET status = 'humano' WHERE tenant_id = $1 AND user_phone = $2", [tenant.id, from]);
                        } else {
                            await pool.query("INSERT INTO chat_sessions (tenant_id, user_phone, status, platform) VALUES ($1, $2, 'humano', 'whatsapp')", [tenant.id, from]);
                        }
                        return res.sendStatus(200);
                    }

                    // --- PILAR 1: MÁQUINA DE ESTADOS (CARRITO) ---
                    if (state.step === 'awaiting_quantity') {
                        let cart = state.cart || [];
                        cart.push({ product: state.product, quantity: user_message });
                        
                        chatCache.set(cacheKey, { step: 'cart_decision', cart: cart }, 3600);
                        
                        await sendInteractiveButtons("🛒 *Producto añadido al carrito.*\\n\\n¿Deseas seguir comprando o finalizar tu pedido?", [
                            { id: "btn_add_more", title: "➕ Seguir comprando" },
                            { id: "btn_checkout", title: "✅ Finalizar pedido" }
                        ]);
                        return res.sendStatus(200);
                    } 
                    else if (state.step === 'awaiting_address') {
                        let cart = state.cart || [];
                        chatCache.del(cacheKey);
                        
                        let cartSummary = cart.map(item => `📦 ${item.quantity}x ${item.product}`).join("\\n");
                        let finalMsg = `📝 *¡Pedido registrado con éxito!*\\n\\n*Resumen de tu pedido:*\\n${cartSummary}\\n📍 Dirección: ${user_message}\\n\\nUn asesor humano se contactará contigo por aquí en breve para coordinar el pago y la entrega. ¡Gracias por tu compra!`;
                        await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, finalMsg);
                        
                        // Pasar a humano
                        if (sessionResult.rows.length > 0) {
                            await pool.query("UPDATE chat_sessions SET status = 'humano' WHERE tenant_id = $1 AND user_phone = $2", [tenant.id, from]);
                        } else {
                            await pool.query("INSERT INTO chat_sessions (tenant_id, user_phone, status, platform) VALUES ($1, $2, 'humano', 'whatsapp')", [tenant.id, from]);
                        }
                        return res.sendStatus(200);
                    }

                    // --- PILAR 2: GATILLOS DE PALABRAS CLAVE ---
                    let rules = [];
                    try {
                        rules = JSON.parse(tenant.business_rules || "[]");
                    } catch(e) {}
                    
                    let matchedRule = rules.find(r => r.q && r.q.length >= 3 && text.includes(r.q.toLowerCase()));
                    if (matchedRule) {
                        await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, matchedRule.a);
                        await sendInteractiveButtons("¿Puedo ayudarte con algo más?", [
                            { id: "btn_main_menu", title: "🔙 Menú Principal" }
                        ]);
                        return res.sendStatus(200);
                    }

                    // --- PILAR 3: RUTAS DE ESCAPE (FALLBACK ANTI-FRUSTRACIÓN) ---
                    // Si no es un estado, ni keyword, ni handoff, dar mensaje de fallback amigable
                    chatCache.del(cacheKey);
                    await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, "No te comprendí muy bien 😅. Para ayudarte rápido, por favor selecciona una de nuestras opciones:");
                    await sendMainMenu();
                    return res.sendStatus(200);
                }

                if (msgObj.type === "interactive") {
                    let btnId = "";
                    let btnTitle = "";
                    if (msgObj.interactive.type === "list_reply") {
                        btnId = msgObj.interactive.list_reply.id;
                        btnTitle = msgObj.interactive.list_reply.title;
                    } else if (msgObj.interactive.type === "button_reply") {
                        btnId = msgObj.interactive.button_reply.id;
                        btnTitle = msgObj.interactive.button_reply.title;
                    }

                    if (btnId === "btn_main_menu" || btnId === "btn_catalogo") {
                        chatCache.del(cacheKey);
                        if (btnId === "btn_catalogo") {
                            await sendWhatsAppMenu(phone_number_id, tenant.whatsapp_token, from, tenant.id, tenant.name);
                        } else {
                            await sendMainMenu();
                        }
                    } else if (btnId === "btn_add_more") {
                        chatCache.set(cacheKey, { step: 'adding_more', cart: state.cart || [] }, 3600);
                        await sendWhatsAppMenu(phone_number_id, tenant.whatsapp_token, from, tenant.id, tenant.name);
                    } else if (btnId === "btn_checkout") {
                        chatCache.set(cacheKey, { step: 'awaiting_address', cart: state.cart || [] }, 3600);
                        await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, "¡Excelente! 📍 ¿A qué dirección deseas que hagamos el envío de tu pedido completo?");
                    } else if (btnId.startsWith("btn_faq_")) {
                        let menus = tenant.tier1_menu || [];
                        let idx = parseInt(btnId.replace("btn_faq_", ""));
                        if (menus[idx]) {
                            if (menus[idx].image_url) {
                                await sendWhatsAppImage(phone_number_id, tenant.whatsapp_token, from, menus[idx].image_url, menus[idx].response);
                            } else {
                                await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, menus[idx].response);
                            }
                            // Siempre mandar el escape después de un FAQ
                            await sendInteractiveButtons("¿Qué más deseas hacer?", [
                                { id: "btn_main_menu", title: "🔙 Menú Principal" }
                            ]);
                        }
                    } else if (btnId.startsWith("prod_")) {
                        let prodId = btnId.replace("prod_", "");
                        let productoElegido = btnTitle;
                        
                        try {
                            const pRes = await pool.query('SELECT image_url FROM products WHERE id = $1', [prodId]);
                            if (pRes.rows.length > 0 && pRes.rows[0].image_url) {
                                await sendWhatsAppImage(phone_number_id, tenant.whatsapp_token, from, pRes.rows[0].image_url, `Seleccionaste: *${productoElegido}*`);
                            }
                        } catch(e) { console.error("Error buscando foto de producto", e); }

                        chatCache.set(cacheKey, { step: 'awaiting_quantity', product: productoElegido, cart: state.cart || [] }, 3600);
                        await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, "¡Excelente elección! 🌟\\n\\n¿Cuántas unidades deseas llevar? (Responde con un número)");
                    } else {
                        // Fallback fallback
                        await sendMainMenu();
                    }
                }
            } // end tier 1\n"""

new_code = pattern.sub(replacement, code)

with open('bot-engine-backend/index.js', 'w', encoding='utf-8') as f:
    f.write(new_code)

print("Done")
