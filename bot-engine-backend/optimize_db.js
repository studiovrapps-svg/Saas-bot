const pool = require('./db');
async function run() {
    try {
        await pool.query('CREATE INDEX IF NOT EXISTS idx_tenants_created_at ON tenants(created_at DESC)');
        console.log('Index created successfully');
    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}
run();
