const fs = require('fs');
let aiService = fs.readFileSync('src/services/whatsapp.service.js', 'utf-8');

const regex = /async function sendTypingIndicator[\s\S]*?\} catch \(error\) \{[\s\S]*?\}/;

const newFn = `async function sendTypingIndicator(phone_number_id, token, message_id, to_phone, tenant_id = null) {
    try {
        // Enviar "leído" y "escribiendo" al mismo tiempo (como lo exige la API Cloud v20+)
        const payload = {
            messaging_product: "whatsapp",
            status: "read",
            message_id: message_id,
            to: to_phone,
            typing_indicator: { type: "text" }
        };
        
        await fetch(\`https://graph.facebook.com/v19.0/\${phone_number_id}/messages\`, {
            method: 'POST',
            headers: { 'Authorization': \`Bearer \${token}\`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch (error) {
        console.error(\`Error enviando typing indicator:\`, error);
    }
}`;

if (aiService.match(regex)) {
    aiService = aiService.replace(regex, newFn);
    fs.writeFileSync('src/services/whatsapp.service.js', aiService, 'utf-8');
    console.log("Patched successfully");
} else {
    console.log("Regex not found");
}
