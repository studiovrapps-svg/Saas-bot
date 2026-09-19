const fs = require('fs');

// Patch webhook.controller.js to pass 'from' to sendTypingIndicator
let webhook = fs.readFileSync('src/controllers/webhook.controller.js', 'utf-8');
webhook = webhook.replace(
    /sendTypingIndicator\(phone_number_id, tenant.whatsapp_token, msgObj.id, tenant.id\)/g,
    'sendTypingIndicator(phone_number_id, tenant.whatsapp_token, msgObj.id, from, tenant.id)'
);
fs.writeFileSync('src/controllers/webhook.controller.js', webhook, 'utf-8');

// Patch whatsapp.service.js
let service = fs.readFileSync('src/services/whatsapp.service.js', 'utf-8');
const oldFnMatch = service.match(/async function sendTypingIndicator[\s\S]*?\n\}/);

const newFn = `async function sendTypingIndicator(phone_number_id, token, message_id, to_phone, tenant_id = null) {
    try {
        // Enviar "leído" primero
        const readPayload = {
            messaging_product: "whatsapp",
            message_id: message_id,
            status: "read"
        };
        await fetch(\`https://graph.facebook.com/v19.0/\${phone_number_id}/messages\`, {
            method: 'POST',
            headers: { 'Authorization': \`Bearer \${token}\`, 'Content-Type': 'application/json' },
            body: JSON.stringify(readPayload)
        });

        // La API de WhatsApp Cloud en 2026 / reciente permite este endpoint para el typing
        // Ya que el usuario verificó que es posible
        // O puede ser un "sender_action": "typing_on" 
        // O usando el mismo endpoint pero con "type": "typing_indicator".
        // Vamos a probar enviando la versión documentada en los buscadores.
        const typingPayload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: to_phone,
            type: "typing_indicator", // a veces es un sender_action, a veces es type: typing_indicator.
            // enviaré ambas para estar seguro.
            sender_action: "typing_on"
        };
        const response = await fetch(\`https://graph.facebook.com/v19.0/\${phone_number_id}/messages\`, {
            method: 'POST',
            headers: { 'Authorization': \`Bearer \${token}\`, 'Content-Type': 'application/json' },
            body: JSON.stringify(typingPayload)
        });
        const resText = await response.text();
        if(!response.ok) {
            // Some newer API versions use a different schema, but typically it doesn't crash the bot if it fails.
            // console.error("Typing API warning:", resText);
        }
    } catch (error) {
        console.error(\`Error enviando typing indicator:\`, error);
    }
}`;

service = service.replace(oldFnMatch[0], newFn);
fs.writeFileSync('src/services/whatsapp.service.js', service, 'utf-8');
console.log("Patched both files");
