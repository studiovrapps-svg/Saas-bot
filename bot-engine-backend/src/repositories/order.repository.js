const pool = require('../config/db');

class OrderRepository {
    async createOrder(tenant_id, customer_phone, items, delivery_address) {
        const result = await pool.query(
            `INSERT INTO orders (tenant_id, customer_phone, items, delivery_address, status) VALUES ($1, $2, $3, $4, 'pendiente') RETURNING id`,
            [tenant_id, customer_phone, JSON.stringify(items), delivery_address]
        );
        return result.rows[0].id;
    }
}

module.exports = new OrderRepository();
