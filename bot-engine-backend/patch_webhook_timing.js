const fs = require('fs');

let code = fs.readFileSync('C:/Antigravity/Chatbots/bot-engine-backend/src/controllers/webhook.controller.js', 'utf8');

const oldSecurityBlock = `    // Validar Firma Criptográfica de Meta (Auditoría QA)
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
    }`;

const newSecurityBlock = `    // Validar Firma Criptográfica de Meta de forma Segura (Auditoría QA)
    if (process.env.META_APP_SECRET) {
        const signature = req.headers['x-hub-signature-256'];
        if (!signature || !req.rawBody) {
            console.error("Falta firma x-hub-signature-256 o cuerpo en la petición");
            return res.sendStatus(401);
        }
        
        const expectedSignature = 'sha256=' + crypto.createHmac('sha256', process.env.META_APP_SECRET).update(req.rawBody).digest('hex');
        
        const sigBuffer = Buffer.from(signature);
        const expectedBuffer = Buffer.from(expectedSignature);
        
        if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
            console.error("Firma de Meta inválida. Posible ataque de Spoofing o Timing Attack.");
            return res.sendStatus(401);
        }
    }`;

// Use string replacement
code = code.replace(oldSecurityBlock, newSecurityBlock);

// One tiny detail: if META_APP_SECRET is a dummy like "tu_app_secret_aqui", it will block all valid requests during testing if the user hasn't configured it yet. But the subagent noted this. We should probably leave it as is so the user is forced to configure it for production. 

fs.writeFileSync('C:/Antigravity/Chatbots/bot-engine-backend/src/controllers/webhook.controller.js', code);
console.log("webhook.controller.js fully secured against timing attacks and bypasses!");
