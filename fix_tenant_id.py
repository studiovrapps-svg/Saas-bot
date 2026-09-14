import re

with open('bot-engine-frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace ${id} with ${tenantId} in the newly added chat functions
code = code.replace("http://localhost:3000/api/tenant/${id}/chats", "http://localhost:3000/api/tenant/${tenantId}/chats")
code = code.replace(", id]);", ", tenantId]);")

with open('bot-engine-frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done")
