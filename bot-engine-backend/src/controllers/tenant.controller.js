const pool = require('../config/db');
const bcrypt = require('bcrypt');

const getClientes = async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, email, is_active, whatsapp_token, whatsapp_phone_id, bot_tier, monthly_price, created_at, features FROM tenants ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) { res.status(500).json({ error: `Error interno` }); }
};

const createCliente = async (req, res) => {
    try {
        const { name, email, password, whatsapp_token, whatsapp_phone_id, bot_tier, monthly_price, features } = req.body;
        const hashed = await bcrypt.hash(password, 10);
        await pool.query(
            'INSERT INTO tenants (name, email, password_hash, whatsapp_token, whatsapp_phone_id, bot_tier, monthly_price, features) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [name, email, hashed, whatsapp_token, whatsapp_phone_id, bot_tier, monthly_price || 0, features ? JSON.stringify(features) : null]
        );
        res.status(201).json({ message: `Cliente creado exitosamente` });
    } catch (error) { res.status(500).json({ error: `Error interno` }); }
};

const updateCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const { whatsapp_token, whatsapp_phone_id, is_active, name, bot_tier, monthly_price, features } = req.body;
        await pool.query(
            'UPDATE tenants SET whatsapp_token = $1, whatsapp_phone_id = $2, is_active = $3, name = $4, bot_tier = $5, monthly_price = $6, features = COALESCE($8::jsonb, features) WHERE id = $7',
            [whatsapp_token, whatsapp_phone_id, is_active, name, bot_tier, monthly_price || 0, id, features ? JSON.stringify(features) : null]
        );
        res.json({ message: `Cliente actualizado` });
    } catch (error) { res.status(500).json({ error: `Error interno` }); }
};

const getTenantConfig = async (req, res) => {
    try {
        const result = await pool.query('SELECT name, bot_tier, system_prompt, tier1_greeting, tier1_menu, business_rules, features FROM tenants WHERE id = $1', [req.params.id]);
        res.json(result.rows[0]);
    } catch (error) { res.status(500).json({ error: `Error interno` }); }
};

const updateTenantConfig = async (req, res) => {
    try {
        const { system_prompt, tier1_greeting, tier1_menu, business_rules } = req.body;
        await pool.query(
            'UPDATE tenants SET system_prompt = $1, tier1_greeting = $2, tier1_menu = $3, business_rules = $4 WHERE id = $5',
            [system_prompt, tier1_greeting, JSON.stringify(tier1_menu || []), business_rules, req.params.id]
        );
        res.json({ message: `Configuración guardada` });
    } catch (error) { console.error(error); res.status(500).json({ error: `Error interno` }); }
};

const getTemplates = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM templates ORDER BY name ASC');
        res.json(result.rows);
    } catch (error) { res.status(500).json({ error: `Error interno` }); }
};

const createTemplate = async (req, res) => {
    try {
        const { name, description, bot_tier, system_prompt, business_rules } = req.body;
        await pool.query('INSERT INTO templates (name, description, bot_tier, system_prompt, business_rules) VALUES ($1, $2, $3, $4, $5)', [name, description, bot_tier, system_prompt, business_rules]);
        res.status(201).json({ message: `Plantilla guardada` });
    } catch (error) { res.status(500).json({ error: `Error interno` }); }
};

const updateTemplate = async (req, res) => {
    try {
        const { name, description, bot_tier, system_prompt, business_rules } = req.body;
        await pool.query('UPDATE templates SET name = $1, description = $2, bot_tier = $3, system_prompt = $4, business_rules = $5 WHERE id = $6', [name, description, bot_tier, system_prompt, business_rules, req.params.id]);
        res.json({ message: `Plantilla actualizada` });
    } catch (error) { res.status(500).json({ error: `Error interno` }); }
};

const deleteTemplate = async (req, res) => {
    try {
        await pool.query('DELETE FROM templates WHERE id = $1', [req.params.id]);
        res.json({ message: `Plantilla eliminada` });
    } catch (error) { res.status(500).json({ error: `Error interno` }); }
};

const getStats = async (req, res) => {
    try {
        const { id } = req.params;
        
        // 1. Pending orders count
        const pendingOrdersRes = await pool.query("SELECT COUNT(*) FROM orders WHERE tenant_id = $1 AND status = 'pendiente'", [id]);
        const pending_orders = parseInt(pendingOrdersRes.rows[0].count);

        // 2. Total active products
        const productsRes = await pool.query("SELECT COUNT(*) FROM products WHERE tenant_id = $1 AND is_active = true", [id]);
        const total_products = parseInt(productsRes.rows[0].count);

        // 3. Total active conversations (chat_sessions)
        const chatsRes = await pool.query("SELECT COUNT(*) FROM chat_sessions WHERE tenant_id = $1", [id]);
        const total_conversations = parseInt(chatsRes.rows[0].count);

        const revenueRes = await pool.query(`
            SELECT SUM((elem->>'price')::numeric * COALESCE((elem->>'qty')::numeric, (elem->>'quantity')::numeric, 1)) as total
            FROM orders, jsonb_array_elements(items) as elem
            WHERE tenant_id = $1 AND status = 'completado'
        `, [id]);
        
        const total_revenue = parseFloat(revenueRes.rows[0]?.total) || 0;

        res.json({
            pending_orders,
            total_products,
            total_conversations,
            total_revenue
        });
    } catch (error) {
        console.error("Error getting stats:", error);
        res.status(500).json({ error: `Error interno al obtener estadisticas` });
    }
};

const PRICING = {
    plans: {
        1: 299, // Precio base Q para Nivel 1
        2: 499, // Precio base Q para Nivel 2
        3: 999  // Precio base Q para Nivel 3
    },
    modules: {
        orders: 100,    // Precio Q por modulo
        inbox: 150,     // Precio Q por modulo
        crm: 200,       // Precio Q por modulo
        campaigns: 250  // Precio Q por modulo
    }
};
const USD_TO_GTQ = 7.8;

const getGlobalPricing = async (req, res) => {
    try {
        const result = await pool.query("SELECT value FROM settings WHERE key = 'pricing'");
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Configuración no encontrada' });
        }
        res.json(result.rows[0].value);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno' });
    }
};

const updateGlobalPricing = async (req, res) => {
    try {
        const { plans, modules } = req.body;
        await pool.query(
            "UPDATE settings SET value = $1 WHERE key = 'pricing'",
            [JSON.stringify({ plans, modules })]
        );
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno' });
    }
};

const getGlobalStats = async (req, res) => {
    try {
        // Fetch current global pricing
        const pricingRes = await pool.query("SELECT value FROM settings WHERE key = 'pricing'");
        const pricing = pricingRes.rows[0]?.value || { plans: {}, modules: {} };

        // 1. Get all active tenants
        const tenantsRes = await pool.query('SELECT id, name, bot_tier, features FROM tenants WHERE is_active = true ORDER BY id ASC');
        
        // 2. Get costs by tenant
        const costsRes = await pool.query('SELECT tenant_id, SUM(cost_usd) as total_cost, SUM(prompt_tokens + completion_tokens) as total_tokens FROM usage_logs GROUP BY tenant_id');
        const costMap = {};
        let total_cost_usd_global = 0;
        costsRes.rows.forEach(r => {
            costMap[r.tenant_id] = { cost_usd: parseFloat(r.total_cost) || 0, tokens: parseInt(r.total_tokens) || 0 };
            total_cost_usd_global += (parseFloat(r.total_cost) || 0);
        });

        // 3. Get messages by tenant
        const messagesRes = await pool.query('SELECT tenant_id, COUNT(*) as total_msgs FROM messages GROUP BY tenant_id');
        const msgMap = {};
        let total_messages_global = 0;
        messagesRes.rows.forEach(r => {
            msgMap[r.tenant_id] = parseInt(r.total_msgs) || 0;
            total_messages_global += (parseInt(r.total_msgs) || 0);
        });

        // Calculate Unified Breakdown
        let total_mrr_gtq = 0;
        let tenant_breakdown = [];
        
        tenantsRes.rows.forEach(t => {
            let plan_cost = pricing.plans[t.bot_tier] || 0;
            let modules_cost = 0;
            let active_modules = [];
            
            if (t.features) {
                if (t.features.orders) { modules_cost += pricing.modules.orders || 0; active_modules.push('Pedidos'); }
                if (t.features.inbox) { modules_cost += pricing.modules.inbox || 0; active_modules.push('Bandeja'); }
                if (t.features.crm) { modules_cost += pricing.modules.crm || 0; active_modules.push('CRM'); }
                if (t.features.campaigns) { modules_cost += pricing.modules.campaigns || 0; active_modules.push('Campañas'); }
            }
            
            let mrr_total = plan_cost + modules_cost;
            total_mrr_gtq += mrr_total;
            
            let t_cost_usd = costMap[t.id]?.cost_usd || 0;
            let t_cost_gtq = t_cost_usd * USD_TO_GTQ;
            let t_margin_gtq = mrr_total - t_cost_gtq;
            let t_interactions = msgMap[t.id] || 0;
            
            tenant_breakdown.push({
                tenant_id: t.id,
                tenant_name: t.name,
                bot_tier: t.bot_tier,
                plan_cost,
                modules: active_modules,
                modules_cost,
                mrr_total,
                cost_usd: t_cost_usd,
                cost_gtq: t_cost_gtq,
                margin_gtq: t_margin_gtq,
                interactions: t_interactions
            });
        });

        // 4. Daily usage for the last 7 days (for AreaChart)
        const dailyRes = await pool.query(`
            SELECT DATE(created_at) as date, SUM(cost_usd) as daily_cost_usd, (SUM(prompt_tokens) + SUM(completion_tokens)) as daily_tokens 
            FROM usage_logs 
            WHERE created_at >= NOW() - INTERVAL '7 days' 
            GROUP BY DATE(created_at) 
            ORDER BY DATE(created_at) ASC
        `);

        // Sort ranking by cost for the legacy graph (optional, but keep for compatibility)
        const tenant_ranking = [...tenant_breakdown].sort((a, b) => b.cost_usd - a.cost_usd).slice(0, 10);

        res.json({
            total_mrr_gtq,
            total_cost_usd: total_cost_usd_global,
            total_cost_gtq: total_cost_usd_global * USD_TO_GTQ,
            total_interactions: total_messages_global,
            tenant_breakdown,
            daily_usage: dailyRes.rows.map(r => ({ 
                date: typeof r.date === 'string' ? r.date.split('T')[0] : r.date.toISOString().split('T')[0], 
                cost_usd: parseFloat(r.daily_cost_usd) || 0, 
                cost_gtq: (parseFloat(r.daily_cost_usd) || 0) * USD_TO_GTQ,
                tokens: parseInt(r.daily_tokens) || 0 
            })),
            top_tenants: tenant_ranking.map(r => ({ 
                name: r.tenant_name, 
                cost_usd: r.cost_usd, 
                cost_gtq: r.cost_gtq, 
                tokens: r.interactions 
            }))
        });
    } catch (error) {
        console.error("Error getting global stats:", error);
        res.status(500).json({ error: 'Error interno al obtener metricas globales' });
    }
};

const getSystemLogs = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT sl.*, t.name as tenant_name 
            FROM system_logs sl
            LEFT JOIN tenants t ON sl.tenant_id = t.id
            ORDER BY sl.created_at DESC 
            LIMIT 100
        `);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error obteniendo logs' });
    }
};

const deleteCliente = async (req, res) => {
    try {
        await pool.query('DELETE FROM tenants WHERE id = $1', [req.params.id]);
        res.json({ message: 'Cliente eliminado' });
    } catch (error) {
        res.status(500).json({ error: 'Error interno' });
    }
};

const metaConnect = async (req, res) => {
    try {
        res.json({ success: true, message: 'Conectado a Meta' });
    } catch (error) {
        res.status(500).json({ error: 'Error interno' });
    }
};

module.exports = { getClientes, createCliente, updateCliente, deleteCliente, metaConnect, getTenantConfig, updateTenantConfig, getTemplates, createTemplate, updateTemplate, deleteTemplate, getStats, getGlobalStats, getGlobalPricing, updateGlobalPricing, getSystemLogs };
