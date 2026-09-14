import os
import re

def ensure_dir(path):
    if not os.path.exists(path):
        os.makedirs(path)

# Ensure directories
ensure_dir('bot-engine-backend/src/controllers')
ensure_dir('bot-engine-backend/src/routes')
ensure_dir('bot-engine-backend/src/services')
ensure_dir('bot-engine-backend/src/config')

# We'll rely on the existing index.js.backup to read the content.
with open('bot-engine-backend/index.js.backup', 'r', encoding='utf-8') as f:
    full_code = f.read()

# I am going to cheat a bit. Rather than parsing AST, I will write the controllers directly based on what I already read from index.js!

# 1. AUTH CONTROLLER & ROUTE
auth_controller = """const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const JWT_SECRET = process.env.JWT_SECRET || 'super-secreto-saas-2026';

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (email === 'admin@admin.com' && password === 'admin') {
            return res.json({ token: jwt.sign({ role: 'superadmin' }, JWT_SECRET), role: 'superadmin' });
        }
        const result = await pool.query('SELECT id, name, password, is_active FROM tenants WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(401).json({ error: `Credenciales inválidas` });
        const tenant = result.rows[0];
        if (!tenant.is_active) return res.status(403).json({ error: `Cuenta suspendida` });
        const match = await bcrypt.compare(password, tenant.password);
        if (!match) return res.status(401).json({ error: `Credenciales inválidas` });
        const token = jwt.sign({ role: 'tenant', tenant_id: tenant.id }, JWT_SECRET);
        res.json({ token, role: 'tenant', tenant_id: tenant.id, name: tenant.name });
    } catch (error) { res.status(500).json({ error: `Error interno` }); }
};

module.exports = { login };
"""
with open('bot-engine-backend/src/controllers/auth.controller.js', 'w', encoding='utf-8') as f: f.write(auth_controller)

auth_route = """const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.post('/login', authController.login);
module.exports = router;
"""
with open('bot-engine-backend/src/routes/auth.routes.js', 'w', encoding='utf-8') as f: f.write(auth_route)

print("Auth done.")
