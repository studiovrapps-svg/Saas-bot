const pool = require('../src/config/db');

async function migrate() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS usage_logs (
                id SERIAL PRIMARY KEY,
                tenant_id INT REFERENCES tenants(id) ON DELETE CASCADE,
                prompt_tokens INT DEFAULT 0,
                completion_tokens INT DEFAULT 0,
                cost_usd DECIMAL(10, 6) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Tabla usage_logs creada con xito.");
    } catch (e) {
        console.error("Error creando usage_logs:", e);
    } finally {
        pool.end();
    }
}

migrate();
