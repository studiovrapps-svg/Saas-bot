const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const crypto = require('crypto');

const login = async (req, res) => {
    try {
        let { email, password } = req.body;
        email = email ? email.trim().toLowerCase() : '';
        
        const adminEmail = process.env.ADMIN_EMAIL ? process.env.ADMIN_EMAIL.trim().toLowerCase() : null;
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

const loginWithGoogle = async (req, res) => {
    try {
        const { googleToken } = req.body;
        if (!googleToken) return res.status(400).json({ error: 'Token de Google requerido' });

        // Usar la API de userinfo de Google real con el access_token provisto
        const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { 'Authorization': `Bearer ${googleToken}` }
        });
        if (!googleRes.ok) return res.status(401).json({ error: 'Token de Google inválido' });
        
        const googleData = await googleRes.json();
        const email = googleData.email;
        const name = googleData.name;

        if (!email) return res.status(400).json({ error: 'Correo no proveído por Google' });

        // Superadmin bypass (por seguridad no permitimos superadmin por google aquí a menos que sea necesario)
        if (email === process.env.ADMIN_EMAIL) {
            return res.status(403).json({ error: 'Inicie sesión con contraseña para acceso de administrador' });
        }

        const result = await pool.query('SELECT id, name, is_active FROM tenants WHERE email = $1', [email]);
        
        let tenant_id;
        let needs_onboarding = false;

        if (result.rows.length === 0) {
            // REGISTRO AUTOMÁTICO (Self-Service)
            const insertRes = await pool.query(
                `INSERT INTO tenants (name, email, password_hash, is_active, bot_tier, monthly_price, features) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
                [name || 'Nuevo Negocio', email, 'GOOGLE_AUTH', true, 1, 0, '{"max_products": 50}']
            );
            tenant_id = insertRes.rows[0].id;
            needs_onboarding = true; // Acaba de registrarse
        } else {
            // LOGIN EXISTENTE
            const tenant = result.rows[0];
            if (!tenant.is_active) return res.status(403).json({ error: 'Cuenta suspendida' });
            tenant_id = tenant.id;
            // Evaluamos si su nombre es el por defecto o si le falta teléfono (puedes ajustar esta regla)
            if (tenant.name === 'Nuevo Negocio' || tenant.name === name) {
                // Podría necesitar onboarding si recién se registró pero refrescó la página
                // Para ser seguros, asumimos false a menos que verifiquemos whatsapp_phone_id
            }
        }

        const token = jwt.sign({ role: 'tenant', tenant_id }, process.env.JWT_SECRET, { expiresIn: '8h' });
        res.json({ token, role: 'tenant', tenant_id, needs_onboarding });
        
    } catch (error) {
        console.error("Google Login error:", error);
        res.status(500).json({ error: 'Error interno en autenticación de Google' });
    }
};

module.exports = { login, loginWithGoogle };
