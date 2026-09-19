const fs = require('fs');

let content = fs.readFileSync('src/services/ai.service.js', 'utf-8');

// 1. Update rules mapping
const newRules = `
        let rules = [];
        try { rules = typeof tenant.business_rules === 'string' ? JSON.parse(tenant.business_rules) : (tenant.business_rules || []); } catch(e){}
        let rulesText = rules.length > 0 
            ? "\\n\\n[REGLAS Y PREGUNTAS FRECUENTES DE LA EMPRESA]\\n" + rules.map((r, i) => {
                let txt = \`- Si el usuario pregunta "\${r.q}", RESPONDE: "\${r.a}"\`;
                if (r.image_url) txt += \` Y ESTÁS OBLIGADO a incluir el código [FAQ_IMG_\${i}] en tu texto.\`;
                return txt;
            }).join('\\n') 
            : "";
`;

content = content.replace(
    /let rulesText = rules\.length > 0[\s\S]*?\:\s*"";/,
    newRules.trim()
);

// 2. Add regex matching for FAQ_IMG
const regexLogic = `
        if (finalResponseText) {
            const regex = /\\[IMG_(\\d+)\\]/g;
            const faqRegex = /\\[FAQ_IMG_(\\d+)\\]/g;
            let textToSend = finalResponseText;
            let match;
            const imagesToSend = [];
            const faqImagesToSend = [];

            while ((match = regex.exec(finalResponseText)) !== null) {
                imagesToSend.push(parseInt(match[1]));
                textToSend = textToSend.replace(match[0], '');
            }

            while ((match = faqRegex.exec(textToSend)) !== null) {
                const idx = parseInt(match[1]);
                if (rules[idx] && rules[idx].image_url) {
                    faqImagesToSend.push({ url: rules[idx].image_url, caption: rules[idx].q });
                }
                textToSend = textToSend.replace(match[0], '');
            }
`;

content = content.replace(
    /if \(finalResponseText\) {[\s\S]*?imagesToSend\.push\(parseInt\(match\[1\]\)\);\s*textToSend = textToSend\.replace\(match\[0\], ''\);\s*}/,
    regexLogic.trim()
);

// 3. Add sending FAQ images
const sendFaqImages = `
            if (imagesToSend.length > 0) {
                try {
                    const productsFound = await productRepo.findProductsByIds(tenant_id, imagesToSend);
                    for (const p of productsFound) {
                        if (p && p.image_url) {
                            try {
                                await sendWhatsAppImage(phone_number_id, token, to, p.image_url, p.name, tenant_id);
                            } catch(err) { console.error("Error enviando imagen", err); }
                        }
                    }
                } catch(e) { console.error("Error en batch imágenes", e); }
            }

            if (faqImagesToSend.length > 0) {
                for (const img of faqImagesToSend) {
                    try {
                        await sendWhatsAppImage(phone_number_id, token, to, img.url, img.caption, tenant_id);
                    } catch(err) { console.error("Error enviando imagen FAQ", err); }
                }
            }
`;

content = content.replace(
    /if \(imagesToSend\.length > 0\) {[\s\S]*?catch\(e\) { console\.error\("Error en batch imǭgenes", e\); }\s*}/,
    sendFaqImages.trim()
);

fs.writeFileSync('src/services/ai.service.js', content, 'utf-8');
console.log("ai.service.js updated for FAQ images.");
