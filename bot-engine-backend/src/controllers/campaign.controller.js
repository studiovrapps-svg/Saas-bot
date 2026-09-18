const pool = require('../config/db');
const { boss } = require('../config/queue');

const sendCampaign = async (req, res) => {
    try {
        const tenant_id = req.params.id;
        const { template_name } = req.body;

        if (!template_name) {
            return res.status(400).json({ error: 'Debes proporcionar el nombre de la plantilla' });
        }

        const tenantRes = await pool.query('SELECT whatsapp_token, whatsapp_phone_id FROM tenants WHERE id = $1', [tenant_id]);
        if (tenantRes.rows.length === 0) return res.status(404).json({ error: 'Tenant no encontrado' });
        
        const audienceRes = await pool.query(`SELECT DISTINCT customer_phone FROM messages WHERE tenant_id = $1 AND customer_phone IS NOT NULL`, [tenant_id]);
        const audience = audienceRes.rows.map(r => r.customer_phone);

        if (audience.length === 0) {
            return res.status(400).json({ error: 'No hay contactos registrados para enviar la campaña.' });
        }

        // pg-boss v10: JobInsert requiere propiedades planas a nivel raíz (NO dentro de options)
        const jobs = audience.map(phone => ({
            name: 'send-campaign-message',
            data: { tenant_id, phone, template_name },
            retryLimit: 3,  // Reintentará 3 veces
            retryDelay: 60  // Espera 60s entre intentos
        }));

        await boss.insert(jobs);

        res.json({ message: `Campaña encolada. Se enviará a ${audience.length} contactos de forma segura (Controlado por pg-boss).` });
    } catch (error) {
        console.error('Error encolando campaña:', error);
        res.status(500).json({ error: 'Error interno del servidor al procesar la campaña.' });
    }
};

module.exports = { sendCampaign };
