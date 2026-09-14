import sys

file_path = r'bot-engine-backend\src\controllers\webhook.controller.js'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_start = '''const processWebhook = async (req, res) => {
    try {
        let body = req.body;'''

new_start = '''const processWebhook = (req, res) => {
    res.sendStatus(200);
    setImmediate(async () => {
        try {
            let body = req.body;'''

content = content.replace(old_start, new_start)

content = content.replace('return res.sendStatus(200);', 'return;')
content = content.replace('res.sendStatus(200);', 'return;')
content = content.replace('res.sendStatus(500);', 'return;')

old_end = '''    } catch (error) { 
        console.error("WEBHOOK CRASH DETAILED:", error);
        return; 
    }
};'''

new_end = '''    } catch (error) { 
        console.error("WEBHOOK CRASH DETAILED:", error);
    }
    });
};'''

content = content.replace(old_end, new_end)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Webhook patched!')
