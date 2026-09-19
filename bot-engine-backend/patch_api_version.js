const fs = require('fs');
let content = fs.readFileSync('src/services/whatsapp.service.js', 'utf-8');
content = content.replace(/graph\.facebook\.com\/v20\.0/g, 'graph.facebook.com/v19.0');
fs.writeFileSync('src/services/whatsapp.service.js', content, 'utf-8');
console.log('Fixed API version.');
