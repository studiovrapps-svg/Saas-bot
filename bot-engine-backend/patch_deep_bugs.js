const fs = require('fs');

// --- 1 & 2. Fix ai.service.js ---
let aiCode = fs.readFileSync('src/services/ai.service.js', 'utf8');

// Fix 1: Filter out empty strings in Shopping Cart
const oldValidItems = `const validItemsInput = args.items.filter(i => i.product && typeof i.product === 'string' && !isNaN(parseInt(i.quantity, 10)));`;
const newValidItems = `const validItemsInput = args.items.filter(i => i.product && typeof i.product === 'string' && i.product.trim().length > 0 && !isNaN(parseInt(i.quantity, 10)));`;

aiCode = aiCode.replace(oldValidItems, newValidItems);

// Fix 2: Throw on fetch !ok for Images
const oldFetchImage = `                                const response = await fetch(\`https://graph.facebook.com/v19.0/\${phone_number_id}/messages\`, {
                                    method: 'POST', headers: { 'Authorization': \`Bearer \${token}\`, 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ messaging_product: \`whatsapp\`, to: to, type: \`image\`, image: { link: p.image_url } })
                                });
                                await logMessage(tenant_id, to, 'outbound', 'image', \`[Imagen: \${p.image_url}]\\n\${p.name}\`);`;

const newFetchImage = `                                const response = await fetch(\`https://graph.facebook.com/v19.0/\${phone_number_id}/messages\`, {
                                    method: 'POST', headers: { 'Authorization': \`Bearer \${token}\`, 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ messaging_product: \`whatsapp\`, to: to, type: \`image\`, image: { link: p.image_url } })
                                });
                                if (!response.ok) {
                                    const errData = await response.json();
                                    throw new Error("Meta API falló: " + JSON.stringify(errData.error));
                                }
                                await logMessage(tenant_id, to, 'outbound', 'image', \`[Imagen: \${p.image_url}]\\n\${p.name}\`);`;

// Buscamos con regex en caso de pequeñas variaciones
aiCode = aiCode.replace(/const response = await fetch.*?\}\);\s*await logMessage/s, `const response = await fetch(\`https://graph.facebook.com/v19.0/\${phone_number_id}/messages\`, {
                                    method: 'POST', headers: { 'Authorization': \`Bearer \${token}\`, 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ messaging_product: \`whatsapp\`, to: to, type: \`image\`, image: { link: p.image_url } })
                                });
                                if (!response.ok) {
                                    const errData = await response.json();
                                    throw new Error("Meta API falló: " + (errData.error ? JSON.stringify(errData.error) : 'Error desconocido'));
                                }
                                await logMessage`);

fs.writeFileSync('src/services/ai.service.js', aiCode);
console.log("ai.service.js patched (Empty Strings & Fetch OK)");

// --- 3. Fix webhook.controller.js ---
let whCode = fs.readFileSync('src/controllers/webhook.controller.js', 'utf8');

const oldIdempotency = `                  try {
                      await pool.query('INSERT INTO webhook_locks (meta_id) VALUES ($1)', [msgObj.id]);
                  } catch (error) {
                      if (error.code === '23505') { // Violación de PRIMARY KEY (Unique)
                          console.log(\`[Idempotencia] 🛡️ Webhook duplicado de Meta bloqueado. wamid: \${msgObj.id}\`);
                          return; // Aborta silenciosamente este hilo, el original ya lo está procesando
                      }
                  }`;

const newIdempotency = `                  try {
                      await pool.query('INSERT INTO webhook_locks (meta_id) VALUES ($1)', [msgObj.id]);
                  } catch (error) {
                      if (error.code === '23505') { // Violación de PRIMARY KEY (Unique)
                          console.log(\`[Idempotencia] 🛡️ Webhook duplicado de Meta bloqueado. wamid: \${msgObj.id}\`);
                          return; // Aborta silenciosamente este hilo, el original ya lo está procesando
                      } else {
                          // Si es otro error (ej. BD caída), arrojarlo para frenar la ejecución
                          throw error; 
                      }
                  }`;

whCode = whCode.replace(oldIdempotency, newIdempotency);
fs.writeFileSync('src/controllers/webhook.controller.js', whCode);
console.log("webhook.controller.js patched (Idempotency Swallow Error)");
