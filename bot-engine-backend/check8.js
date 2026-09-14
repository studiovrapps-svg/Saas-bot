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
        const res = await pool.query("SELECT * FROM system_logs ORDER BY created_at DESC LIMIT 5");
        console.log(res.rows);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
check();
