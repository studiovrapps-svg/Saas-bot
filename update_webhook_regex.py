import re

with open('bot-engine-backend/src/controllers/webhook.controller.js', 'r', encoding='utf-8') as f:
    code = f.read()

pattern = re.compile(r"// Extraer el texto real.*?\n.*?\n.*?\n\s*if \(msgObj\.type === `text`\).*?\n.*?\n.*?\n.*?\n\s*\}", re.DOTALL)

replacement = """              // Extraer el texto real que escribió el usuario (o el botón que presionó, o media)
              let user_message = ``;
              let msgObj = body.entry[0].changes[0].value.messages[0];
              
              if (msgObj.type === `text`) {
                  user_message = msgObj.text.body;
              } else if (msgObj.type === `interactive`) {
                  if (msgObj.interactive.type === `list_reply`) user_message = msgObj.interactive.list_reply.title;
                  else if (msgObj.interactive.type === `button_reply`) user_message = msgObj.interactive.button_reply.title;
              } else if (msgObj.type === `image`) {
                  // Procesar imagen (Guardar permanente en AWS)
                  const media_id = msgObj.image.id;
                  const mime_type = msgObj.image.mime_type || 'image/jpeg';
                  const ext = mime_type.split('/')[1] || 'jpg';
                  
                  const { downloadWhatsAppMedia } = require('../services/whatsapp.service');
                  const { uploadImage } = require('../services/aws.service');
                  
                  const buffer = await downloadWhatsAppMedia(media_id, tenant.whatsapp_token);
                  if (buffer) {
                      const fakeFile = {
                          originalname: `img_${Date.now()}.${ext}`,
                          buffer: buffer,
                          mimetype: mime_type
                      };
                      user_message = await uploadImage(fakeFile, `tenant_${tenant.id}/chats`);
                  } else {
                      user_message = "[Error descargando imagen]";
                  }
              } else if (msgObj.type === `audio`) {
                  // Procesar audio (Transcribir y eliminar archivo)
                  const media_id = msgObj.audio.id;
                  const { downloadWhatsAppMedia } = require('../services/whatsapp.service');
                  const { transcribeAudio } = require('../services/ai.service');
                  const fs = require('fs');
                  const path = require('path');
                  
                  const buffer = await downloadWhatsAppMedia(media_id, tenant.whatsapp_token);
                  if (buffer) {
                      const tmpPath = path.join(__dirname, `../../tmp_${media_id}.ogg`);
                      fs.writeFileSync(tmpPath, buffer);
                      try {
                          user_message = await transcribeAudio(tmpPath);
                      } catch(e) {
                          user_message = "[Error transcribiendo audio]";
                      }
                      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath); // Limpieza inmediata
                  } else {
                      user_message = "[Error descargando audio]";
                  }
              }"""

code = pattern.sub(replacement, code)
with open('bot-engine-backend/src/controllers/webhook.controller.js', 'w', encoding='utf-8') as f:
    f.write(code)
print("webhook.controller.js updated with media handling via regex.")
