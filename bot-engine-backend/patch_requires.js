const fs = require('fs');

let code = fs.readFileSync('src/controllers/webhook.controller.js', 'utf8');

// 1. Add missing top-level imports
code = code.replace(
    "const messageRepo = require('../repositories/message.repository');",
    "const messageRepo = require('../repositories/message.repository');\nconst orderRepo = require('../repositories/order.repository');\nconst productRepo = require('../repositories/product.repository');"
);

code = code.replace(
    "const { sendWhatsAppText, sendWhatsAppMenu, sendInteractiveButtons, logMessage } = require('../services/whatsapp.service');",
    "const { sendWhatsAppText, sendWhatsAppMenu, sendInteractiveButtons, logMessage, sendWhatsAppImage } = require('../services/whatsapp.service');"
);

// 2. Remove inline requires and fix their usages
code = code.replace(
    "const { createOrder } = require('../repositories/order.repository');\n            await createOrder(tenant.id, from, cart, user_message);",
    "await orderRepo.createOrder(tenant.id, from, cart, user_message);"
);

code = code.replace(
    "const productRepo = require('../repositories/product.repository');\n            const products = await productRepo.findProductsByIds(tenant.id, [prodId]);",
    "const products = await productRepo.findProductsByIds(tenant.id, [prodId]);"
);

code = code.replace(
    "const { sendWhatsAppImage } = require('../services/whatsapp.service');\n                    await sendWhatsAppImage",
    "await sendWhatsAppImage"
);

fs.writeFileSync('src/controllers/webhook.controller.js', code);
console.log("webhook.controller.js dynamic requires fixed!");
