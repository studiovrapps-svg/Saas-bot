import re

with open('bot-engine-backend/index.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Fix 1: /api/clientes
target1 = "'SELECT id, name, email, bot_tier, is_active, whatsapp_phone_id, whatsapp_token, created_at FROM tenants ORDER BY created_at DESC'"
replacement1 = "'SELECT id, name, email, bot_tier, is_active, whatsapp_phone_id, whatsapp_token, created_at, features FROM tenants ORDER BY created_at DESC'"
code = code.replace(target1, replacement1)

# Fix 2: /api/tenant/:id
target2 = "'SELECT bot_tier, system_prompt, tier1_greeting, tier1_menu, business_rules FROM tenants WHERE id = $1'"
replacement2 = "'SELECT bot_tier, system_prompt, tier1_greeting, tier1_menu, business_rules, features FROM tenants WHERE id = $1'"
code = code.replace(target2, replacement2)

# One edgecase in PUT /api/clientes/:id
# 'UPDATE tenants SET whatsapp_token = $1, whatsapp_phone_id = $2, is_active = $3, name = $4, bot_tier = $5, features = COALESCE($7, features) WHERE id = $6'
# Wait! In PUT /api/clientes/:id, I set `features = COALESCE($7, features)`.
# If `editData.features` is sent, it's sent as a JSON object.
# Let's verify `features ? JSON.stringify(features) : null` is used correctly. Yes, that is correct. But wait!
# If the admin unchecks ALL checkboxes, `editData.features` might be `{}`, or `{"orders": false, "inbox": false}`.
# COALESCE($7, features) means if $7 is null, it keeps the OLD features!
# If the frontend sends `{}` or null because they unchecked it, we SHOULD overwrite it.
# So `features = $7` is safer, or we just leave it if `editData.features` is always an object.
# Let's change COALESCE to just $7 for features.
target3 = "features = COALESCE($7, features) WHERE id = $6"
replacement3 = "features = $7 WHERE id = $6"
code = code.replace(target3, replacement3)

with open('bot-engine-backend/index.js', 'w', encoding='utf-8') as f:
    f.write(code)
print("Done fixing selects")
