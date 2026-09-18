const { Pool } = require('pg');
const pool = new Pool({ host: 'bot-engine-db.ckl4ym6usta7.us-east-1.rds.amazonaws.com', user: 'postgresadmin', password: 'SaaSBotEngine2026!', database: 'postgres', port: 5432, ssl: { rejectUnauthorized: false } });
pool.query(`ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255)`).then(() => {
    console.log('Column added');
    process.exit(0);
});
