import re

with open('bot-engine-backend/src/services/whatsapp.service.js', 'r', encoding='utf-8') as f:
    code = f.read()

target = """async function logMessage(tenant_id, phone, direction, type, content, meta_message_id = null, delivery_status = 'sent') {
    try {
        await pool.query(
            `INSERT INTO messages (tenant_id, customer_phone, direction, message_type, content, meta_message_id, delivery_status) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [tenant_id, phone, direction, type, content, meta_message_id, delivery_status]
        );"""

replacement = """async function logMessage(tenant_id, phone, direction, type, content, meta_message_id = null, delivery_status = 'sent', customer_name = null) {
    try {
        await pool.query(
            `INSERT INTO messages (tenant_id, customer_phone, direction, message_type, content, meta_message_id, delivery_status, customer_name) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [tenant_id, phone, direction, type, content, meta_message_id, delivery_status, customer_name]
        );"""

if target in code:
    code = code.replace(target, replacement)
    with open('bot-engine-backend/src/services/whatsapp.service.js', 'w', encoding='utf-8') as f:
        f.write(code)
    print("Updated logMessage.")
else:
    print("Target not found.")
