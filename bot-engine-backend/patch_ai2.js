const fs = require('fs');

let content = fs.readFileSync('src/services/ai.service.js', 'utf-8');

// 1. Update signature
content = content.replace(
    /async function sendWhatsAppAI\(phone_number_id, token, to, text, tenant_id\) {/,
    'async function sendWhatsAppAI(phone_number_id, token, to, text, tenant_id, customer_name = null) {'
);

// 2. Add customer name handling in sysPrompt
let newPromptLines = `        // Inyectamos la personalidad universal para TODO bot Tier 2
        let sysPrompt = \`Eres el asistente virtual experto de \${tenant.name}. Tu personalidad es la de un vendedor estrella: eres sumamente alegre, carismático, dinámico y conversacional.\\n\`;
        sysPrompt += \`REGLA DE ORO DE INTERACCIÓN:\\n\`;
        sysPrompt += \`- ¡No seas un robot aburrido! Evita frases genéricas como "¿En qué puedo ayudarle?".\\n\`;
        
        if (customer_name) {
            sysPrompt += \`- El cliente con el que estás hablando ya está registrado con el nombre: \${customer_name}. Dirígete a él/ella por su nombre para darle una atención cálida y personalizada.\\n\\n\`;
        } else {
            sysPrompt += \`- Si el cliente acaba de saludar por primera vez, DEBES presentarte con entusiasmo (ej: "¡Hola! Qué gusto saludarte, soy el asistente virtual de \${tenant.name}") y PREGÚNTALE SU NOMBRE antes de continuar. Queremos que la charla sea súper humana. Cuando el cliente te diga su nombre, DEBES utilizar la herramienta 'register_customer_name' para guardarlo en la base de datos de inmediato.\\n\\n\`;
        }
`;

content = content.replace(
    /\/\/ Inyectamos la personalidad universal para TODO bot Tier 2[\s\S]*?Queremos que la charla sea súper humana\.\\n\\n`;/,
    newPromptLines.trimEnd()
);

// 3. Add the tool definition
let toolDef = `            {
                type: "function",
                function: {
                    name: "register_customer_name",
                    description: "Guarda permanentemente el nombre del cliente en la base de datos una vez que te lo dice (sólo úsala cuando el usuario te confirme cómo se llama).",
                    parameters: {
                        type: "object",
                        properties: {
                            name: { type: "string", description: "El nombre y/o apellido del cliente" }
                        },
                        required: ["name"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "create_order",`;

content = content.replace(
    /\{\s*type: "function",\s*function: \{\s*name: "create_order",/,
    toolDef
);

// 4. Handle tool execution
let toolExec = `                } else if (toolCall.function.name === 'register_customer_name') {
                    try {
                        const args = JSON.parse(toolCall.function.arguments);
                        if (args.name && args.name.trim().length > 0) {
                            const { sessionRepo } = require('../repositories/session.repository');
                            await sessionRepo.setCustomerName(tenant_id, to, args.name.trim());
                            console.log("Customer name registered via AI:", args.name);
                        }
                    } catch(e) { console.error("Error registering customer name", e); }
                } else if (toolCall.function.name === 'transfer_to_human') {`;

content = content.replace(
    /\} else if \(toolCall\.function\.name === 'transfer_to_human'\) \{/,
    toolExec
);

fs.writeFileSync('src/services/ai.service.js', content, 'utf-8');
console.log("ai.service.js updated successfully");
