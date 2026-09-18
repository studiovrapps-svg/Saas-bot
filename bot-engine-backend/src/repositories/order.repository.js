const pool = require('../config/db');

class OrderRepository {
    async createOrder(tenant_id, customer_phone, items, delivery_address) {
        await pool.query(
            `INSERT INTO orders (tenant_id, customer_phone, items, delivery_address, status) VALUES ($1, $2, $3, $4, 'pendiente')`,
            [tenant_id, customer_phone, JSON.stringify(items), delivery_address]
        );
    }
}

module.exports = new OrderRepository();
