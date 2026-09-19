const pool = require('./src/config/db');
pool.query("UPDATE chat_sessions SET state_data = '{}', status = 'bot' WHERE user_phone = '50231226602' AND tenant_id = 2").then(() => {
    console.log('Session reset');
    process.exit(0);
});
