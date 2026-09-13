import re

with open('index.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace the entire if (tenant.bot_tier === 1) block inside the webhook
pattern = r'if \(tenant\.bot_tier === 1\) \{[\s\S]*?let menus = tenant\.tier1_menu \|\| \[\];\s*let rows = \[\{ id: "btn_catalogo"'

new_logic = """if (tenant.bot_tier === 1) {
                // Manejo de estado de pedido (Opción 3 y fotos de producto)
                let cacheKey = `tier1_${tenant.id}_${from}`;
                let state = chatCache.get(cacheKey);

                if (state && msgObj.type === "text") {
                    if (state.step === 'awaiting_quantity') {
                        chatCache.set(cacheKey, { step: 'awaiting_address', product: state.product, quantity: user_message }, 3600);
                        await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, "¡Anotado! 📝 ¿A qué dirección deseas que hagamos el envío de tu pedido?");
                        return res.sendStatus(200);
                    } else if (state.step === 'awaiting_address') {
                        chatCache.del(cacheKey);
                        let finalMsg = `✅ *¡Pedido registrado con éxito!*\n\n*Resumen de tu pedido:*\n📦 Producto: ${state.product}\n🔢 Cantidad: ${state.quantity}\n📍 Dirección: ${user_message}\n\nUn asesor humano se contactará contigo por aquí en breve para coordinar el pago y la entrega. ¡Gracias por tu compra!`;
                        await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, finalMsg);
                        
                        // Pasar a humano
                        if (sessionResult.rows.length > 0) {
                            await pool.query("UPDATE chat_sessions SET status = 'humano' WHERE tenant_id = $1 AND user_phone = $2", [tenant.id, from]);
                        } else {
                            await pool.query("INSERT INTO chat_sessions (tenant_id, user_phone, status, platform) VALUES ($1, $2, 'humano', 'whatsapp')", [tenant.id, from]);
                        }
                        return res.sendStatus(200);
                    }
                }

                // Nivel 1: Menú Principal Personalizado
                if (msgObj.type === "interactive" && msgObj.interactive.type === "list_reply") {
                    let btnId = msgObj.interactive.list_reply.id;
                    
                    if (btnId === "btn_catalogo") {
                        await sendWhatsAppMenu(phone_number_id, tenant.whatsapp_token, from, tenant.id, tenant.name);
                    } else if (btnId.startsWith("btn_faq_")) {
                        let menus = tenant.tier1_menu || [];
                        let idx = parseInt(btnId.replace("btn_faq_", ""));
                        if (menus[idx]) {
                            if (menus[idx].image_url) {
                                await sendWhatsAppImage(phone_number_id, tenant.whatsapp_token, from, menus[idx].image_url, menus[idx].response);
                            } else {
                                await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, menus[idx].response);
                            }
                        }
                    } else if (btnId.startsWith("prod_")) {
                        // Flujo de compra de Catálogo (Opción 3)
                        let prodId = btnId.replace("prod_", "");
                        let productoElegido = msgObj.interactive.list_reply.title;
                        
                        // Enviar la foto del producto primero
                        try {
                            const pRes = await pool.query('SELECT image_url FROM products WHERE id = $1', [prodId]);
                            if (pRes.rows.length > 0 && pRes.rows[0].image_url) {
                                await sendWhatsAppImage(phone_number_id, tenant.whatsapp_token, from, pRes.rows[0].image_url, `Seleccionaste: *${productoElegido}*`);
                            }
                        } catch(e) { console.error("Error buscando foto de producto", e); }

                        chatCache.set(cacheKey, { step: 'awaiting_quantity', product: productoElegido }, 3600);
                        await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, `¡Excelente elección! 🛒\n\n¿Cuántas unidades deseas llevar? (Responde con un número)`);
                    } else {
                        // Respaldo para catalogos antiguos
                        let productoElegido = msgObj.interactive.list_reply.title;
                        chatCache.set(cacheKey, { step: 'awaiting_quantity', product: productoElegido }, 3600);
                        await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, `¡Excelente elección! Has seleccionado *${productoElegido}*.\n\n¿Cuántas unidades deseas llevar? (Responde con un número)`);
                    }
                } else {
                    // Limpiar estado por si escribió otra cosa
                    chatCache.del(cacheKey);
                    
                    let menus = tenant.tier1_menu || [];
                    let rows = [{ id: "btn_catalogo", """

code = re.sub(pattern, new_logic, code)

with open('index.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done")
