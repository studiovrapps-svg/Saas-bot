const fetch = require('node-fetch');
const pool = require('../config/db');

async function sendTelegramAlert(tenant_id, text) {
    if (!process.env.TELEGRAM_BOT_TOKEN) return false;
    const TELEGRAM_API = https://api.telegram.org/bot + process.env.TELEGRAM_BOT_TOKEN;

    try {
        const result = await pool.query('SELECT telegram_chat_id FROM tenants WHERE id = ', [tenant_id]);
        if (result.rows.length === 0 || !result.rows[0].telegram_chat_id) {
            return false;
        }

        const chat_id = result.rows[0].telegram_chat_id;

        const response = await fetch(TELEGRAM_API + '/sendMessage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chat_id,
                text: text,
                parse_mode: 'Markdown'
            })
        });

        const data = await response.json();
        if (!data.ok) {
            console.error('Error enviando alerta por Telegram:', data.description);
            return false;
        }
        return true;
    } catch (error) {
        console.error('Excepción enviando alerta a Telegram:', error);
        return false;
    }
}

async function setWebhook(url) {
    if (!process.env.TELEGRAM_BOT_TOKEN) return;
    const TELEGRAM_API = https://api.telegram.org/bot + process.env.TELEGRAM_BOT_TOKEN;
    try {
        const response = await fetch(TELEGRAM_API + '/setWebhook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: url })
        });
        const data = await response.json();
        console.log('Telegram Webhook Setup:', data.description);
    } catch (error) {
        console.error('Error configurando Telegram Webhook:', error);
    }
}

module.exports = {
    sendTelegramAlert,
    setWebhook
};
