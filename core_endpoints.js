const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false }
});

// ==========================================
// CORE API ENDPOINTS (RESTORED)
// ==========================================

// --- TENANTS / CLIENTES ---
app.get('/api/clientes', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tenants ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (e) { res.status(500).json({error: e.message}); }
});

app.post('/api/clientes', async (req, res) => {
    try {
        const { name, email, password, bot_tier } = req.body;
        const result = await pool.query(
            'INSERT INTO tenants (name, email, password_hash, bot_tier) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, email, password, bot_tier]
        );
        res.json(result.rows[0]);
    } catch (e) { res.status(500).json({error: e.message}); }
});

app.put('/api/clientes/:id', async (req, res) => {
    try {
        const { whatsapp_token, whatsapp_phone_id, is_active, name, bot_tier, features } = req.body;
        await pool.query(
            'UPDATE tenants SET whatsapp_token = $1, whatsapp_phone_id = $2, is_active = $3, name = $4, bot_tier = $5, features = COALESCE($7, features) WHERE id = $6',
            [whatsapp_token, whatsapp_phone_id, is_active, name, bot_tier, req.params.id, features ? JSON.stringify(features) : null]
        );
        res.json({ success: true });
    } catch (e) { res.status(500).json({error: e.message}); }
});

app.delete('/api/clientes/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM tenants WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({error: e.message}); }
});

// --- TENANT CONFIG (DASHBOARD) ---
app.get('/api/tenant/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tenants WHERE id = $1', [req.params.id]);
        res.json(result.rows[0]);
    } catch (e) { res.status(500).json({error: e.message}); }
});

app.put('/api/tenant/:id/config', async (req, res) => {
    try {
        const { system_prompt, tier1_greeting, tier1_menu, business_rules } = req.body;
        await pool.query(
            'UPDATE tenants SET system_prompt = $1, tier1_greeting = $2, tier1_menu = $3, business_rules = $4 WHERE id = $5',
            [system_prompt, tier1_greeting, JSON.stringify(tier1_menu || []), business_rules, req.params.id]
        );
        res.json({ success: true });
    } catch (e) { res.status(500).json({error: e.message}); }
});

// --- TEMPLATES ---
app.get('/api/templates', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM templates ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (e) { res.status(500).json({error: e.message}); }
});

app.post('/api/templates', async (req, res) => {
    try {
        const { name, bot_tier, system_prompt, business_rules } = req.body;
        const result = await pool.query(
            'INSERT INTO templates (name, bot_tier, system_prompt, business_rules) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, bot_tier, system_prompt, business_rules]
        );
        res.json(result.rows[0]);
    } catch (e) { res.status(500).json({error: e.message}); }
});

app.put('/api/templates/:id', async (req, res) => {
    try {
        const { name, bot_tier, system_prompt, business_rules } = req.body;
        await pool.query(
            'UPDATE templates SET name = $1, bot_tier = $2, system_prompt = $3, business_rules = $4 WHERE id = $5',
            [name, bot_tier, system_prompt, business_rules, req.params.id]
        );
        res.json({ success: true });
    } catch (e) { res.status(500).json({error: e.message}); }
});

app.delete('/api/templates/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM templates WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({error: e.message}); }
});

// --- PRODUCTOS ---
app.get('/api/productos/:tenant_id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products WHERE tenant_id = $1 ORDER BY created_at DESC', [req.params.tenant_id]);
        res.json(result.rows);
    } catch (e) { res.status(500).json({error: e.message}); }
});

app.post('/api/productos/:tenant_id', async (req, res) => {
    try {
        const { name, description, price, image_url } = req.body;
        const result = await pool.query(
            'INSERT INTO products (tenant_id, name, description, price, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [req.params.tenant_id, name, description, price, image_url]
        );
        res.json(result.rows[0]);
    } catch (e) { res.status(500).json({error: e.message}); }
});

app.put('/api/productos/:id', async (req, res) => {
    try {
        const { name, description, price, image_url } = req.body;
        await pool.query(
            'UPDATE products SET name = $1, description = $2, price = $3, image_url = $4 WHERE id = $5',
            [name, description, price, image_url, req.params.id]
        );
        res.json({ success: true });
    } catch (e) { res.status(500).json({error: e.message}); }
});

app.delete('/api/productos/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({error: e.message}); }
});

// ==========================================
