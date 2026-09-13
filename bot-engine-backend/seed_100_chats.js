require('dotenv').config();
const pool = require('./src/config/db');

async function seed100Chats() {
    try {
        const tenantRes = await pool.query("SELECT id FROM tenants WHERE is_active = true LIMIT 1");
        if (tenantRes.rows.length === 0) throw new Error("No active tenant found.");
        const tenant_id = tenantRes.rows[0].id;

        console.log("Inyectando 100 chats de prueba...");
        
        for(let i = 1; i <= 100; i++) {
            const phone = `5025555${i.toString().padStart(4, '0')}`;
            const name = `Cliente Simulado ${i}`;
            
            // Intervalo de minutos para que tengan distintas fechas de última actividad
            await pool.query(
                `INSERT INTO messages (tenant_id, customer_phone, customer_name, direction, message_type, content, delivery_status, created_at) 
                 VALUES ($1, $2, $3, 'inbound', 'text', 'Hola, quiero información (Prueba)', 'read', NOW() - INTERVAL '${i} minutes')`,
                [tenant_id, phone, name]
            );
        }
        
        console.log("¡100 chats inyectados con éxito!");
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}
seed100Chats();
