const pool = require('./src/config/db');
pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'chat_sessions'").then(r => {
    console.log(r.rows.map(x => x.column_name));
    return pool.query("SELECT * FROM chat_sessions WHERE phone = '50231226602' AND tenant_id = 2");
}).then(r => {
    console.log(r.rows);
    process.exit(0);
}).catch(e => {
    // maybe phone column is different
    console.log("Error:", e.message);
    pool.query("SELECT * FROM chat_sessions LIMIT 1").then(r => {
        console.log("Sample:", r.rows);
        process.exit(0);
    });
});
