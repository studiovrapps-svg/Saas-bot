const fs = require('fs');
let content = fs.readFileSync('src/services/whatsapp.service.js', 'utf-8');
content = content.replace(
    /\/\/ console\.error\("Typing API warning:", resText\);/,
    'console.error("Typing API warning:", resText);'
);
fs.writeFileSync('src/services/whatsapp.service.js', content, 'utf-8');
console.log('Uncommented error log');
