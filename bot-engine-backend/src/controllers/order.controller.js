const pool = require('../config/db');

const getOrders = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 25;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * limit;
        const status = req.query.status;
        const phone = req.query.phone;

        let countQuery = `SELECT COUNT(*) FROM orders WHERE tenant_id = $1`;
        let dataQuery = `SELECT * FROM orders WHERE tenant_id = $1`;
        const countParams = [req.params.id];
        const dataParams = [req.params.id];

        let paramIndex = 2;

        if (status && status !== 'todos') {
            countQuery += ` AND status = $${paramIndex}`;
            dataQuery += ` AND status = $${paramIndex}`;
            countParams.push(status);
            dataParams.push(status);
            paramIndex++;
        }

        if (phone) {
            // Strip any '+' if passed, we match ending to be safe, or just exact match
            const phoneStr = phone.startsWith('+') ? phone.substring(1) : phone;
            countQuery += ` AND customer_phone = $${paramIndex}`;
            dataQuery += ` AND customer_phone = $${paramIndex}`;
            countParams.push(phoneStr);
            dataParams.push(phoneStr);
            paramIndex++;
        }

        dataQuery += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        dataParams.push(limit, offset);

        const countResult = await pool.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].count);

        const result = await pool.query(dataQuery, dataParams);
        res.json({ data: result.rows, total, page, limit });
    } catch (error) { 
        console.error("GET ORDERS ERROR:", error);
        res.status(500).json({ error: `Error interno al obtener pedidos` }); 
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        await pool.query(
            `UPDATE orders SET status = $1 WHERE id = $2 RETURNING *`,
            [status, req.params.id]
        );
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: `Error interno al actualizar pedido` }); }
};

module.exports = { getOrders, updateOrderStatus };
