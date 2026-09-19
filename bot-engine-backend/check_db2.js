const pool = require('./src/config/db');
pool.query("SELECT tenant_id, customer_name FROM chat_sessions WHERE user_phone = '50231226602'").then(res => { console.log(res.rows); process.exit(0); });
