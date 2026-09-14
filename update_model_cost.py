import re

with open('bot-engine-backend/src/services/ai.service.js', 'r', encoding='utf-8') as f:
    code = f.read()

target = 'model: "llama3-70b-8192",'
replacement = 'model: "groq/compound-mini", // Cambiado por optimización de costos (2026)'

if target in code:
    code = code.replace(target, replacement)
    with open('bot-engine-backend/src/services/ai.service.js', 'w', encoding='utf-8') as f:
        f.write(code)
    print("Model updated in ai.service.js")
else:
    print("Target not found. Current code might already be updated.")
