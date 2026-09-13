const pool = require('../config/db');
const { uploadImage, deleteImage } = require('../services/aws.service');

const getProducts = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products WHERE tenant_id = $1 ORDER BY id DESC', [req.params.tenant_id]);
        res.json(result.rows);
    } catch (error) { res.status(500).json({ error: `Error interno` }); }
};

const createProduct = async (req, res) => {
    try {
        const { tenant_id, name, description, price } = req.body;
        const file = req.file;
        if (!tenant_id || !name || !file) return res.status(400).json({ error: `Faltan datos` });

        let validPrice = Number(price);
        if (isNaN(validPrice) || validPrice < 0) return res.status(400).json({ error: 'El importe (USD) debe ser un número válido.' });

        const imageUrl = await uploadImage(file, `catalogo/${tenant_id}`);
        
        const result = await pool.query(
            'INSERT INTO products (tenant_id, name, description, price, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [tenant_id, name, description, price, imageUrl]
        );
        res.status(201).json({ message: `Producto guardado`, producto: result.rows[0] });
    } catch (error) { res.status(500).json({ error: `Error interno` }); }
};

const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price } = req.body;
        const file = req.file;

        let validPrice = Number(price);
        if (isNaN(validPrice) || validPrice < 0) return res.status(400).json({ error: 'El importe (USD) debe ser un número válido.' });

        if (file) {
            const pResult = await pool.query('SELECT image_url FROM products WHERE id = $1', [id]);
            if (pResult.rows.length > 0) {
                await deleteImage(pResult.rows[0].image_url);
            }
            const imageUrl = await uploadImage(file, `catalogo/edits`);
            await pool.query(
                'UPDATE products SET name = $1, description = $2, price = $3, image_url = $4 WHERE id = $5',
                [name, description, price, imageUrl, id]
            );
        } else {
            await pool.query(
                'UPDATE products SET name = $1, description = $2, price = $3 WHERE id = $4',
                [name, description, price, id]
            );
        }
        res.json({ message: `Producto actualizado` });
    } catch (error) { res.status(500).json({ error: `Error interno` }); }
};

const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const pResult = await pool.query('SELECT image_url FROM products WHERE id = $1', [id]);
        if (pResult.rows.length > 0) {
            await deleteImage(pResult.rows[0].image_url);
        }
        await pool.query('DELETE FROM products WHERE id = $1', [id]);
        res.json({ message: `Producto eliminado` });
    } catch (error) { res.status(500).json({ error: `Error interno` }); }
};

module.exports = { getProducts, createProduct, updateProduct, deleteProduct };
