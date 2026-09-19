const fs = require('fs');

let content = fs.readFileSync('src/services/whatsapp.service.js', 'utf-8');

// The buggy line is:
// DO UPDATE SET last_interaction = CURRENT_TIMESTAMP, customer_name = COALESCE($3, chat_sessions.customer_name)`,

const oldStr = 'customer_name = COALESCE($3, chat_sessions.customer_name)';
const newStr = 'customer_name = COALESCE(chat_sessions.customer_name, $3)';

if (content.includes(oldStr)) {
    content = content.replace(oldStr, newStr);
    fs.writeFileSync('src/services/whatsapp.service.js', content, 'utf-8');
    console.log('whatsapp.service.js patched.');
} else {
    console.log('String not found');
}
