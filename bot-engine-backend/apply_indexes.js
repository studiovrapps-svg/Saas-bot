const pool = require('./src/config/db');

async function applyIndexes() {
    try {
        console.log("Aplicando índices a PostgreSQL...");

        // 1. Índice para orders (búsquedas rápidas en el dashboard)
        await pool.query('CREATE INDEX IF NOT EXISTS idx_orders_tenant_status ON orders(tenant_id, status);');
        console.log("✅ Índice idx_orders_tenant_status creado.");

        // 2. Índice para products (búsquedas rápidas del tenant)
        await pool.query('CREATE INDEX IF NOT EXISTS idx_products_tenant ON products(tenant_id);');
        console.log("✅ Índice idx_products_tenant creado.");

        // 3. Extensión pg_trgm para búsquedas ILIKE súper veloces
        await pool.query('CREATE EXTENSION IF NOT EXISTS pg_trgm;');
        console.log("✅ Extensión pg_trgm habilitada.");

        // 4. Índice GIN para búsquedas parciales de texto en nombres de productos
        await pool.query('CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING GIN (name gin_trgm_ops);');
        console.log("✅ Índice GIN idx_products_name_trgm creado.");

        console.log("🚀 Todos los índices han sido aplicados con éxito.");
        process.exit(0);
    } catch (error) {
        console.error("Error aplicando índices:", error);
        process.exit(1);
    }
}

applyIndexes();
