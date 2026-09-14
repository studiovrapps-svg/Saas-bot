import re

with open('bot-engine-backend/src/controllers/webhook.controller.js', 'r', encoding='utf-8') as f:
    code = f.read()

target = """            let phone_number_id = body.entry[0].changes[0].value.metadata.phone_number_id;
            let from = body.entry[0].changes[0].value.messages[0].from;"""

replacement = """            let phone_number_id = body.entry[0].changes[0].value.metadata.phone_number_id;
            let from = body.entry[0].changes[0].value.messages[0].from;
            let profile_name = body.entry[0].changes[0].value.contacts?.[0]?.profile?.name || null;"""

target_log = """            // Log incoming message
            await logMessage(tenant.id, from, 'inbound', msgObj.type, user_message || `media`);"""

replacement_log = """            // Log incoming message
            await logMessage(tenant.id, from, 'inbound', msgObj.type, user_message || `media`, null, 'received', profile_name);"""

if target in code and target_log in code:
    code = code.replace(target, replacement)
    code = code.replace(target_log, replacement_log)
    with open('bot-engine-backend/src/controllers/webhook.controller.js', 'w', encoding='utf-8') as f:
        f.write(code)
    print("Updated webhook controller.")
else:
    print("Target not found.")
