require('dotenv').config();
const pool = require('./src/config/db');

async function migrate() {
    try {
        console.log("Adding customer_name to messages table...");
        await pool.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);`);
        
        console.log("Migration complete.");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

migrate();
