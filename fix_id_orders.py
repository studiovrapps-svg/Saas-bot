import re

with open('bot-engine-frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace("http://localhost:3000/api/tenant/${id}/orders", "http://localhost:3000/api/tenant/${tenantId}/orders")

with open('bot-engine-frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done")
