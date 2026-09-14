const pool = require('./bot-engine-backend/src/config/db');

async function migrate() {
    try {
        console.log("Adding columns to messages table...");
        await pool.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS meta_message_id VARCHAR(255);`);
        await pool.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(50) DEFAULT 'sent';`);
        
        // Create an index on meta_message_id to speed up webhook updates
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_messages_meta_id ON messages(meta_message_id);`);
        
        console.log("Migration complete.");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

migrate();
