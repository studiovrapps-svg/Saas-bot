const pool = require('./src/config/db');
pool.query("DELETE FROM messages WHERE customer_phone = '50231226602'").then(() => {
    console.log("Historial limpiado.");
    process.exit(0);
});
