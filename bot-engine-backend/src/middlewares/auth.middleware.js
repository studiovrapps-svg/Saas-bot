const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { role: 'tenant', tenant_id: 1 } or { role: 'superadmin' }
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido o expirado.' });
    }
};

const requireSuperAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'superadmin') {
        return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador.' });
    }
    next();
};

const restrictToSelf = async (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'No autenticado.' });
    if (req.user.role === 'superadmin') return next();

    const uTenantId = req.user.tenant_id ? req.user.tenant_id.toString() : null;
    const url = req.originalUrl.split('?')[0];
    const parts = url.split('/');

    // Ya NO hacemos bypass para multipart/form-data globalmente.
    // Multer no ha parseado el body, pero SI podemos validar req.params extraídos de la URL.

    // 1. Direct tenant routes: /api/tenant/:id
    if (url.startsWith('/api/tenant/')) {
        // parts[3] is the ID
        const targetId = parts[3];
        if (targetId && targetId !== uTenantId) return res.status(403).json({ error: 'IDOR protection: Unauthorized tenant access.' });
    }

    // 2. Product GET routes: /api/productos/:tenant_id
    if (url.startsWith('/api/productos/') && req.method === 'GET') {
        const targetId = parts[3];
        if (targetId && targetId !== uTenantId) return res.status(403).json({ error: 'IDOR protection: Unauthorized tenant access.' });
    }

    // 3. Product POST: /api/productos (tenant_id in body)
    if (url.startsWith('/api/productos') && req.method === 'POST') {
        const bTenantId = req.body?.tenant_id?.toString();
        if (bTenantId && bTenantId !== uTenantId) return res.status(403).json({ error: 'IDOR protection: Unauthorized tenant creation.' });
    }

    // 4. Product routes PUT/DELETE /api/productos/:id
    if (url.startsWith('/api/productos/') && (req.method === 'PUT' || req.method === 'DELETE')) {
        const pId = parts[3];
        if (pId) {
            const prodRes = await pool.query('SELECT tenant_id FROM products WHERE id = $1', [pId]);
            if (prodRes.rows.length === 0 || prodRes.rows[0].tenant_id.toString() !== uTenantId) {
                return res.status(403).json({ error: 'IDOR protection: Unauthorized product access.' });
            }
        }
    }

    // 5. Order routes GET/PUT/DELETE /api/orders/:id/* 
    if (url.startsWith('/api/orders/')) {
        const pId = parts[3];
        if (pId) {
            const orderRes = await pool.query('SELECT tenant_id FROM orders WHERE id = $1', [pId]);
            if (orderRes.rows.length === 0 || orderRes.rows[0].tenant_id.toString() !== uTenantId) {
                 return res.status(403).json({ error: 'IDOR protection: Unauthorized order access.' });
            }
        }
    }

    next();
};

module.exports = { requireAuth, requireSuperAdmin, restrictToSelf };
