import re

with open('bot-engine-backend/index.js', 'r', encoding='utf-8') as f:
    code = f.read()

with open('core_endpoints.js', 'r', encoding='utf-8') as f:
    core_endpoints = f.read()

# Extract just the endpoints part from core_endpoints.js
endpoints_only = core_endpoints.split("// ==========================================\n// CORE API ENDPOINTS (RESTORED)\n// ==========================================")[1]
endpoints_only = "// ==========================================\n// CORE API ENDPOINTS (RESTORED)\n// ==========================================" + endpoints_only

# Inject before app.get('/webhook')
code = code.replace("app.get('/webhook', (req, res) => {", endpoints_only + "\napp.get('/webhook', (req, res) => {")

with open('bot-engine-backend/index.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done restoring core endpoints")
