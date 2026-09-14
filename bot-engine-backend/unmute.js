const pool = require('./src/config/db');
pool.query("UPDATE chat_sessions SET state_data = '{}'::jsonb, status = 'bot' WHERE tenant_id = 2")
    .then(() => { console.log('Unmuted!'); process.exit(0); })
    .catch(console.error);
