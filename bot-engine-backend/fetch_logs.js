const { Pool } = require('pg');
const pool = new Pool({ host: 'bot-engine-db.ckl4ym6usta7.us-east-1.rds.amazonaws.com', user: 'postgresadmin', password: 'SaaSBotEngine2026!', database: 'postgres', port: 5432, ssl: { rejectUnauthorized: false } });
pool.query(`SELECT direction, message_type, content, created_at FROM messages WHERE tenant_id = 3 ORDER BY created_at DESC LIMIT 30`).then(res => {
    console.log(JSON.stringify(res.rows.reverse(), null, 2));
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
