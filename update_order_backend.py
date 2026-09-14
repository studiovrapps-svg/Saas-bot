import re

with open('bot-engine-backend/src/controllers/order.controller.js', 'r', encoding='utf-8') as f:
    code = f.read()

target = """const getOrders = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const result = await pool.query(
            `SELECT * FROM orders WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2`, 
            [req.params.id, limit]
        );
        res.json(result.rows);
    } catch (error) { res.status(500).json({ error: `Error interno al obtener pedidos` }); }
};"""

replacement = """const getOrders = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 25;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * limit;

        const countResult = await pool.query(`SELECT COUNT(*) FROM orders WHERE tenant_id = $1`, [req.params.id]);
        const total = parseInt(countResult.rows[0].count);

        const result = await pool.query(
            `SELECT * FROM orders WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`, 
            [req.params.id, limit, offset]
        );
        res.json({ data: result.rows, total, page, limit });
    } catch (error) { res.status(500).json({ error: `Error interno al obtener pedidos` }); }
};"""

code = code.replace(target, replacement)

with open('bot-engine-backend/src/controllers/order.controller.js', 'w', encoding='utf-8') as f:
    f.write(code)
print("Order controller pagination updated.")
