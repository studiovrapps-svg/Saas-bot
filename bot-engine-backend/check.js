const { Pool } = require('pg');
const pool = new Pool({
    host: 'bot-engine-db.ckl4ym6usta7.us-east-1.rds.amazonaws.com',
    user: 'postgresadmin',
    password: 'SaaSBotEngine2026!',
    database: 'postgres',
    port: 5432,
    ssl: { rejectUnauthorized: false }
});

async function check() {
    try {
        const res = await pool.query("SELECT id, name, bot_tier, whatsapp_phone_id, whatsapp_token FROM tenants WHERE whatsapp_phone_id = '1307682492428703'");
        console.log(res.rows);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
check();
