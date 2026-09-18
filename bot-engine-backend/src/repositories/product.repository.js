const pool = require('../config/db');

class ProductRepository {
    async findProductsByName(tenant_id, searchTerms) {
        // searchTerms debe ser un array de strings estilo "%nombre%"
        const result = await pool.query(
            'SELECT * FROM products WHERE tenant_id = $1 AND name ILIKE ANY($2) AND is_active = true',
            [tenant_id, searchTerms]
        );
        return result.rows;
    }

    async findProductsByIds(tenant_id, productIds) {
        const result = await pool.query(
            'SELECT id, name, image_url, price FROM products WHERE tenant_id = $1 AND id = ANY($2)', 
            [tenant_id, productIds]
        );
        return result.rows;
    }

    async getCatalog(tenant_id, limit = 10) {
        const result = await pool.query('SELECT * FROM products WHERE tenant_id = $1 AND is_active = true LIMIT $2', [tenant_id, limit]);
        return result.rows;
    }
}

module.exports = new ProductRepository();
