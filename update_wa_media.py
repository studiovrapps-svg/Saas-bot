import re

with open('bot-engine-backend/src/services/whatsapp.service.js', 'r', encoding='utf-8') as f:
    code = f.read()

target = """module.exports = { sendWhatsAppTemplate, logMessage, sendWhatsAppMenu, sendWhatsAppText, sendInteractiveButtons };"""
replacement = """async function downloadWhatsAppMedia(media_id, token) {
    try {
        // 1. Obtener URL del archivo desde Meta
        const res = await fetch(`https://graph.facebook.com/v19.0/${media_id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!data.url) throw new Error("No media url from Meta");

        // 2. Descargar el archivo binario
        const mediaRes = await fetch(data.url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const arrayBuffer = await mediaRes.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (e) {
        console.error("Error descargando media de WhatsApp:", e);
        return null;
    }
}

module.exports = { sendWhatsAppTemplate, logMessage, sendWhatsAppMenu, sendWhatsAppText, sendInteractiveButtons, downloadWhatsAppMedia };"""

if target in code:
    code = code.replace(target, replacement)
    with open('bot-engine-backend/src/services/whatsapp.service.js', 'w', encoding='utf-8') as f:
        f.write(code)
    print("whatsapp.service.js updated with downloadWhatsAppMedia.")
else:
    print("Target not found in whatsapp.service.js.")
