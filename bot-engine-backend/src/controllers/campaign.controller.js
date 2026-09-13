const pool = require('../config/db');
const { sendWhatsAppTemplate } = require('../services/whatsapp.service');

const sendCampaign = async (req, res) => {
    try {
        const tenant_id = req.params.id;
        const { template_name } = req.body;

        if (!template_name) {
            return res.status(400).json({ error: 'Debes proporcionar el nombre de la plantilla' });
        }

        const tenantRes = await pool.query('SELECT whatsapp_token, whatsapp_phone_id FROM tenants WHERE id = $1', [tenant_id]);
        if (tenantRes.rows.length === 0) return res.status(404).json({ error: 'Tenant no encontrado' });
        
        const audienceRes = await pool.query(`SELECT DISTINCT customer_phone FROM messages WHERE tenant_id = $1`, [tenant_id]);
        const audience = audienceRes.rows.map(r => r.customer_phone);

        if (audience.length === 0) {
            return res.status(400).json({ error: 'No hay contactos registrados para enviar la campaña.' });
        }

        // Insert job into database for reliable background processing
        await pool.query(
            'INSERT INTO campaign_jobs (tenant_id, campaign_name, target_phones, status) VALUES ($1, $2, $3, $4)',
            [tenant_id, template_name, JSON.stringify(audience), 'pending']
        );

        res.json({ message: `Campaña encolada. Se enviará a ${audience.length} contactos de forma segura.` });
        
        // Trigger worker safely (non-blocking)
        processCampaignJobs().catch(e => console.error("Job processor error:", e));

    } catch (error) {
        console.error('Error encolando campaña:', error);
        res.status(500).json({ error: 'Error interno del servidor al procesar la campaña.' });
    }
};

let isProcessing = false;
async function processCampaignJobs() {
    if (isProcessing) return;
    isProcessing = true;
    let hasMore = false;
    try {
        const jobRes = await pool.query('SELECT * FROM campaign_jobs WHERE status = $1 ORDER BY created_at ASC LIMIT 1', ['pending']);
        if (jobRes.rows.length === 0) {
            return;
        }

        const job = jobRes.rows[0];
        try {
            await pool.query('UPDATE campaign_jobs SET status = $1 WHERE id = $2', ['processing', job.id]);

            const tenantRes = await pool.query('SELECT whatsapp_token, whatsapp_phone_id FROM tenants WHERE id = $1', [job.tenant_id]);
            if (tenantRes.rows.length > 0) {
                const tenant = tenantRes.rows[0];
                const audience = job.target_phones || [];
                let count = 0;
                
                for (let phone of audience) {
                    try {
                        await sendWhatsAppTemplate(tenant.whatsapp_phone_id, tenant.whatsapp_token, phone, job.campaign_name, 'es', job.tenant_id);
                        count++;
                    } catch(e) { console.error('Error sending msg in campaign', e); }
                    
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
            }
            await pool.query('UPDATE campaign_jobs SET status = $1, updated_at = NOW() WHERE id = $2', ['completed', job.id]);
            hasMore = true;
        } catch(err) {
            console.error("Job processing failed:", err);
            await pool.query('UPDATE campaign_jobs SET status = $1, updated_at = NOW() WHERE id = $2', ['failed', job.id]);
            hasMore = true; // Continúa con otros jobs si los hay
        }
    } finally {
        isProcessing = false;
        if (hasMore) {
            setTimeout(() => processCampaignJobs().catch(()=>{}), 1000);
        }
    }
}

module.exports = { sendCampaign };
