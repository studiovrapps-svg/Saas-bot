const fs = require('fs');
let content = fs.readFileSync('src/services/whatsapp.service.js', 'utf-8');

const newTypingFn = `
async function sendTypingIndicator(phone_number_id, token, message_id, tenant_id = null) {
    try {
        const payload = {
            messaging_product: "whatsapp",
            message_id: message_id,
            status: "read",
            typing_indicator: {
                type: "text"
            }
        };
        const response = await fetch(\`https://graph.facebook.com/v20.0/\${phone_number_id}/messages\`, {
            method: 'POST',
            headers: { 'Authorization': \`Bearer \${token}\`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const err = await response.text();
            console.error("Error sending typing indicator:", err);
        }
    } catch (e) {
        console.error("Error in sendTypingIndicator:", e);
    }
}
`;

content = content.replace(/async function sendTypingIndicator[\s\S]*?\} catch \(e\) \{[\s\S]*?\}[\s\S]*?\}/, newTypingFn.trim());

fs.writeFileSync('src/services/whatsapp.service.js', content, 'utf-8');
console.log('whatsapp.service.js updated with real typing indicator.');
