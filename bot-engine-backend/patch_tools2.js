const fs = require('fs');
let aiService = fs.readFileSync('src/services/ai.service.js', 'utf-8');

const anchor = 'const responseMessage = completion.choices[0].message;';
const injection = `
        // Remove register_customer_name if we already have the name
        if (customer_name) {
            const idx = tools.findIndex(t => t.function.name === 'register_customer_name');
            if (idx !== -1) tools.splice(idx, 1);
        }
`;

aiService = aiService.replace(anchor, injection + anchor);
fs.writeFileSync('src/services/ai.service.js', aiService, 'utf-8');
console.log("Patched tools by removal");
