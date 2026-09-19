const fs = require('fs');
let aiService = fs.readFileSync('src/services/ai.service.js', 'utf-8');

aiService = aiService.replace(
    /            \} catch\(e\) \{ console\.error\("Error en batch im[^]*?genes", e\); \}/,
    ''
);

fs.writeFileSync('src/services/ai.service.js', aiService, 'utf-8');
console.log("Fixed stray catch");
