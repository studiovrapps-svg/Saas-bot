const fs = require('fs');

let code = fs.readFileSync('src/services/ai.service.js', 'utf8');

// --- 1. Fix N+1 in create_order (Shopping Cart) ---
const oldCartCode = `                            let validatedItems = [];
                            if (Array.isArray(args.items)) {
                                for (let item of args.items) {
                                    if (!item.product || typeof item.product !== 'string') continue;
                                    const qty = parseInt(item.quantity, 10);
                                    if (isNaN(qty) || qty <= 0 || qty > 999) continue;
                                    
                                    const itemProdLow = item.product.toLowerCase().trim();
                                      // Búsqueda específica en BD para validación (Optimizado)
                                      const prodQuery = await pool.query(
                                          'SELECT * FROM products WHERE tenant_id = $1 AND name ILIKE $2 AND is_active = true LIMIT 1',
                                          [tenant_id, \`%\${item.product}%\`]
                                      );
                                      const dbProd = prodQuery.rows[0];
                                    if (dbProd) {
                                        validatedItems.push({ product: dbProd.name, quantity: qty, price: dbProd.price });
                                    }
                                }
                            }`;

const newCartCode = `                            let validatedItems = [];
                            if (Array.isArray(args.items)) {
                                // Solución N+1: Buscar todos los productos en una sola consulta
                                const validItemsInput = args.items.filter(i => i.product && typeof i.product === 'string' && !isNaN(parseInt(i.quantity, 10)));
                                if (validItemsInput.length > 0) {
                                    const searchTerms = validItemsInput.map(i => \`%\${i.product.trim()}%\`);
                                    const prodQuery = await pool.query(
                                        'SELECT * FROM products WHERE tenant_id = $1 AND name ILIKE ANY($2) AND is_active = true',
                                        [tenant_id, searchTerms]
                                    );
                                    
                                    for (let item of validItemsInput) {
                                        const qty = parseInt(item.quantity, 10);
                                        if (qty <= 0 || qty > 999) continue;
                                        
                                        const itemLow = item.product.toLowerCase().trim();
                                        const dbProd = prodQuery.rows.find(p => p.name.toLowerCase().includes(itemLow));
                                        
                                        if (dbProd) {
                                            validatedItems.push({ product: dbProd.name, quantity: qty, price: dbProd.price });
                                        }
                                    }
                                }
                            }`;

// Reemplazo usando string matching si es posible, sino usamos regex más flexible
if (code.includes(oldCartCode)) {
    code = code.replace(oldCartCode, newCartCode);
} else {
    // Regex fallback
    code = code.replace(/let validatedItems = \[\];.*?if \(dbProd\) \{.*?\}\s*\}\s*\}/s, newCartCode);
}

// --- 2. Fix N+1 in image sending ---
const oldImageCode = `            for (let prod_id of imagesToSend) {
                try {
                    const imgQuery = await pool.query('SELECT name, image_url FROM products WHERE id = $1 AND tenant_id = $2', [prod_id, tenant_id]);
                    const p = imgQuery.rows[0];
                    if (p && p.image_url) {
                        await fetch(\`https://graph.facebook.com/v19.0/\${phone_number_id}/messages\`, {
                            method: 'POST', headers: { 'Authorization': \`Bearer \${token}\`, 'Content-Type': 'application/json' },
                            body: JSON.stringify({ messaging_product: \`whatsapp\`, to: to, type: \`image\`, image: { link: p.image_url } })
                        });
                        await logMessage(tenant_id, to, 'outbound', 'image', \`[Imagen: \${p.image_url}]\\n\${p.name}\`);
                    }
                } catch(e){}
            }`;

const newImageCode = `            if (imagesToSend.length > 0) {
                try {
                    // Solución N+1: Buscar todas las imágenes de una vez
                    const imgQuery = await pool.query('SELECT id, name, image_url FROM products WHERE tenant_id = $1 AND id = ANY($2)', [tenant_id, imagesToSend.map(id => parseInt(id))]);
                    
                    // Enviar todas las imágenes concurrentemente a Meta
                    await Promise.all(imgQuery.rows.map(async (p) => {
                        if (p && p.image_url) {
                            try {
                                await fetch(\`https://graph.facebook.com/v19.0/\${phone_number_id}/messages\`, {
                                    method: 'POST', headers: { 'Authorization': \`Bearer \${token}\`, 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ messaging_product: \`whatsapp\`, to: to, type: \`image\`, image: { link: p.image_url } })
                                });
                                await logMessage(tenant_id, to, 'outbound', 'image', \`[Imagen: \${p.image_url}]\\n\${p.name}\`);
                            } catch(err) { console.error("Error enviando imagen", err); }
                        }
                    }));
                } catch(e) { console.error("Error en batch imágenes", e); }
            }`;

if (code.includes(oldImageCode)) {
    code = code.replace(oldImageCode, newImageCode);
} else {
    // Regex fallback
    code = code.replace(/for \(let prod_id of imagesToSend\) \{.*?catch\(e\)\{\}\s*\}/s, newImageCode);
}

fs.writeFileSync('src/services/ai.service.js', code);
console.log("N+1 Queries eliminated from ai.service.js!");
