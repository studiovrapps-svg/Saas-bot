const fs = require('fs');

let code = fs.readFileSync('C:/Antigravity/Chatbots/bot-engine-backend/src/services/ai.service.js', 'utf8');

// 1. Inyectar rag.service
if (!code.includes("const ragService = require('./rag.service');")) {
    code = code.replace(
        "const pool = require('../config/db');",
        "const pool = require('../config/db');\nconst ragService = require('./rag.service');"
    );
}

// 2. Reemplazar la obtención de productos (volcado) por la búsqueda RAG
const oldStart = "const prodResult = await pool.query('SELECT * FROM products WHERE tenant_id = $1 AND is_active = true', [tenant_id]);";
const oldEnd = "prodResult.rows.forEach(p => catalogoTexto += `- ${p.name}: $${p.price} (${p.description}) (ID_FOTO=${p.id})\\n`);";

// Escapamos los regex porque hay caracteres raros y variables de template
code = code.replace(oldStart, `
        // Hacemos el RAG para recuperar el contexto (solo 4 productos top)
        const relevantDocs = await ragService.searchRelevantContext(tenant_id, user_message, 4);
        let catalogoTexto = 'CATÁLOGO DE PRODUCTOS (SOLO MOSTRAR SI TIENEN RELACIÓN CON EL MENSAJE):\\n';
        
        if (relevantDocs.length === 0) {
            catalogoTexto += 'No hay productos que coincidan exactamente, guía al cliente de forma amable.\\n';
        } else {
            const filteredDocs = relevantDocs.filter(d => d.similarity > 0.15); // Umbral de similitud bajo
            if (filteredDocs.length > 0) {
                filteredDocs.forEach(d => {
                    catalogoTexto += \`- (ID_FOTO=\${d.reference_id}) | \${d.content}\\n\`;
                });
            } else {
                catalogoTexto += 'No hay productos directamente relacionados a esta frase, pero puedes usar tus reglas de negocio.\\n';
            }
        }

        // Necesitamos prodResult para la validación de carrito y envío de imágenes (Mantenemos la consulta ligera)
        const prodResult = await pool.query('SELECT * FROM products WHERE tenant_id = $1 AND is_active = true', [tenant_id]);
`);

// Borramos el bloque intermedio obsoleto
code = code.replace(`        const tenantResult = await pool.query('SELECT business_rules FROM tenants WHERE id = $1', [tenant_id]);
        const business_rules = tenantResult.rows[0]?.business_rules || \`\`;
        
        let catalogoTexto = \`CAT?LOGO DE PRODUCTOS:\\n\`;
        if (prodResult.rows.length === 0) catalogoTexto += \`No hay productos.\\n\`;
        prodResult.rows.forEach(p => catalogoTexto += \`- \${p.name}: $\${p.price} (\${p.description}) (ID_FOTO=\${p.id})\\n\`);`, 
`        const tenantResult = await pool.query('SELECT business_rules FROM tenants WHERE id = $1', [tenant_id]);
        const business_rules = tenantResult.rows[0]?.business_rules || \`\`;`);

fs.writeFileSync('C:/Antigravity/Chatbots/bot-engine-backend/src/services/ai.service.js', code);
console.log("ai.service.js patched successfully for RAG!");
