import re

with open('bot-engine-backend/index.js', 'r', encoding='utf-8') as f:
    code = f.read()

target = "SELECT bot_tier, system_prompt, tier1_greeting, tier1_menu, business_rules, features FROM tenants WHERE id = $1"
replacement = "SELECT name, bot_tier, system_prompt, tier1_greeting, tier1_menu, business_rules, features FROM tenants WHERE id = $1"

code = code.replace(target, replacement)

with open('bot-engine-backend/index.js', 'w', encoding='utf-8') as f:
    f.write(code)
print("Added name to /api/tenant/:id query")
