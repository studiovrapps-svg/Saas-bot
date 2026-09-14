import re

with open('bot-engine-backend/src/services/whatsapp.service.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Add sendWhatsAppTemplate function
template_func = """
async function sendWhatsAppTemplate(phone_number_id, token, to, template_name, language_code = 'es', tenant_id = null) {
    try {
        const payload = {
            messaging_product: "whatsapp",
            to: to,
            type: "template",
            template: {
                name: template_name,
                language: { code: language_code }
            }
        };
        await fetch(`https://graph.facebook.com/v19.0/${phone_number_id}/messages`, {
            method: 'POST', 
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, 
            body: JSON.stringify(payload)
        });
        if (tenant_id) await logMessage(tenant_id, to, 'outbound', 'template', `[Campaña: ${template_name}]`);
    } catch (error) { console.error(`Error enviando plantilla WhatsApp:`, error); }
}
"""

if "sendWhatsAppTemplate" not in code:
    code = code.replace("module.exports = {", template_func + "\nmodule.exports = { sendWhatsAppTemplate,")
    with open('bot-engine-backend/src/services/whatsapp.service.js', 'w', encoding='utf-8') as f:
        f.write(code)
    print("Added sendWhatsAppTemplate to service")
else:
    print("Already exists")
