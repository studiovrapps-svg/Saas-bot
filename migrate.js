const pool = require('./bot-engine-backend/db');

async function migrate() {
    try {
        await pool.query('ALTER TABLE tenants ADD COLUMN IF NOT EXISTS tier1_greeting TEXT, ADD COLUMN IF NOT EXISTS tier1_menu JSONB;');
        console.log("Migration successful");
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

migrate();
