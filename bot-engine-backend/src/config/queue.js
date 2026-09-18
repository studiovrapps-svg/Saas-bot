const PgBoss = require('pg-boss');
require('dotenv').config();

const boss = new PgBoss({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: { rejectUnauthorized: false }
});

boss.on('error', error => console.error('pg-boss error:', error));

async function startQueue() {
    await boss.start();
    console.log('🚀 pg-boss (PostgreSQL Queue) iniciado exitosamente');
    
    const { sendWhatsAppTemplate } = require('../services/whatsapp.service');
    const pool = require('./db');

    // En pg-boss v10: handler recibe un array [ job ] y se usa batchSize si se quiere procesar en lote
    await boss.work('send-campaign-message', { batchSize: 1 }, async ([ job ]) => {
        const { tenant_id, phone, template_name } = job.data;
        
        try {
            const tenantRes = await pool.query('SELECT whatsapp_token, whatsapp_phone_id FROM tenants WHERE id = $1', [tenant_id]);
            if (tenantRes.rows.length > 0) {
                const tenant = tenantRes.rows[0];
                const result = await sendWhatsAppTemplate(tenant.whatsapp_phone_id, tenant.whatsapp_token, phone, template_name, 'es', tenant_id);
                // Si Meta devolvió un error en la respuesta, forzar el throw para reintentar
                if (result && result.error) {
                    throw new Error(`Meta API error: ${JSON.stringify(result.error)}`);
                }
            }
        } catch (e) {
            console.error(`Error enviando campaña a ${phone}:`, e.message || e);
            throw e; // Permite que pg-boss marque el job como retry/failed
        }
    });

    // Worker para procesar Webhooks de Meta (Anti-Timeout)
    await boss.work('process-webhook', { batchSize: 5 }, async ([ job ]) => {
        const { processWebhookJob } = require('../controllers/webhook.controller');
        try {
            await processWebhookJob(job.data.body);
        } catch (e) {
            console.error("Error processing webhook job:", e);
            throw e;
        }
    });

    // Tarea Programada (Cron) para Limpiar Carritos Abandonados
    await boss.createQueue('cleanup-carts');
    await boss.schedule('cleanup-carts', '0 * * * *');
    await boss.work('cleanup-carts', async () => {
        try {
            const res = await pool.query(`UPDATE chat_sessions SET state_data = '{}'::jsonb WHERE last_interaction < NOW() - INTERVAL '24 hours' AND state_data != '{}'::jsonb`);
            if (res.rowCount > 0) console.log(`🧹 Limpieza Automática: ${res.rowCount} carritos/sesiones abandonadas eliminadas.`);
        } catch (e) {
            console.error("Error limpiando carritos:", e);
        }
    });
}

module.exports = {
    boss,
    startQueue
};
