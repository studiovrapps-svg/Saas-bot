import re

with open('index.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Update the SQL query to include name and whatsapp_token
code = code.replace(
    "SELECT bot_tier, system_prompt, tier1_greeting, tier1_menu, business_rules FROM tenants WHERE id = $1",
    "SELECT name, whatsapp_token, bot_tier, system_prompt, tier1_greeting, tier1_menu, business_rules FROM tenants WHERE id = $1"
)

with open('index.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done")
