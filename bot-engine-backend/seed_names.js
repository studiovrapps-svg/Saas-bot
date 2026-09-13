require('dotenv').config();
const pool = require('./src/config/db');

async function seedNames() {
    try {
        await pool.query("UPDATE messages SET customer_name = 'Maria' WHERE customer_phone = '50255551111'");
        await pool.query("UPDATE messages SET customer_name = 'Juan Perez' WHERE customer_phone = '50299998888'");
        console.log("Nombres inyectados de ejemplo.");
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
seedNames();
