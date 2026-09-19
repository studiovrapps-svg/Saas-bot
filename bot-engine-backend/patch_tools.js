const fs = require('fs');
let aiService = fs.readFileSync('src/services/ai.service.js', 'utf-8');

const regex = /const tools = \[\s*\{\s*type: "function",\s*function: \{\s*name: "register_customer_name",[\s\S]*?\}\s*\},/;

const replacement = `const tools = [];
        if (!customer_name) {
            tools.push({
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
            });
        }`;

if (aiService.match(regex)) {
    aiService = aiService.replace(regex, replacement);
    fs.writeFileSync('src/services/ai.service.js', aiService, 'utf-8');
    console.log("Patched tool logic successfully");
} else {
    // If regex fails
    const toolStr = "const tools = [\n                        {\n                type: \"function\",\n                function: {\n                    name: \"register_customer_name\",\n                    description: \"Guarda permanentemente el nombre del cliente en la base de datos una vez que te lo dice (s\u00f3lo \u00fasala cuando el usuario te confirme c\u00f3mo se llama).\",\n                    parameters: {\n                        type: \"object\",\n                        properties: {\n                            name: { type: \"string\", description: \"El nombre y/o apellido del cliente\" }\n                        },\n                        required: [\"name\"]\n                    }\n                }\n            },";
    
    const splitPoint = aiService.indexOf("const tools = [");
    const endPoint = aiService.indexOf("},", splitPoint + 20) + 2; // end of first tool
    
    if (splitPoint !== -1) {
        const pre = aiService.substring(0, splitPoint);
        const endOfRegisterTool = aiService.indexOf("name: \"create_order\",");
        // find the previous { type: "function" ... }
        const fullRegex = /const tools = \[[\s\S]*?name: "register_customer_name"[\s\S]*?\}\s*\},/;
        
        let newAiService = aiService.replace(fullRegex, `const tools = [];
        if (!customer_name) {
            tools.push({
                type: "function",
                function: {
                    name: "register_customer_name",
                    description: "Guarda permanentemente el nombre del cliente en la base de datos.",
                    parameters: {
                        type: "object",
                        properties: {
                            name: { type: "string" }
                        },
                        required: ["name"]
                    }
                }
            });
        }
        tools.push(
        `);
        
        // Let's actually just rewrite the array creation block because replacing arrays via regex is dangerous if the index is wrong.
    }
}
