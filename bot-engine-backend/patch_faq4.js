const fs = require('fs');
let aiService = fs.readFileSync('src/services/ai.service.js', 'utf-8');

// Patch 1: Inject [FAQ_IMG_X] into the prompt
const newRules = `const rulesText = rules.length > 0 
            ? "\\n\\nREGLAS DE NEGOCIO ESTRICTAS:\\n" + rules.map((r, i) => \`- Si el usuario pregunta "\${r.q}", RESPONDE EXACTAMENTE: "\${r.a}"\${r.image_url ? \` (SIEMPRE incluye al final el cdigo [FAQ_IMG_\${i}])\` : ''}\`).join('\\n') 
            : "";`;

aiService = aiService.replace(
    /const rulesText = rules\.length > 0[^]*?\? "\\n\\nREGLAS DE NEGOCIO ESTRICTAS:\\n" \+ rules\.map\(r => `- Si el usuario pregunta "\$\{r\.q\}", RESPONDE EXACTAMENTE: "\$\{r\.a\}"`\)\.join\('\\n'\)[^]*?: "";/,
    newRules
);

// Patch 2: The loop for images
const originalBlockRegex = /if \(imagesToSend\.length > 0\) \{[\s\S]*?\} catch\(e\) \{ console\.error\("Error en batch im[^]*?genes", e\); \}\n\s*\}/;

const replacementBlock = `if (imagesToSend.length > 0) {
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
                } catch(e) { console.error("Error en batch imagenes", e); }
            }

            if (faqImagesToSend.length > 0) {
                for (const faqImg of faqImagesToSend) {
                    try {
                        await sendWhatsAppImage(phone_number_id, token, to, faqImg.url, faqImg.caption, tenant_id);
                    } catch(err) { console.error("Error enviando imagen FAQ", err); }
                }
            }`;

aiService = aiService.replace(originalBlockRegex, replacementBlock);

fs.writeFileSync('src/services/ai.service.js', aiService, 'utf-8');
console.log("Patched successfully.");
