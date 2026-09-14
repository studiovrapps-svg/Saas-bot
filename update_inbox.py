import re

with open('bot-engine-backend/src/controllers/inbox.controller.js', 'r', encoding='utf-8') as f:
    code = f.read()

target = """        const result = await pool.query(`
            SELECT customer_phone, MAX(created_at) as last_activity
            FROM messages WHERE tenant_id = $1 GROUP BY customer_phone ORDER BY last_activity DESC
        `, [req.params.id]);"""

replacement = """        const result = await pool.query(`
            SELECT customer_phone, MAX(customer_name) as customer_name, MAX(created_at) as last_activity
            FROM messages WHERE tenant_id = $1 GROUP BY customer_phone ORDER BY last_activity DESC
        `, [req.params.id]);"""

if target in code:
    code = code.replace(target, replacement)
    with open('bot-engine-backend/src/controllers/inbox.controller.js', 'w', encoding='utf-8') as f:
        f.write(code)
    print("Updated inbox controller.")
else:
    print("Target not found.")
