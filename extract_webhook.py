import re

with open('bot-engine-backend/index.js.backup', 'r', encoding='utf-8') as f:
    full_code = f.read()

# Grab everything between app.get('/webhook' and app.get('/api/tenant/:id/chats'
match = re.search(r"(app\.get\('/webhook'.*?)app\.get\('/api/tenant/:id/chats'", full_code, re.DOTALL)
if match:
    webhook_code = match.group(1)
    
    # Replace app.get('/webhook' with const verifyWebhook = 
    webhook_code = webhook_code.replace("app.get('/webhook', (req, res) => {", "const verifyWebhook = (req, res) => {")
    webhook_code = webhook_code.replace("app.post('/webhook', async (req, res) => {", "const processWebhook = async (req, res) => {")
    
    # We need to prepend imports
    controller_content = f"""const pool = require('../config/db');
const {{ sendWhatsAppText, sendWhatsAppMenu, sendInteractiveButtons, logMessage }} = require('../services/whatsapp.service');
const {{ sendWhatsAppAI, chatCache }} = require('../services/ai.service');

{webhook_code}

module.exports = {{ verifyWebhook, processWebhook }};
"""
    with open('bot-engine-backend/src/controllers/webhook.controller.js', 'w', encoding='utf-8') as f:
        f.write(controller_content)
    
    route_content = """const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhook.controller');

router.get('/', webhookController.verifyWebhook);
router.post('/', webhookController.processWebhook);

module.exports = router;
"""
    with open('bot-engine-backend/src/routes/webhook.routes.js', 'w', encoding='utf-8') as f:
        f.write(route_content)
    
    print("Webhook extracted successfully.")
else:
    print("Failed to find webhook block.")
