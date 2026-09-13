require('dotenv').config();
const pool = require('./src/config/db');

async function seedLongConversation() {
    try {
        const tenantRes = await pool.query("SELECT id FROM tenants WHERE is_active = true LIMIT 1");
        if (tenantRes.rows.length === 0) throw new Error("No active tenant found.");
        const tenant_id = tenantRes.rows[0].id;

        const phone = '50255550001';
        const name = 'Cliente Simulado 1';

        console.log("Inyectando 200 mensajes a Cliente Simulado 1...");
        
        // Vamos de 200 a 1 para que el mensaje 200 sea hace 200 minutos (el más viejo)
        // y el 1 sea hace 1 minuto (el más nuevo).
        for(let i = 200; i >= 1; i--) {
            const numMsg = 201 - i;
            const isOutbound = numMsg % 2 === 0; // Pares son respuestas nuestras
            const direction = isOutbound ? 'outbound' : 'inbound';
            const content = isOutbound 
                ? `Esta es una respuesta simulada del asesor al mensaje #${numMsg}. Aquí te envío la información solicitada.` 
                : `Hola, tengo una duda número ${numMsg}. ¿Podrían ayudarme con esto?`;
            const status = isOutbound ? 'read' : null;

            await pool.query(
                `INSERT INTO messages (tenant_id, customer_phone, customer_name, direction, message_type, content, delivery_status, created_at) 
                 VALUES ($1, $2, $3, $4, 'text', $5, $6, NOW() - INTERVAL '${i} minutes')`,
                [tenant_id, phone, name, direction, content, status]
            );
        }
        
        console.log("¡200 mensajes inyectados con éxito!");
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}
seedLongConversation();
