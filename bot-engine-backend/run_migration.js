const { Pool } = require('pg');
const fs = require('fs');
const pool = new Pool({
    host: 'bot-engine-db.ckl4ym6usta7.us-east-1.rds.amazonaws.com',
    user: 'postgresadmin',
    password: 'SaaSBotEngine2026!',
    database: 'postgres',
    port: 5432,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        const sql = fs.readFileSync('bot-engine-backend/migrations/01_add_session_state.sql', 'utf8');
        await pool.query(sql);
        console.log("Migration executed successfully!");
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
run();
