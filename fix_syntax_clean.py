import re

with open('bot-engine-backend/index.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace the whole block of msgObj.type === "text" to fix all syntax errors
pattern = re.compile(r'if \(msgObj\.type === "text"\) \{.*?(?=if \(msgObj\.type === "interactive"\) \{)', re.DOTALL)

clean_block = """if (msgObj.type === "text") {
                    let text = user_message.toLowerCase();

                    // --- PILAR 4: HANDOFF A HUMANO (Por texto) ---
                    if (text.includes("asesor") || text.includes("humano")) {
                        chatCache.set(cacheKey, { muted_until: Date.now() + 2 * 60 * 60 * 1000 }, 7200); // 2 horas
                        await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, `👨‍💼 *Conectando con un asesor...*\\n\\nHe notificado a nuestro equipo. Un asesor humano leerá este chat y te responderá a la brevedad. (El bot se pausará temporalmente).`);
                        
                        // Pasar sesión a humano en DB
                        const sessionResult = await pool.query("SELECT id FROM chat_sessions WHERE tenant_id = $1 AND user_phone = $2", [tenant.id, from]);
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
                        
                        await sendInteractiveButtons(`🛒 *Producto añadido al carrito.*\\n\\n¿Deseas seguir comprando o finalizar tu pedido?`, [
                            { id: "btn_add_more", title: "🛍️ Seguir comprando" },
                            { id: "btn_checkout", title: "✅ Finalizar pedido" }
                        ]);
                        return res.sendStatus(200);
                    } 
                    else if (state.step === 'awaiting_address') {
                        let cart = state.cart || [];
                        chatCache.del(cacheKey);
                        
                        let cartSummary = cart.map(item => `📦 ${item.quantity}x ${item.product}`).join("\\n");
                        let finalMsg = `✅ *¡Pedido registrado con éxito!*\\n\\n*Resumen de tu pedido:*\\n${cartSummary}\\n📍 Dirección: ${user_message}\\n\\nUn asesor humano se contactará contigo por aquí en breve para coordinar el pago y la entrega. ¡Gracias por tu compra!`;
                        await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, finalMsg);
                        
                        // Insert into orders
                        await pool.query(
                            "INSERT INTO orders (tenant_id, customer_phone, items, delivery_address) VALUES ($1, $2, $3, $4)",
                            [tenant.id, from, JSON.stringify(cart), user_message]
                        );
                        
                        // Pasar a humano
                        const sessionResult = await pool.query("SELECT id FROM chat_sessions WHERE tenant_id = $1 AND user_phone = $2", [tenant.id, from]);
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
                    chatCache.del(cacheKey);
                    await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, "No te comprendí muy bien 😅. Para ayudarte rápido, por favor selecciona una de nuestras opciones:");
                    await sendMainMenu();
                    return res.sendStatus(200);
                }

                """

code = pattern.sub(clean_block, code)

with open('bot-engine-backend/index.js', 'w', encoding='utf-8') as f:
    f.write(code)
print("Done")
