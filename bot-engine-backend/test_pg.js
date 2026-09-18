require('dotenv').config();
const pool = require('./src/config/db.js');
async function run() {
    await pool.query("INSERT INTO chat_sessions (tenant_id, user_phone, status, state_data) VALUES (3, 'test', 'humano', '{\"muted_until\": 999999}') ON CONFLICT (tenant_id, user_phone) DO UPDATE SET state_data = '{\"muted_until\": 999999}'");
    let r = await pool.query("SELECT state_data FROM chat_sessions WHERE user_phone='test'");
    console.log('Before:', r.rows[0]);
    await pool.query("UPDATE chat_sessions SET status = 'bot', state_data = state_data - 'muted_until' WHERE tenant_id = 3 AND user_phone = 'test'");
    r = await pool.query("SELECT state_data FROM chat_sessions WHERE user_phone='test'");
    console.log('After:', r.rows[0]);
}
run().finally(()=>process.exit(0));
