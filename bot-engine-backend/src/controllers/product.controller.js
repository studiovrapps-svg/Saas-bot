const pool = require('../config/db');
const { uploadImage, deleteImage } = require('../services/aws.service');
const ragService = require('../services/rag.service');

const getProducts = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products WHERE tenant_id = $1 ORDER BY id DESC', [req.params.tenant_id]);
        res.json(result.rows);
    } catch (error) { res.status(500).json({ error: `Error interno` }); }
};

const createProduct = async (req, res) => {
    try {
        const { name, description, price } = req.body;
        const tenant_id = (req.user && req.user.role !== 'superadmin') ? req.user.tenant_id : req.body.tenant_id;
        const file = req.file;
        if (!tenant_id || !name || !file) return res.status(400).json({ error: `Faltan datos` });

        let validPrice = Number(price);
        if (isNaN(validPrice) || validPrice < 0) return res.status(400).json({ error: 'El importe (USD) debe ser un número válido.' });

        const imageUrl = await uploadImage(file, `catalogo/${tenant_id}`);
        
        const result = await pool.query(
            'INSERT INTO products (tenant_id, name, description, price, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [tenant_id, name, description, validPrice, imageUrl]
        );
        
        // RAG Sync (Opcional, no bloquea el request)
        try {
            await ragService.upsertProductKnowledge(tenant_id, result.rows[0].id, name, description, validPrice);
        } catch (ragErr) {
            console.error("Error RAG sync on create:", ragErr);
        }
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

        const isSuperAdmin = req.user && req.user.role === 'superadmin';
        const uTenantId = req.user.tenant_id;

        let oldImageUrl = null;
        let finalTenantId = null;

        let currentProd;
        if (isSuperAdmin) {
            currentProd = await pool.query('SELECT image_url, tenant_id FROM products WHERE id = $1', [id]);
        } else {
            currentProd = await pool.query('SELECT image_url, tenant_id FROM products WHERE id = $1 AND tenant_id = $2', [id, uTenantId]);
        }

        if (currentProd.rows.length === 0) return res.status(403).json({ error: 'Unauthorized or not found' });
        finalTenantId = currentProd.rows[0].tenant_id;
        oldImageUrl = currentProd.rows[0].image_url;

        if (file) {
            const imageUrl = await uploadImage(file, `catalogo/edits`);
            await pool.query(
                `UPDATE products SET name = $1, description = $2, price = $3, image_url = $4 WHERE id = $5`,
                [name, description, validPrice, imageUrl, id]
            );
            if (oldImageUrl) {
                await deleteImage(oldImageUrl).catch(e => console.error("Error borrando imagen vieja:", e));
            }
        } else {
            await pool.query(
                `UPDATE products SET name = $1, description = $2, price = $3 WHERE id = $4`,
                [name, description, validPrice, id]
            );
        }
        
        // RAG Sync (Opcional, no bloquea el request)
        try {
            await ragService.upsertProductKnowledge(finalTenantId, id, name, description, validPrice);
        } catch (ragErr) {
            console.error("Error RAG sync on update:", ragErr);
        }
        res.json({ message: `Producto actualizado` });
    
    } catch (error) { res.status(500).json({ error: `Error interno` }); }
};

const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const isSuperAdmin = req.user && req.user.role === 'superadmin';
        const uTenantId = req.user.tenant_id;

        let pResult;
        if (isSuperAdmin) {
            pResult = await pool.query('DELETE FROM products WHERE id = $1 RETURNING image_url, tenant_id', [id]);
        } else {
            pResult = await pool.query('DELETE FROM products WHERE id = $1 AND tenant_id = $2 RETURNING image_url, tenant_id', [id, uTenantId]);
        }

        if (pResult.rows.length > 0) {
            await deleteImage(pResult.rows[0].image_url);
            try {
                await ragService.deleteProductKnowledge(pResult.rows[0].tenant_id, id);
            } catch (ragErr) {
                console.error("Error RAG sync on delete:", ragErr);
            }
            res.json({ message: `Producto eliminado` });
        } else {
            return res.status(403).json({ error: 'Unauthorized or not found' });
        }
    } catch (error) { res.status(500).json({ error: `Error interno` }); }
};

module.exports = { getProducts, createProduct, updateProduct, deleteProduct };
