const fs = require('fs');

// Fix 1: Add tenant.id to webhook.controller.js for sendWhatsAppText and sendWhatsAppImage
let webhookStr = fs.readFileSync('bot-engine-backend/src/controllers/webhook.controller.js', 'utf8');

// Use a simple replace for all known patterns:
webhookStr = webhookStr.replace(/sendWhatsAppText\(phone_number_id, tenant\.whatsapp_token, from, ([^,)]+)\)/g, 'sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, $1, tenant.id)');
webhookStr = webhookStr.replace(/sendWhatsAppText\(phone_number_id, tenant\.whatsapp_token, from, ([^;]+)\);/g, (match) => {
    if (match.includes(', tenant.id')) return match;
    return match.replace(/\);$/, ', tenant.id);');
});

webhookStr = webhookStr.replace(/sendWhatsAppImage\(phone_number_id, tenant\.whatsapp_token, from, ([^,]+), ([^,)]+)\)/g, 'sendWhatsAppImage(phone_number_id, tenant.whatsapp_token, from, $1, $2, tenant.id)');

fs.writeFileSync('bot-engine-backend/src/controllers/webhook.controller.js', webhookStr);

// Fix 2: AI Tool Schema - add price
let aiStr = fs.readFileSync('bot-engine-backend/src/services/ai.service.js', 'utf8');
aiStr = aiStr.replace(/"quantity":\s*\{\s*"type":\s*"number"\s*\}/g, '"quantity": { "type": "number" }, "price": { "type": "number", "description": "Precio unitario del producto" }');
aiStr = aiStr.replace(/"required":\s*\["product",\s*"quantity"\]/g, '"required": ["product", "quantity", "price"]');
fs.writeFileSync('bot-engine-backend/src/services/ai.service.js', aiStr);

console.log("Fixes applied successfully.");
