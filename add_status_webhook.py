import re

with open('bot-engine-backend/src/controllers/webhook.controller.js', 'r', encoding='utf-8') as f:
    code = f.read()

status_logic = """        if (body.object && body.entry && body.entry[0].changes[0].value.messages) {
            let phone_number_id = body.entry[0].changes[0].value.metadata.phone_number_id;"""

new_status_logic = """        if (body.object && body.entry && body.entry[0].changes[0].value.statuses) {
            // META DELIVERY RECEIPTS
            const statusObj = body.entry[0].changes[0].value.statuses[0];
            const meta_id = statusObj.id;
            const status = statusObj.status; // sent, delivered, read
            
            await pool.query(
                `UPDATE messages SET delivery_status = $1 WHERE meta_message_id = $2`,
                [status, meta_id]
            );
            return res.sendStatus(200);
        }
        
        if (body.object && body.entry && body.entry[0].changes[0].value.messages) {
            let phone_number_id = body.entry[0].changes[0].value.metadata.phone_number_id;"""

if "body.entry[0].changes[0].value.statuses" not in code:
    code = code.replace(status_logic, new_status_logic)
    with open('bot-engine-backend/src/controllers/webhook.controller.js', 'w', encoding='utf-8') as f:
        f.write(code)
    print("Status webhook logic inserted")
else:
    print("Status logic already exists")
