const pool = require('../config/db');
const { sendTelegramAlert } = require('../services/telegram.service');
const fetch = require('node-fetch');

const processTelegramWebhook = async (req, res) => {
    try {
        const body = req.body;
        
        if (body.message && body.message.text) {
            const chatId = body.message.chat.id.toString();
            const text = body.message.text.trim();

            if (text.startsWith('/conectar')) {
                const parts = text.split(' ');
                if (parts.length === 3) {
                    const tenantId = parseInt(parts[1]);
                    const pin = parts[2];
                    
                    if (!isNaN(tenantId)) {
                        const check = await pool.query('SELECT telegram_chat_id, whatsapp_phone_id FROM tenants WHERE id = $1', [tenantId]);
                        if (check.rows.length > 0) {
                            const expectedPin = check.rows[0].whatsapp_phone_id ? check.rows[0].whatsapp_phone_id.substring(0, 5) : '00000';
                            if (pin !== expectedPin) {
                                return res.sendStatus(200); // Fail silencioso para evitar fuerza bruta
                            }

                            const existingChat = check.rows[0].telegram_chat_id;
                            
                            if (existingChat && existingChat !== chatId) {
                                await fetch(https://api.telegram.org/bot + process.env.TELEGRAM_BOT_TOKEN + /sendMessage, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        chat_id: chatId,
                                        text: ❌ Error: Esta tienda ya está conectada a otro número de Telegram. Usa /desconectar desde la cuenta original primero.
                                    })
                                });
                                return res.sendStatus(200);
                            }
                        }

                        await pool.query('UPDATE tenants SET telegram_chat_id =  WHERE id = ', [chatId, tenantId]);
                        
                        await fetch(https://api.telegram.org/bot + process.env.TELEGRAM_BOT_TOKEN + /sendMessage, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                chat_id: chatId,
                                text: ✅ <b>¡Listo!</b>\n\nEste chat ha sido enlazado exitosamente a la tienda (Tenant ID: ).\n\nA partir de ahora, recibirás alertas de ventas y leads aquí.,
                                parse_mode: 'HTML'
                            })
                        });
                    }
                }
            } else if (text.startsWith('/desconectar')) {
                const result = await pool.query('UPDATE tenants SET telegram_chat_id = NULL WHERE telegram_chat_id =  RETURNING id', [chatId]);
                if (result.rowCount > 0) {
                    await fetch(https://api.telegram.org/bot + process.env.TELEGRAM_BOT_TOKEN + /sendMessage, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            chat_id: chatId,
                            text: 🔌 Desconectado exitosamente de la tienda.
                        })
                    });
                }
            }
        }
        
        res.sendStatus(200);
    } catch (error) {
        console.error('Error en webhook de Telegram:', error);
        res.sendStatus(200);
    }
};

module.exports = {
    processTelegramWebhook
};
