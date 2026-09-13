const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/bot_engine' });

async function check() {
    const res = await pool.query("SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'tenants'");
    console.log(res.rows);
    process.exit(0);
}
check();
