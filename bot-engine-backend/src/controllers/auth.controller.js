const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const crypto = require('crypto');

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPass = process.env.ADMIN_PASSWORD;

        if (adminEmail && email === adminEmail) {
            if (!adminPass) return res.status(500).json({ error: 'Configuración crítica faltante (ADMIN_PASSWORD)' });
            
            const reqPassBuffer = Buffer.from(password || '');
            const adminPassBuffer = Buffer.from(adminPass);
            
            if (reqPassBuffer.length === adminPassBuffer.length && crypto.timingSafeEqual(reqPassBuffer, adminPassBuffer)) {
                return res.json({ token: jwt.sign({ role: 'superadmin' }, process.env.JWT_SECRET, { expiresIn: '8h' }), role: 'superadmin' });
            } else {
                return res.status(401).json({ error: 'Credenciales inválidas' });
            }
        }
        
        const result = await pool.query('SELECT id, name, password_hash as password, is_active FROM tenants WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(401).json({ error: `Credenciales inválidas` });
        const tenant = result.rows[0];
        if (!tenant.is_active) return res.status(403).json({ error: `Cuenta suspendida` });
        const match = await bcrypt.compare(password, tenant.password);
        if (!match) return res.status(401).json({ error: `Credenciales inválidas` });
        const token = jwt.sign({ role: 'tenant', tenant_id: tenant.id }, process.env.JWT_SECRET, { expiresIn: '8h' });
        res.json({ token, role: 'tenant', tenant_id: tenant.id, name: tenant.name });
    } catch (error) { 
        console.error("Login error:", error);
        res.status(500).json({ error: 'Error interno' }); 
    }
};

module.exports = { login };
