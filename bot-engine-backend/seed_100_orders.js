require('dotenv').config();
const pool = require('./src/config/db');

async function seed100Orders() {
    try {
        const tenantRes = await pool.query("SELECT id FROM tenants WHERE is_active = true LIMIT 1");
        if (tenantRes.rows.length === 0) throw new Error("No active tenant found.");
        const tenant_id = tenantRes.rows[0].id;

        console.log("Inyectando 100 pedidos de prueba...");
        
        for(let i = 1; i <= 100; i++) {
            const phone = `5025555${i.toString().padStart(4, '0')}`;
            // Remove 'total' column which doesn't exist. Let's use delivery_address instead, which is used.
            const items = JSON.stringify([{name: `Producto Simulado ${i}`, qty: 1}]);
            const address = `Calle Falsa ${i}, Ciudad de Prueba`;
            
            await pool.query(
                `INSERT INTO orders (tenant_id, customer_phone, items, delivery_address, status, created_at) 
                 VALUES ($1, $2, $3, $4, 'pendiente', NOW() - INTERVAL '${i} hours')`,
                [tenant_id, phone, items, address]
            );
        }
        
        console.log("¡100 pedidos inyectados con éxito!");
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}
seed100Orders();
