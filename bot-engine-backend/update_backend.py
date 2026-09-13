import re

with open('index.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add sendWhatsAppImage
func_text = """async function sendWhatsAppText(phone_number_id, token, to, text) {
    try {
        await fetch(`https://graph.facebook.com/v19.0/${phone_number_id}/messages`, {
            method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ messaging_product: "whatsapp", to: to, type: "text", text: { body: text } })
        });
    } catch (error) { console.error("Error enviando texto WhatsApp:", error); }
}"""

func_image = """async function sendWhatsAppImage(phone_number_id, token, to, image_url, caption) {
    try {
        await fetch(`https://graph.facebook.com/v19.0/${phone_number_id}/messages`, {
            method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ messaging_product: "whatsapp", to: to, type: "image", image: { link: image_url, caption: caption } })
        });
    } catch (error) { console.error("Error enviando imagen WhatsApp:", error); }
}"""

code = code.replace(func_text, func_text + "\n\n" + func_image)

# 2. Add /api/upload endpoint
upload_endpoint = """app.post('/api/upload', upload.single('image'), async (req, res) => {
    try {
        const file = req.file;
        if (!file) return res.status(400).json({ error: "No se subió imagen" });
        const fileName = `media_${Date.now()}_${Math.floor(Math.random()*1000)}.jpg`;
        const uploadParams = {
            Bucket: bucketName,
            Key: fileName,
            Body: file.buffer,
            ContentType: file.mimetype
        };
        const command = new PutObjectCommand(uploadParams);
        await s3Client.send(command);
        const fileUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
        res.json({ url: fileUrl });
    } catch(err) { res.status(500).json({ error: err.message }); }
});"""

code = code.replace("app.post('/api/productos',", upload_endpoint + "\n\napp.post('/api/productos',")

# 3. Update webhook tier 1 logic
old_logic = """            if (tenant.bot_tier === 1) {
                // Nivel 1: Menú Principal Personalizado
                if (msgObj.type === "interactive" && msgObj.interactive.type === "list_reply") {
                    let btnId = msgObj.interactive.list_reply.id;
                    
                    if (btnId === "btn_catalogo") {
                        await sendWhatsAppMenu(phone_number_id, tenant.whatsapp_token, from, tenant.id, tenant.name);
                    } else if (btnId.startsWith("btn_faq_")) {
                        // Buscar el texto correspondiente en tier1_menu
                        let menus = tenant.tier1_menu || [];
                        let idx = parseInt(btnId.replace("btn_faq_", ""));
                        if (menus[idx]) {
                            await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, menus[idx].response);
                        }
                    } else {
                        // Para los catalogos antiguos (si tocan una hamburguesa directo del catálogo)
                        let productoElegido = msgObj.interactive.list_reply.title;
                        await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, `¡Excelente elección! Has seleccionado: *${productoElegido}*.\n\nEn un momento un asesor humano tomará tu pedido para coordinar el pago y la entrega. ¡Gracias por preferir ${tenant.name}!`);
                    }
                } else {"""

new_logic = """            if (tenant.bot_tier === 1) {
                // Manejo de estado de pedido (Opción 3)
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
                    } else {
                        // Flujo de compra de Catálogo (Opción 3)
                        let productoElegido = msgObj.interactive.list_reply.title;
                        chatCache.set(cacheKey, { step: 'awaiting_quantity', product: productoElegido }, 3600);
                        await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, `¡Excelente elección! Has seleccionado *${productoElegido}*.\n\n¿Cuántas unidades deseas llevar? (Responde con un número)`);
                    }
                } else {
                    // Limpiar estado por si escribió otra cosa
                    chatCache.del(cacheKey);"""

code = code.replace(old_logic, new_logic)

with open('index.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done")
