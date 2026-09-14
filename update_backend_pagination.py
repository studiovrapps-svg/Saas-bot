import re

# Update getChats in inbox.controller.js
with open('bot-engine-backend/src/controllers/inbox.controller.js', 'r', encoding='utf-8') as f:
    inbox_code = f.read()

target_getChats = """const getChats = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT customer_phone, MAX(customer_name) as customer_name, MAX(created_at) as last_activity
            FROM messages WHERE tenant_id = $1 GROUP BY customer_phone ORDER BY last_activity DESC
        `, [req.params.id]);
        res.json(result.rows);
    } catch (error) { res.status(500).json({ error: `Error interno` }); }
};"""

replacement_getChats = """const getChats = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const result = await pool.query(`
            SELECT customer_phone, MAX(customer_name) as customer_name, MAX(created_at) as last_activity
            FROM messages WHERE tenant_id = $1 GROUP BY customer_phone ORDER BY last_activity DESC LIMIT $2
        `, [req.params.id, limit]);
        res.json(result.rows);
    } catch (error) { res.status(500).json({ error: `Error interno` }); }
};"""

inbox_code = inbox_code.replace(target_getChats, replacement_getChats)

with open('bot-engine-backend/src/controllers/inbox.controller.js', 'w', encoding='utf-8') as f:
    f.write(inbox_code)

# Update getOrders in order.controller.js
with open('bot-engine-backend/src/controllers/order.controller.js', 'r', encoding='utf-8') as f:
    order_code = f.read()

target_getOrders = """const getOrders = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM orders WHERE tenant_id = $1 ORDER BY created_at DESC`, 
            [req.params.id]
        );
        res.json(result.rows);
    } catch (error) { res.status(500).json({ error: `Error interno al obtener pedidos` }); }
};"""

replacement_getOrders = """const getOrders = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const result = await pool.query(
            `SELECT * FROM orders WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2`, 
            [req.params.id, limit]
        );
        res.json(result.rows);
    } catch (error) { res.status(500).json({ error: `Error interno al obtener pedidos` }); }
};"""

order_code = order_code.replace(target_getOrders, replacement_getOrders)

with open('bot-engine-backend/src/controllers/order.controller.js', 'w', encoding='utf-8') as f:
    f.write(order_code)
print("Backend pagination updated.")
