const pool = require('../config/db');
const { sendTelegramAlert } = require('../services/telegram.service');

const processTelegramWebhook = async (req, res) => {
    try {
        const body = req.body;
        
        // Telegram manda actualizaciones aquí
        if (body.message && body.message.text) {
            const chatId = body.message.chat.id;
            const text = body.message.text.trim();

            if (text.startsWith('/conectar')) {
                const parts = text.split(' ');
                if (parts.length === 2) {
                    const tenantId = parseInt(parts[1]);
                    
                    if (!isNaN(tenantId)) {
                        // Guardar el chat_id en la BD para este tenant
                        await pool.query('UPDATE tenants SET telegram_chat_id =  WHERE id = ', [chatId.toString(), tenantId]);
                        
                        // Enviar confirmación al Telegram del admin
                        const fetch = require('node-fetch');
                        await fetch(https://api.telegram.org/bot + process.env.TELEGRAM_BOT_TOKEN + /sendMessage, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                chat_id: chatId,
                                text: ✅ ¡Listo! Este chat ha sido enlazado exitosamente a la tienda (Tenant ID: ).\n\nA partir de ahora, recibirás alertas de ventas y leads aquí.,
                                parse_mode: 'Markdown'
                            })
                        });
                    }
                }
            }
        }
        
        res.sendStatus(200);
    } catch (error) {
        console.error('Error en webhook de Telegram:', error);
        res.sendStatus(200); // Siempre responder 200 a Telegram para que no reintente
    }
};

module.exports = {
    processTelegramWebhook
};
