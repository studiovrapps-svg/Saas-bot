const fs = require('fs');
let aiService = fs.readFileSync('src/services/ai.service.js', 'utf-8');

// Patch 1: Inject [FAQ_IMG_X] into the prompt
const oldRules = `const rulesText = rules.length > 0 \n            ? "\\n\\nREGLAS DE NEGOCIO ESTRICTAS:\\n" + rules.map(r => \`- Si el usuario pregunta "\${r.q}", RESPONDE EXACTAMENTE: "\${r.a}"\`).join('\\n') \n            : "";`;

const newRules = `const rulesText = rules.length > 0 
            ? "\\n\\nREGLAS DE NEGOCIO ESTRICTAS:\\n" + rules.map((r, i) => \`- Si el usuario pregunta "\${r.q}", RESPONDE EXACTAMENTE: "\${r.a}"\${r.image_url ? \` (SIEMPRE incluye al final el cdigo [FAQ_IMG_\${i}])\` : ''}\`).join('\\n') 
            : "";`;

if (aiService.includes(oldRules)) {
    console.log("oldRules found");
} else {
    // try regex
    aiService = aiService.replace(
        /const rulesText = rules\.length > 0[^]*?\? "\\n\\nREGLAS DE NEGOCIO ESTRICTAS:\\n" \+ rules\.map\(r => `- Si el usuario pregunta "\$\{r\.q\}", RESPONDE EXACTAMENTE: "\$\{r\.a\}"`\)\.join\('\\n'\)[^]*?: "";/,
        newRules
    );
}

// Patch 2: Send the faqImagesToSend
const sendImagesBlock = `
            if (imagesToSend.length > 0) {
                try {
                    const productsFound = await productRepo.findProductsByIds(tenant_id, imagesToSend);
                    // QA FIX: Iterar secuencialmente para que Meta no desordene las imgenes en WhatsApp
                    for (const p of productsFound) {
                        if (p && p.image_url) {
                            try {
                                // QA FIX: Caption ms limpio, sin la URL raw
                                const caption = p.name;
                                await sendWhatsAppImage(phone_number_id, token, to, p.image_url, caption, tenant_id);
                            } catch(err) { console.error("Error enviando imagen", err); }
                        }
                    }
                } catch(e) { console.error("Error en batch imgenes", e); }
            }
`;

const newSendImagesBlock = `
            if (imagesToSend.length > 0) {
                try {
                    const productsFound = await productRepo.findProductsByIds(tenant_id, imagesToSend);
                    for (const p of productsFound) {
                        if (p && p.image_url) {
                            try {
                                const caption = p.name;
                                await sendWhatsAppImage(phone_number_id, token, to, p.image_url, caption, tenant_id);
                            } catch(err) { console.error("Error enviando imagen", err); }
                        }
                    }
                } catch(e) { console.error("Error en batch imgenes", e); }
            }

            if (faqImagesToSend.length > 0) {
                for (const faqImg of faqImagesToSend) {
                    try {
                        await sendWhatsAppImage(phone_number_id, token, to, faqImg.url, faqImg.caption, tenant_id);
                    } catch(err) { console.error("Error enviando imagen de FAQ", err); }
                }
            }
`;

aiService = aiService.replace(
    /if \(imagesToSend\.length > 0\) \{[^]*?catch\(e\) \{ console\.error\("Error en batch imgenes", e\); \}\n\s*\}/,
    newSendImagesBlock.trim()
);

fs.writeFileSync('src/services/ai.service.js', aiService, 'utf-8');
console.log("Patched ai.service.js");
