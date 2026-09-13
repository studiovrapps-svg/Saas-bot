const crypto = require('crypto');

const verifyMetaSignature = (req, res, next) => {
    const signature = req.headers['x-hub-signature-256'];
    if (!signature) {
        console.warn('Bloqueado: Webhook sin firma de Meta.');
        return res.sendStatus(403);
    }

    const appSecret = process.env.META_APP_SECRET;
    if (!appSecret) {
        console.error('CRÍTICO: META_APP_SECRET no configurado. Bloqueando tráfico del webhook por seguridad.');
        return res.sendStatus(403);
    }

    if (!req.rawBody) {
        console.warn('Bloqueado: rawBody no disponible para validación HMAC.');
        return res.sendStatus(403);
    }

    const hmac = crypto.createHmac('sha256', appSecret);
    hmac.update(req.rawBody);
    const expectedSignature = `sha256=${hmac.digest('hex')}`;

    if (signature !== expectedSignature) {
        console.warn('Bloqueado: Firma de Webhook de Meta inválida.');
        return res.sendStatus(403);
    }

    next();
};

module.exports = { verifyMetaSignature };
