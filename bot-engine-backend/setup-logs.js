const pool = require('./src/config/db');

async function run() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_logs (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
        level VARCHAR(20) NOT NULL,
        event_type VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        details JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Add some indexes for faster querying
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_system_logs_tenant ON system_logs(tenant_id);`);
    
    console.log('system_logs table created successfully.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
