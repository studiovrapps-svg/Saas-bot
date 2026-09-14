require('dotenv').config();
const { sendWhatsAppAI } = require('./src/services/ai.service');
const pool = require('./src/config/db');

async function test() {
    try {
        const tResult = await pool.query('SELECT * FROM tenants WHERE id = 2');
        const t = tResult.rows[0];
        const ws = require('./src/services/whatsapp.service');
        ws.sendWhatsAppText = async (phone_number_id, token, to, text) => {
            console.log('--- GENERATED TEXT ---');
            console.log(text);
        };
        await sendWhatsAppAI('test', t.whatsapp_token, '50231226602', t.id, t.name, t.system_prompt, 'Hola');
    } catch(e) {
        console.error('Fatal error:', e);
    }
    process.exit(0);
}
test();
