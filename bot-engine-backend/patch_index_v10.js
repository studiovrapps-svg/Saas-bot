const fs = require('fs');

let code = fs.readFileSync('C:/Antigravity/Chatbots/bot-engine-backend/index.js', 'utf8');

const oldListenRegex = /app\.listen\(PORT, async \(\) => \{[\s\S]*?\}\);/;
const oldListenAlternative = /app\.listen\(PORT, \(\) => \{[\s\S]*?\}\);/;

const newListen = `// Arranque secuencial: garantizar cola antes de aceptar tráfico
(async () => {
    try {
        await startQueue();
    } catch(e) {
        console.error("Error crítico iniciando sistema de colas:", e);
    }
    
    app.listen(PORT, () => {
        console.log(\`🚀 SaaS Bot Engine REST Controller (MVC) corriendo en puerto \${PORT}\`);
    });
})();`;

if (oldListenRegex.test(code)) {
    code = code.replace(oldListenRegex, newListen);
} else {
    code = code.replace(oldListenAlternative, newListen);
}

fs.writeFileSync('C:/Antigravity/Chatbots/bot-engine-backend/index.js', code);
console.log("index.js race condition fixed!");
