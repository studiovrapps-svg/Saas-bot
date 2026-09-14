import re

with open('bot-engine-backend/index.js', 'r', encoding='utf-8') as f:
    code = f.read()

with open('core_endpoints.js', 'r', encoding='utf-8') as f:
    core_endpoints = f.read()

# Extract just the endpoints part from core_endpoints.js
endpoints_only = core_endpoints.split("CORE API ENDPOINTS (RESTORED)")[1]
# We'll just grab everything after that line.
endpoints_only = "\n// CORE API ENDPOINTS (RESTORED)\n" + endpoints_only.split("==\n")[1] if "==\n" in endpoints_only else endpoints_only

# Inject before app.get('/webhook')
if "/api/clientes" not in code:
    code = code.replace("app.get('/webhook',", endpoints_only + "\napp.get('/webhook',")

    with open('bot-engine-backend/index.js', 'w', encoding='utf-8') as f:
        f.write(code)
    print("Injected")
else:
    print("Already injected")
