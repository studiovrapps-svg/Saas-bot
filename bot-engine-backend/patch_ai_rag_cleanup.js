const fs = require('fs');

let code = fs.readFileSync('C:/Antigravity/Chatbots/bot-engine-backend/src/services/ai.service.js', 'utf8');

// The file now has both:
// 1. let catalogoTexto = 'CATÁLOGO DE PRODUCTOS...
// 2. let catalogoTexto = `CAT?LOGO DE PRODUCTOS:\n`; ...

// We will use a regex to remove the second block completely
code = code.replace(/let catalogoTexto = `CAT\?LOGO DE PRODUCTOS:\\n`;\s+if \(prodResult\.rows\.length === 0\) catalogoTexto \+= `No hay productos\.\\n`;\s+prodResult\.rows\.forEach\(p => catalogoTexto \+= `- \$\{p\.name\}: \$\$\{p\.price\} \(\$\{p\.description\}\) \(ID_FOTO=\$\{p\.id\}\)\\n`\);/, "");

fs.writeFileSync('C:/Antigravity/Chatbots/bot-engine-backend/src/services/ai.service.js', code);
console.log("ai.service.js cleaned up!");
