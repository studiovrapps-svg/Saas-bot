import re

with open('bot-engine-backend/index.js', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace("async function sendWhatsAppText(phone_number_id, token, to, text, tenant_id = null, tenant_id) {", "async function sendWhatsAppText(phone_number_id, token, to, text, tenant_id = null) {")

with open('bot-engine-backend/index.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done")
