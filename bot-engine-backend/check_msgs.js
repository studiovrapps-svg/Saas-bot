const pool = require('./src/config/db');
pool.query("SELECT content, message_type FROM messages WHERE tenant_id = 2 ORDER BY created_at DESC LIMIT 5").then(res => {
    console.log(res.rows);
    process.exit(0);
});
