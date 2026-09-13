require('dotenv').config();
const pool = require('./src/config/db');

async function seedMedia() {
    try {
        const tenantRes = await pool.query("SELECT id FROM tenants WHERE is_active = true LIMIT 1");
        const tenant_id = tenantRes.rows[0].id;
        
        // Inyectar imagen de prueba (Una pizza)
        await pool.query(
            `INSERT INTO messages (tenant_id, customer_phone, direction, message_type, content, delivery_status) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [tenant_id, '50299998888', 'inbound', 'image', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80', 'read']
        );
        
        // Inyectar audio de prueba transcrito
        await pool.query(
            `INSERT INTO messages (tenant_id, customer_phone, direction, message_type, content, delivery_status) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [tenant_id, '50299998888', 'inbound', 'audio', '¿Hola qué tal? Quería saber si tienen servicio a domicilio hasta la zona 10, gracias.', 'read']
        );
        
        console.log("Mensajes multimedia inyectados.");
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
seedMedia();
