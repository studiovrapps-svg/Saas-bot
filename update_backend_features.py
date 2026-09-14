import re

with open('bot-engine-backend/index.js', 'r', encoding='utf-8') as f:
    code = f.read()

old_put = """app.put('/api/clientes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { whatsapp_token, whatsapp_phone_id, is_active, name, bot_tier } = req.body;
        await pool.query(
            'UPDATE tenants SET whatsapp_token = $1, whatsapp_phone_id = $2, is_active = $3, name = $4, bot_tier = $5 WHERE id = $6',
            [whatsapp_token, whatsapp_phone_id, is_active, name, bot_tier, id]
        );"""

new_put = """app.put('/api/clientes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { whatsapp_token, whatsapp_phone_id, is_active, name, bot_tier, features } = req.body;
        await pool.query(
            'UPDATE tenants SET whatsapp_token = $1, whatsapp_phone_id = $2, is_active = $3, name = $4, bot_tier = $5, features = COALESCE($7, features) WHERE id = $6',
            [whatsapp_token, whatsapp_phone_id, is_active, name, bot_tier, id, features ? JSON.stringify(features) : null]
        );"""

code = code.replace(old_put, new_put)

with open('bot-engine-backend/index.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done")
