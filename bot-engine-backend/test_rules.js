const pool = require('./src/config/db');
const tenantRepo = require('./src/repositories/tenant.repository');

tenantRepo.getBusinessRules(2).then(rules => {
    const rulesText = rules.length > 0 ? '\n\nREGLAS DE NEGOCIO ESTRICTAS:\n' + rules.map((r, i) => `- Si el usuario pregunta "${r.q}", RESPONDE EXACTAMENTE: "${r.a}"${r.image_url ? ` (SIEMPRE incluye al final el cdigo [FAQ_IMG_${i}])` : ''}`).join('\n') : '';
    console.log(rulesText);
    process.exit(0);
});
