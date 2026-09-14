import re

with open('bot-engine-frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

target = """          body: JSON.stringify({
              name: editData.name,
              whatsapp_token: editData.whatsapp_token,
              whatsapp_phone_id: editData.whatsapp_phone_id,
              is_active: editData.is_active,
              bot_tier: editData.bot_tier
          })"""

replacement = """          body: JSON.stringify({
              name: editData.name,
              whatsapp_token: editData.whatsapp_token,
              whatsapp_phone_id: editData.whatsapp_phone_id,
              is_active: editData.is_active,
              bot_tier: editData.bot_tier,
              features: editData.features
          })"""

code = code.replace(target, replacement)

with open('bot-engine-frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)
print("Done patching App.jsx payload")
