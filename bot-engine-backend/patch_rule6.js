const fs = require('fs');
let aiService = fs.readFileSync('src/services/ai.service.js', 'utf-8');

const targetIndex = aiService.indexOf("[EJEMPLOS DE COMPORTAMIENTO IDEAL");

if (targetIndex !== -1) {
    const pre = aiService.substring(0, targetIndex);
    const post = aiService.substring(targetIndex);
    
    const newRule6 = "6. NATURALIDAD Y CIERRE: NUNCA termines tus mensajes con frases repetitivas de servicio al cliente como '\u00bfEn qu\u00e9 m\u00e1s puedo ayudarte?'. Deja que la conversaci\u00f3n fluya naturalmente sin forzar preguntas al final de cada mensaje.\\n  \\n  ";
    
    fs.writeFileSync('src/services/ai.service.js', pre + newRule6 + post, 'utf-8');
    console.log("Patched rule 6 successfully");
}
