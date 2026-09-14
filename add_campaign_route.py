import re

with open('bot-engine-backend/index.js', 'r', encoding='utf-8') as f:
    code = f.read()

if "campaignRoutes" not in code:
    code = code.replace("const webhookRoutes = require('./src/routes/webhook.routes');", "const webhookRoutes = require('./src/routes/webhook.routes');\nconst campaignRoutes = require('./src/routes/campaign.routes');")
    code = code.replace("app.use('/api/orders', orderRoutes);", "app.use('/api/orders', orderRoutes);\napp.use('/api/tenant', campaignRoutes); // /api/tenant/:id/campaigns/send")
    
    with open('bot-engine-backend/index.js', 'w', encoding='utf-8') as f:
        f.write(code)
    print("Updated index.js")
else:
    print("Already exists")
