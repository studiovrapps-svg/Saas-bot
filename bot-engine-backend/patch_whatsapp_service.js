const fs = require('fs');

let code = fs.readFileSync('C:/Antigravity/Chatbots/bot-engine-backend/src/services/whatsapp.service.js', 'utf8');

const oldTryBlockEnd = `        if (tenant_id) await logMessage(tenant_id, to, 'outbound', 'template', \`[Campaa: \${template_name}]\`, wamid);
    } catch (error) {`;

const newTryBlockEnd = `        if (tenant_id) await logMessage(tenant_id, to, 'outbound', 'template', \`[Campaña: \${template_name}]\`, wamid);
        return data; // Permite que pg-boss valide el status de Meta
    } catch (error) {`;

// Replace using regex just in case there are subtle differences in encoding
code = code.replace(/if \(tenant_id\) await logMessage\(tenant_id, to, 'outbound', 'template',.*?wamid\);\s*\} catch \(error\) \{/s, 
`if (tenant_id) await logMessage(tenant_id, to, 'outbound', 'template', \`[Campaña: \${template_name}]\`, wamid);
        return data; // Permite que pg-boss valide el status de Meta
    } catch (error) {`);

const oldCatchBlockEnd = `        await logSystemEvent({ tenant_id, level: 'ERROR', event_type: 'SYSTEM', message: 'Excepcin en sendWhatsAppTemplate', details: { err: error.message } });
    }`;

const newCatchBlockEnd = `        await logSystemEvent({ tenant_id, level: 'ERROR', event_type: 'SYSTEM', message: 'Excepción en sendWhatsAppTemplate', details: { err: error.message } });
        throw error; // Lanza el error para que pg-boss encole un reintento
    }`;

code = code.replace(/await logSystemEvent.*?message: 'Excepci.*?n en sendWhatsAppTemplate'.*?\);\s*\}/s, 
`await logSystemEvent({ tenant_id, level: 'ERROR', event_type: 'SYSTEM', message: 'Excepción en sendWhatsAppTemplate', details: { err: error.message } });
        throw error; // Lanza el error para que pg-boss encole un reintento
    }`);

fs.writeFileSync('C:/Antigravity/Chatbots/bot-engine-backend/src/services/whatsapp.service.js', code);
console.log("whatsapp.service.js successfully patched!");
