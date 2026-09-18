const fs = require('fs');

let code = fs.readFileSync('C:/Antigravity/Chatbots/bot-engine-backend/src/services/ai.service.js', 'utf8');

// Eliminar el fetch total de prodResult al inicio
code = code.replace(
    "const prodResult = await pool.query('SELECT * FROM products WHERE tenant_id = $1 AND is_active = true', [tenant_id]);",
    "// prodResult eliminado para ahorrar RAM (Auditoría QA)"
);

// Reemplazar la validación del carrito
const oldCartValidation = `                                      const dbProd = prodResult.rows.find(p => {
                                          const dbLow = p.name.toLowerCase().trim();
                                          return dbLow === itemProdLow || dbLow.includes(itemProdLow) || itemProdLow.includes(dbLow);
                                      });`;
const newCartValidation = `                                      // Búsqueda específica en BD para validación (Optimizado)
                                      const prodQuery = await pool.query(
                                          'SELECT * FROM products WHERE tenant_id = $1 AND name ILIKE $2 AND is_active = true LIMIT 1',
                                          [tenant_id, \`%\${item.product}%\`]
                                      );
                                      const dbProd = prodQuery.rows[0];`;
code = code.replace(oldCartValidation, newCartValidation);

// Reemplazar la obtención de imágenes
const oldImageFetch = `                    const p = prodResult.rows.find(x => x.id == prod_id);`;
const newImageFetch = `                    const imgQuery = await pool.query('SELECT name, image_url FROM products WHERE id = $1 AND tenant_id = $2', [prod_id, tenant_id]);
                    const p = imgQuery.rows[0];`;
code = code.replace(oldImageFetch, newImageFetch);

fs.writeFileSync('C:/Antigravity/Chatbots/bot-engine-backend/src/services/ai.service.js', code);
console.log("ai.service.js RAG fix applied!");
