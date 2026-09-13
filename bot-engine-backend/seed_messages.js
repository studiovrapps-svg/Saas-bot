const pool = require('./db');

async function seedMessages() {
    try {
        const tenant_id = 1;
        const now = new Date().getTime();
        
        // Helper to format timestamp for postgres or just use NOW() - interval
        // Actually, we can just insert them synchronously with slight delays or explicit timestamps.
        
        const queries = [
            // Conversation 1 (Customer: 50255551111)
            `INSERT INTO messages (tenant_id, customer_phone, direction, message_type, content, created_at) VALUES (1, '50255551111', 'inbound', 'text', 'Hola, buenas tardes.', NOW() - INTERVAL '2 hours')`,
            `INSERT INTO messages (tenant_id, customer_phone, direction, message_type, content, created_at) VALUES (1, '50255551111', 'outbound', 'text', '¡Hola! Bienvenido a CDS Premium. Selecciona una opción del menú.', NOW() - INTERVAL '1 hour 59 minutes')`,
            `INSERT INTO messages (tenant_id, customer_phone, direction, message_type, content, created_at) VALUES (1, '50255551111', 'inbound', 'text', 'Quisiera hablar con un asesor', NOW() - INTERVAL '1 hour 58 minutes')`,
            `INSERT INTO messages (tenant_id, customer_phone, direction, message_type, content, created_at) VALUES (1, '50255551111', 'outbound', 'text', 'Un asesor se pondrá en contacto contigo pronto.', NOW() - INTERVAL '1 hour 58 minutes')`,
            `INSERT INTO messages (tenant_id, customer_phone, direction, message_type, content, created_at) VALUES (1, '50255551111', 'outbound', 'text', '¡Hola! Soy Carlos, tu asesor asignado. ¿En qué puedo ayudarte?', NOW() - INTERVAL '1 hour 30 minutes')`,
            `INSERT INTO messages (tenant_id, customer_phone, direction, message_type, content, created_at) VALUES (1, '50255551111', 'inbound', 'text', 'Me interesa adquirir una suscripción anual.', NOW() - INTERVAL '5 minutes')`,

            // Conversation 2 (Customer: 50299998888)
            `INSERT INTO messages (tenant_id, customer_phone, direction, message_type, content, created_at) VALUES (1, '50299998888', 'inbound', 'text', 'Precio de la Pizza Familiar?', NOW() - INTERVAL '10 minutes')`,
            `INSERT INTO messages (tenant_id, customer_phone, direction, message_type, content, created_at) VALUES (1, '50299998888', 'outbound', 'text', 'La Pizza Familiar tiene un valor de Q99.00.', NOW() - INTERVAL '9 minutes')`,
            `INSERT INTO messages (tenant_id, customer_phone, direction, message_type, content, created_at) VALUES (1, '50299998888', 'inbound', 'text', 'Excelente, envíenme una a la zona 10 por favor.', NOW() - INTERVAL '1 minute')`
        ];

        for (let q of queries) {
            await pool.query(q);
        }
        
        console.log("Mock messages inserted!");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

seedMessages();
