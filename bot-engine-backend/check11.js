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
        const res = await pool.query("SELECT created_at, content, meta_message_id FROM messages WHERE direction = 'inbound' AND content = 'Hola' ORDER BY created_at DESC LIMIT 10");
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
check();
