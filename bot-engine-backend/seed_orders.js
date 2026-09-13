require('dotenv').config();
const pool = require('./src/config/db');

async function seedOrder() {
    try {
        console.log("Creando pedido de ejemplo...");
        
        // 1. Get the first active tenant (CDS Premium likely)
        const tenantRes = await pool.query("SELECT id FROM tenants WHERE is_active = true LIMIT 1");
        if (tenantRes.rows.length === 0) {
            console.log("No hay tenants activos.");
            process.exit(1);
        }
        const tenant_id = tenantRes.rows[0].id;
        
        // 2. Prepare mock cart items
        const cart = [
            { name: "Pizza Familiar Pepperoni", qty: 2, price: 99.00 },
            { name: "Gaseosa 2L", qty: 1, price: 20.00 }
        ];
        
        // 3. Insert order
        // Columns usually: tenant_id, customer_phone, items (jsonb or text), delivery_address
        // Let's also check if status exists. If not, the insert will fail but we'll see.
        await pool.query(
            `INSERT INTO orders (tenant_id, customer_phone, items, delivery_address) 
             VALUES ($1, $2, $3, $4)`,
            [tenant_id, '+50299998888', JSON.stringify(cart), 'Zona 10, Edificio Margaritas, Apto 402']
        );
        
        console.log("Pedido de ejemplo creado exitosamente!");
        process.exit(0);
    } catch (e) {
        console.error("Error creating order:", e);
        process.exit(1);
    }
}

seedOrder();
