const fs = require('fs');

let code = fs.readFileSync('C:/Antigravity/Chatbots/bot-engine-backend/index.js', 'utf8');

const importStatement = "const { startQueue } = require('./src/config/queue');\n";
if (!code.includes("startQueue")) {
    code = importStatement + code;
}

const oldListen = `app.listen(PORT, () => {
    console.log(\`Ys? SaaS Bot Engine REST Controller (MVC) corriendo en puerto \${PORT}\`);
});`;

const newListen = `app.listen(PORT, async () => {
    try {
        await startQueue();
    } catch(e) {
        console.error("Error iniciando sistema de colas:", e);
    }
    console.log(\`🚀 SaaS Bot Engine REST Controller (MVC) corriendo en puerto \${PORT}\`);
});`;

code = code.replace(oldListen, newListen);
// Backup replacer just in case powershell ruined the emoji encoding
code = code.replace(/app\.listen\(PORT, \(\) => \{\s*console\.log\(.*?SaaS Bot Engine.*?\);\s*\}\);/, newListen);

fs.writeFileSync('C:/Antigravity/Chatbots/bot-engine-backend/index.js', code);
console.log("index.js patched with queue starter!");
