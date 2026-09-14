import re

with open('bot-engine-backend/src/controllers/inbox.controller.js', 'r', encoding='utf-8') as f:
    code = f.read()

target = """const getChatMessages = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM messages WHERE tenant_id = $1 AND customer_phone = $2 ORDER BY created_at ASC`, 
            [req.params.id, req.params.phone]
        );
        res.json(result.rows);
    } catch (error) { res.status(500).json({ error: `Error interno` }); }
};"""

replacement = """const getChatMessages = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const result = await pool.query(
            `SELECT * FROM (
                SELECT * FROM messages 
                WHERE tenant_id = $1 AND customer_phone = $2 
                ORDER BY created_at DESC 
                LIMIT $3
            ) sub ORDER BY created_at ASC`, 
            [req.params.id, req.params.phone, limit]
        );
        res.json(result.rows);
    } catch (error) { res.status(500).json({ error: `Error interno` }); }
};"""

if target in code:
    code = code.replace(target, replacement)
    with open('bot-engine-backend/src/controllers/inbox.controller.js', 'w', encoding='utf-8') as f:
        f.write(code)
    print("Backend inbox.controller.js updated for pagination.")
else:
    print("Target not found in backend.")
