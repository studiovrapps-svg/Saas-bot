const fs = require('fs');
let aiService = fs.readFileSync('src/services/ai.service.js', 'utf-8');

const regex = /const rulesText = rules\.length > 0 \n            \? "\\n\\nREGLAS DE NEGOCIO ESTRICTAS:\\n" \+ rules\.map\(\(r, i\) => `- Si el usuario pregunta "\\\$\{r\.q\}", RESPONDE EXACTAMENTE: "\\\$\{r\.a\}"\\\$\{r\.image_url \? \` \(SIEMPRE incluye al final el cdigo \[FAQ_IMG_\\\$\{i\}\]\)\` : ''\}`\)\.join\('\\n'\) \n            : "";/;

const replacement = `const rulesText = rules.length > 0 
            ? "\\n\\nREGLAS DE NEGOCIO ESTRICTAS:\\n" + rules.map((r, i) => \`- Si el usuario pregunta "\${r.q}", RESPONDE EXACTAMENTE: "\${r.a}\${r.image_url ? \`\\n\\n[FAQ_IMG_\${i}]\` : ''}"\`).join('\\n') 
            : "";`;

if (aiService.match(regex)) {
    aiService = aiService.replace(regex, replacement);
    fs.writeFileSync('src/services/ai.service.js', aiService, 'utf-8');
    console.log("Patched FAQ tag logic successfully");
} else {
    // try exact indexOf because regex can be painful with escapes
    const findStr = "const rulesText = rules.length > 0 \n            ? \"\\n\\nREGLAS DE NEGOCIO ESTRICTAS:\\n\" + rules.map((r, i) => `- Si el usuario pregunta \"${r.q}\", RESPONDE EXACTAMENTE: \"${r.a}\"${r.image_url ? ` (SIEMPRE incluye al final el cdigo [FAQ_IMG_${i}])` : ''}`).join('\\n') \n            : \"\";";
    
    // just rebuild it manually based on string splits
    const splitPoint = aiService.indexOf("const rulesText = rules.length > 0");
    const endPoint = aiService.indexOf(": \"\";", splitPoint) + 5;
    
    if (splitPoint !== -1) {
        const pre = aiService.substring(0, splitPoint);
        const post = aiService.substring(endPoint);
        fs.writeFileSync('src/services/ai.service.js', pre + replacement + post, 'utf-8');
        console.log("Patched FAQ tag logic using substring");
    } else {
        console.log("Could not find string");
    }
}
