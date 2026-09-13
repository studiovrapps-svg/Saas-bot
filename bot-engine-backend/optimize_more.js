const pool = require('./db');
async function run() {
    try {
        await pool.query('CREATE INDEX IF NOT EXISTS idx_messages_tenant_phone ON messages(tenant_id, customer_phone)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_orders_tenant_created ON orders(tenant_id, created_at DESC)');
        console.log('Indexes created successfully');
    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}
run();
