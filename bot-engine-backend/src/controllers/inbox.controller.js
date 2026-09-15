const pool = require('../config/db');
const { sendWhatsAppText, logMessage } = require('../services/whatsapp.service');
const { chatCache } = require('../services/ai.service');

const getChats = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const result = await pool.query(`
            SELECT customer_phone, MAX(customer_name) as customer_name, MAX(created_at) as last_activity
            FROM messages WHERE tenant_id = $1 GROUP BY customer_phone ORDER BY last_activity DESC LIMIT $2
        `, [req.params.id, limit]);
        res.json(result.rows);
    } catch (error) { res.status(500).json({ error: `Error interno` }); }
};

const getChatMessages = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const result = await pool.query(
            `SELECT * FROM (
                SELECT * FROM messages 
                WHERE tenant_id = $1 AND customer_phone = $2 
                ORDER BY created_at DESC 
                LIMIT $3
            ) sub ORDER BY created_at ASC`, 
            [req.params.id, req.params.phone, limit]
        );
        res.json(result.rows);
    } catch (error) { res.status(500).json({ error: `Error interno` }); }
};

const sendReply = async (req, res) => {
    try {
        const { text } = req.body;
        const tenant_id = req.params.id;
        const to = req.params.phone;

        const tenantRes = await pool.query('SELECT whatsapp_token, whatsapp_phone_id FROM tenants WHERE id = $1', [tenant_id]);
        if (tenantRes.rows.length === 0) return res.status(404).json({ error: `Tenant no encontrado` });
        
        const tenant = tenantRes.rows[0];

        // Send via Meta API
        await sendWhatsAppText(tenant.whatsapp_phone_id, tenant.whatsapp_token, to, text, tenant_id, 'humano');
        
        // Mute the bot for 2 hours if an agent replies, persisting it in the database
        const muteUntil = Date.now() + (2 * 60 * 60 * 1000);
        await pool.query(
            `INSERT INTO chat_sessions (tenant_id, user_phone, status, state_data) 
             VALUES ($1, $2, 'humano', $3) 
             ON CONFLICT (tenant_id, user_phone) 
             DO UPDATE SET status = 'humano', state_data = jsonb_set(COALESCE(chat_sessions.state_data, '{}'), '{muted_until}', $4::jsonb)`,
            [tenant_id, to, JSON.stringify({ muted_until: muteUntil }), muteUntil.toString()]
        );

        res.json({ message: `Mensaje enviado` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: `Error interno` });
    }
};


const getChatSession = async (req, res) => {
    try {
        const result = await pool.query('SELECT status, state_data FROM chat_sessions WHERE tenant_id = $1 AND user_phone = $2', [req.params.id, req.params.phone]);
        res.json(result.rows[0] || { status: 'bot' });
    } catch (error) { res.status(500).json({ error: 'Error interno' }); }
};

const toggleBotStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const tenant_id = req.params.id;
        const to = req.params.phone;
        let muteUntil = status === 'humano' ? Date.now() + (2 * 60 * 60 * 1000) : 0;
        
        if (status === 'bot') {
            await pool.query(
                "UPDATE chat_sessions SET status = 'bot', state_data = state_data - 'muted_until' WHERE tenant_id = $1 AND user_phone = $2",
                [tenant_id, to]
            );
        } else {
            await pool.query(
                "INSERT INTO chat_sessions (tenant_id, user_phone, status, state_data) VALUES ($1, $2, 'humano', $3) ON CONFLICT (tenant_id, user_phone) DO UPDATE SET status = 'humano', state_data = jsonb_set(COALESCE(chat_sessions.state_data, '{}'), '{muted_until}', $4::jsonb)",
                [tenant_id, to, JSON.stringify({ muted_until: muteUntil }), muteUntil.toString()]
            );
        }
        res.json({ message: 'OK' });
    } catch (error) {
        console.error(error); res.status(500).json({ error: 'Error interno' });
    }
};

const sendQuickAction = async (req, res) => {
    try {
        const { action } = req.body;
        const tenant_id = req.params.id;
        const to = req.params.phone;
        const { sendWhatsAppMenu } = require('../services/whatsapp.service');
        const tenantRes = await pool.query('SELECT name, whatsapp_token, whatsapp_phone_id FROM tenants WHERE id = $1', [tenant_id]);
        if (tenantRes.rows.length === 0) return res.status(404).json({ error: `Tenant no encontrado` });
        const tenant = tenantRes.rows[0];
        
        if (action === 'menu') {
            await sendWhatsAppMenu(tenant.whatsapp_phone_id, tenant.whatsapp_token, to, tenant_id, tenant.name);
            
            const muteUntil = Date.now() + (2 * 60 * 60 * 1000);
            await pool.query(
                `INSERT INTO chat_sessions (tenant_id, user_phone, status, state_data) 
                 VALUES ($1, $2, 'humano', $3) 
                 ON CONFLICT (tenant_id, user_phone) 
                 DO UPDATE SET status = 'humano', state_data = jsonb_set(COALESCE(chat_sessions.state_data, \'{}\'), \'{muted_until}\', $4::jsonb)`,
                [tenant_id, to, JSON.stringify({ muted_until: muteUntil }), muteUntil.toString()]
            );
            res.json({ message: `Acción enviada` });
        } else {
            res.status(400).json({ error: `Acción no soportada` });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: `Error interno` });
    }
};

module.exports = { getChats, getChatMessages, sendReply, getChatSession, toggleBotStatus, sendQuickAction };

