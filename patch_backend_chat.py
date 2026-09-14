import re

with open('bot-engine-backend/index.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add logMessage function
log_message_fn = """
async function logMessage(tenant_id, phone, direction, type, content) {
    try {
        await pool.query(
            "INSERT INTO messages (tenant_id, customer_phone, direction, message_type, content) VALUES ($1, $2, $3, $4, $5)",
            [tenant_id, phone, direction, type, content]
        );
    } catch (e) {
        console.error("Error logging message:", e);
    }
}

// --- FUNCIONES DEL BOT (WHATSAPP API) ---"""
code = code.replace("// --- FUNCIONES DEL BOT (WHATSAPP API) ---", log_message_fn)

# 2. Update sendWhatsAppText
old_swt = """async function sendWhatsAppText(phone_number_id, token, to, text) {
    try {
        await fetch(`https://graph.facebook.com/v19.0/${phone_number_id}/messages`, {
            method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ messaging_product: "whatsapp", to: to, type: "text", text: { body: text } })
        });
    } catch (error) { console.error("Error enviando texto WhatsApp:", error); }
}"""
new_swt = """async function sendWhatsAppText(phone_number_id, token, to, text, tenant_id = null) {
    try {
        await fetch(`https://graph.facebook.com/v19.0/${phone_number_id}/messages`, {
            method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ messaging_product: "whatsapp", to: to, type: "text", text: { body: text } })
        });
        if (tenant_id) await logMessage(tenant_id, to, 'outbound', 'text', text);
    } catch (error) { console.error("Error enviando texto WhatsApp:", error); }
}"""
code = code.replace(old_swt, new_swt)

# 3. Update all sendWhatsAppText calls to pass tenant.id
# We'll just regex replace sendWhatsAppText(..., text) -> sendWhatsAppText(..., text, tenant.id)
# It's usually called as: sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, "...") 
# or sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, finalMsg)
# Let's just blindly append tenant.id or tenant_id depending on context. Wait, in sendWhatsAppAI, it uses tenant_id.
# Let's just use string replacement on known lines, or rely on regex.
code = re.sub(r'(sendWhatsAppText\(phone_number_id,\s*tenant\.whatsapp_token,\s*from,\s*)([^)]+)(\))', r'\1\2, tenant.id\3', code)
code = re.sub(r'(sendWhatsAppText\(phone_number_id,\s*token,\s*to,\s*)([^)]+)(\))', r'\1\2, tenant_id\3', code)


# 4. Log incoming messages in Webhook
webhook_inbound = """            let user_message = "";
            let msgObj = body.entry[0].changes[0].value.messages[0];
            if (msgObj.type === "text") user_message = msgObj.text.body;
            else if (msgObj.type === "interactive") {
                if (msgObj.interactive.type === "list_reply") user_message = msgObj.interactive.list_reply.title;
                else if (msgObj.interactive.type === "button_reply") user_message = msgObj.interactive.button_reply.title;
            }"""

webhook_inbound_with_log = """            let user_message = "";
            let msgObj = body.entry[0].changes[0].value.messages[0];
            if (msgObj.type === "text") user_message = msgObj.text.body;
            else if (msgObj.type === "interactive") {
                if (msgObj.interactive.type === "list_reply") user_message = msgObj.interactive.list_reply.title;
                else if (msgObj.interactive.type === "button_reply") user_message = msgObj.interactive.button_reply.title;
            }
            
            // Log incoming message
            await logMessage(tenant.id, from, 'inbound', msgObj.type, user_message || "media");
            """
code = code.replace(webhook_inbound, webhook_inbound_with_log)

# 5. Log interactive menus
old_sim = """                const sendInteractiveButtons = async (text, buttons) => {
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
                };"""
new_sim = """                const sendInteractiveButtons = async (text, buttons) => {
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
                    await logMessage(tenant.id, from, 'outbound', 'interactive', text);
                };"""
code = code.replace(old_sim, new_sim)

# 6. Add Chat Endpoints (GET and POST for manual replies)
chat_endpoints = """
// ==========================================
// ENDPOINTS DE LIVE CHAT
// ==========================================

app.get('/api/tenant/:id/chats', async (req, res) => {
    try {
        // Obtenemos el último mensaje por cada cliente
        const result = await pool.query(`
            SELECT customer_phone, 
                   MAX(created_at) as last_activity
            FROM messages 
            WHERE tenant_id = $1 
            GROUP BY customer_phone 
            ORDER BY last_activity DESC
        `, [req.params.id]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error interno" });
    }
});

app.get('/api/tenant/:id/chats/:phone', async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM messages WHERE tenant_id = $1 AND customer_phone = $2 ORDER BY created_at ASC", 
            [req.params.id, req.params.phone]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error interno" });
    }
});

app.post('/api/tenant/:id/chats/:phone/send', async (req, res) => {
    try {
        const { text } = req.body;
        const tenant_id = req.params.id;
        const to = req.params.phone;

        const tenantRes = await pool.query('SELECT whatsapp_token, whatsapp_phone_id FROM tenants WHERE id = $1', [tenant_id]);
        if (tenantRes.rows.length === 0) return res.status(404).json({ error: "Tenant no encontrado" });
        
        const tenant = tenantRes.rows[0];

        // Send via Meta API
        await fetch(`https://graph.facebook.com/v19.0/${tenant.whatsapp_phone_id}/messages`, {
            method: 'POST', headers: { 'Authorization': `Bearer ${tenant.whatsapp_token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ messaging_product: "whatsapp", to: to, type: "text", text: { body: text } })
        });

        // Log message
        await pool.query(
            "INSERT INTO messages (tenant_id, customer_phone, direction, message_type, content) VALUES ($1, $2, $3, $4, $5)",
            [tenant_id, to, 'outbound', 'text', text]
        );

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error enviando mensaje" });
    }
});
"""

code = code.replace("// ENDPOINTS DE PEDIDOS (ORDERS)", chat_endpoints + "\n// ENDPOINTS DE PEDIDOS (ORDERS)")

with open('bot-engine-backend/index.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done")
