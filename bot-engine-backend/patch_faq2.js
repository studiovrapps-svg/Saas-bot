const fs = require('fs');
let aiService = fs.readFileSync('src/services/ai.service.js', 'utf-8');

const target = `            if (imagesToSend.length > 0) {
                try {
                    const productsFound = await productRepo.findProductsByIds(tenant_id, imagesToSend);
                    // QA FIX: Iterar secuencialmente para que Meta no desordene las imǭgenes en WhatsApp
                    for (const p of productsFound) {
                        if (p && p.image_url) {
                            try {
                                // QA FIX: Caption mǭs limpio, sin la URL raw
                                const caption = p.name;
                                await sendWhatsAppImage(phone_number_id, token, to, p.image_url, caption, tenant_id);
                            } catch(err) { console.error("Error enviando imagen", err); }
                        }
                    }
                } catch(e) { console.error("Error en batch imǭgenes", e); }
            }`;

const replacement = `            if (imagesToSend.length > 0) {
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
                    } catch(err) { console.error("Error enviando imagen FAQ", err); }
                }
            }`;

// Because of weird encoding characters (mǭs), we find index
const splitStr = `if (imagesToSend.length > 0) {`;
const splitStrEnd = `} catch(e) { console.error("Error en batch`;

if (aiService.includes(splitStr)) {
    const idx1 = aiService.indexOf(splitStr);
    const idx2 = aiService.indexOf(splitStrEnd, idx1);
    const endBracket = aiService.indexOf('}', idx2);
    
    const pre = aiService.substring(0, idx1);
    const post = aiService.substring(endBracket + 1);
    
    fs.writeFileSync('src/services/ai.service.js', pre + replacement + post, 'utf-8');
    console.log("Patched successfully with string index");
} else {
    console.log("Could not find start");
}

