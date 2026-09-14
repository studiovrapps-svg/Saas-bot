import re

with open('bot-engine-backend/src/services/ai.service.js', 'r', encoding='utf-8') as f:
    code = f.read()

target = """module.exports = { sendWhatsAppAI, chatCache };"""
replacement = """const fs = require('fs');

async function transcribeAudio(filePath) {
    try {
        const completion = await groq.audio.transcriptions.create({
            file: fs.createReadStream(filePath),
            model: "whisper-large-v3-turbo",
            language: "es" // Forcing Spanish for better regional accuracy
        });
        return completion.text;
    } catch (e) {
        console.error("Error en Whisper:", e);
        return "[Error transcribiendo audio]";
    }
}

module.exports = { sendWhatsAppAI, chatCache, transcribeAudio };"""

if target in code:
    code = code.replace(target, replacement)
    with open('bot-engine-backend/src/services/ai.service.js', 'w', encoding='utf-8') as f:
        f.write(code)
    print("ai.service.js updated with transcribeAudio.")
else:
    print("Target not found in ai.service.js.")
