const fs = require('fs');

let code = fs.readFileSync('C:/Antigravity/Chatbots/bot-engine-backend/index.js', 'utf8');

const importQueue = `const { startQueue, boss } = require('./src/config/queue');`;
code = code.replace(/const \{ startQueue \} = require\('\.\/src\/config\/queue'\);/, importQueue);

const oldListen = `// Arranque secuencial: garantizar cola antes de aceptar tráfico
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

const newListen = `// Arranque secuencial: garantizar cola antes de aceptar tráfico
(async () => {
    try {
        await startQueue();
    } catch(e) {
        console.error("Error crítico iniciando sistema de colas:", e);
        process.exit(1); // Fail-Fast: Matar el proceso si la cola no levanta
    }
    
    app.listen(PORT, () => {
        console.log(\`🚀 SaaS Bot Engine REST Controller (MVC) corriendo en puerto \${PORT}\`);
    });
})();

// Graceful Shutdown para pg-boss
const shutdown = async () => {
    console.log("Cerrando colas de pg-boss de forma segura...");
    if (boss) await boss.stop({ graceful: true, timeout: 10000 });
    process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
`;

code = code.replace(/\/\/ Arranque secuencial.*?\}\)\(\);/s, newListen);

fs.writeFileSync('C:/Antigravity/Chatbots/bot-engine-backend/index.js', code);
console.log("index.js gracefully patched!");
