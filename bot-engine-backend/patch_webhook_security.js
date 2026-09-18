const fs = require('fs');

let code = fs.readFileSync('C:/Antigravity/Chatbots/bot-engine-backend/src/controllers/webhook.controller.js', 'utf8');

if (!code.includes("const crypto = require('crypto');")) {
    code = "const crypto = require('crypto');\n" + code;
}

const oldProcessWebhook = "const processWebhook = (req, res) => {\\n    res.sendStatus(200);";
const newProcessWebhook = `const processWebhook = (req, res) => {
    // Validar Firma Criptográfica de Meta (Auditoría QA)
    if (process.env.META_APP_SECRET && req.rawBody) {
        const signature = req.headers['x-hub-signature-256'];
        if (!signature) {
            console.error("Falta la firma x-hub-signature-256 de Meta");
            return res.sendStatus(401);
        }
        
        const expectedSignature = 'sha256=' + crypto.createHmac('sha256', process.env.META_APP_SECRET).update(req.rawBody).digest('hex');
        if (signature !== expectedSignature) {
            console.error("Firma de Meta inválida. Posible ataque de Spoofing.");
            return res.sendStatus(401);
        }
    }

    res.sendStatus(200);`;

// Escape regex
code = code.replace("const processWebhook = (req, res) => {\r\n    res.sendStatus(200);", newProcessWebhook);
code = code.replace("const processWebhook = (req, res) => {\n    res.sendStatus(200);", newProcessWebhook);

fs.writeFileSync('C:/Antigravity/Chatbots/bot-engine-backend/src/controllers/webhook.controller.js', code);
console.log("webhook.controller.js secured with crypto signature!");
