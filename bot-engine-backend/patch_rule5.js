const fs = require('fs');
let aiService = fs.readFileSync('src/services/ai.service.js', 'utf-8');

const targetIndex = aiService.indexOf("[EJEMPLOS DE COMPORTAMIENTO IDEAL");

if (targetIndex !== -1) {
    const pre = aiService.substring(0, targetIndex);
    const post = aiService.substring(targetIndex);
    
    // add rule 5 before [EJEMPLOS...
    const newRule = "5. ENFOQUE ESTRICTO DEL NEGOCIO: Tu \u00fanico prop\u00f3sito es vender y asistir sobre \\${tenant.name}. TIENES COMPLETAMENTE PROHIBIDO actuar como un asistente general de IA (no respondas preguntas de matem\u00e1ticas, cultura general, clima, traducciones, ni nada fuera del negocio). Si te preguntan algo no relacionado, responde con cortes\u00eda que solo puedes ayudar con temas de \\${tenant.name} y vuelve a ofrecer tus servicios.\\n  \\n  ";
    
    fs.writeFileSync('src/services/ai.service.js', pre + newRule + post, 'utf-8');
    console.log("Patched rule 5 successfully");
} else {
    console.log("Could not find anchor");
}
