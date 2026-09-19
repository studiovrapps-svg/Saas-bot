const fs = require('fs');
let aiService = fs.readFileSync('src/services/whatsapp.service.js', 'utf-8');
aiService = aiService.replace(/}\s*}\s*module\.exports/, '} \n\nmodule.exports');
fs.writeFileSync('src/services/whatsapp.service.js', aiService, 'utf-8');
console.log("Fixed syntax");
