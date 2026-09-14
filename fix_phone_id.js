const fs = require('fs');
const file_path = 'bot-engine-backend/src/controllers/tenant.controller.js';
let content = fs.readFileSync(file_path, 'utf8');

const oldLogic =           const debugRes = await fetch(\https://graph.facebook.com/v19.0/debug_token?input_token=\&access_token=1567518045121608|cbc0d6041a9c6302aac8c73f6b2c4352\);
          const debugData = await debugRes.json();
          
          let phone_id = null;
          if(debugData.data && debugData.data.granular_scopes) {
               const target = debugData.data.granular_scopes.find(s => s.scope === 'whatsapp_business_messaging');
               if(target && target.target_ids && target.target_ids.length > 0) {
                   const waba_id = target.target_ids[0];
                   const phoneRes = await fetch(\https://graph.facebook.com/v19.0/\/phone_numbers\, {
                       headers: { 'Authorization': \Bearer \\ }
                   });
                   const phoneData = await phoneRes.json();
                   if(phoneData.data && phoneData.data.length > 0) {
                       phone_id = phoneData.data[0].id;
                   }
               }
          };

const newLogic =           const debugRes = await fetch(\https://graph.facebook.com/v19.0/debug_token?input_token=\&access_token=1567518045121608|cbc0d6041a9c6302aac8c73f6b2c4352\);
          const debugData = await debugRes.json();
          console.log("Debug Token Data:", JSON.stringify(debugData));
          
          let phone_id = null;
          
          // Method 1: granular_scopes
          if(debugData.data && debugData.data.granular_scopes) {
               const target = debugData.data.granular_scopes.find(s => s.scope === 'whatsapp_business_messaging' || s.scope === 'whatsapp_business_management');
               if(target && target.target_ids && target.target_ids.length > 0) {
                   const waba_id = target.target_ids[0];
                   const phoneRes = await fetch(\https://graph.facebook.com/v19.0/\/phone_numbers\, {
                       headers: { 'Authorization': \Bearer \\ }
                   });
                   const phoneData = await phoneRes.json();
                   console.log("Phone Data (Method 1):", JSON.stringify(phoneData));
                   if(phoneData.data && phoneData.data.length > 0) {
                       phone_id = phoneData.data[0].id;
                   }
               }
          }
          
          // Method 2: Fallback query directly to WABAs endpoint using the System Token
          if (!phone_id) {
              const wabaRes = await fetch(\https://graph.facebook.com/v19.0/me/client_whatsapp_business_accounts\, {
                  headers: { 'Authorization': \Bearer \\ }
              });
              const wabaData = await wabaRes.json();
              console.log("WABA Data (Method 2):", JSON.stringify(wabaData));
              if (wabaData.data && wabaData.data.length > 0) {
                  const phoneRes = await fetch(\https://graph.facebook.com/v19.0/\/phone_numbers\, {
                      headers: { 'Authorization': \Bearer \\ }
                  });
                  const phoneData = await phoneRes.json();
                  console.log("Phone Data (Method 2):", JSON.stringify(phoneData));
                  if(phoneData.data && phoneData.data.length > 0) {
                      phone_id = phoneData.data[0].id;
                  }
              }
          };

content = content.replace(oldLogic, newLogic);
fs.writeFileSync(file_path, content, 'utf8');
