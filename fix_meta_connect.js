const fs = require('fs');
const path = 'bot-engine-backend/src/controllers/tenant.controller.js';
let code = fs.readFileSync(path, 'utf8');

const oldLogic = `        if (phone_id) {
            await pool.query('UPDATE tenants SET whatsapp_token = $1, whatsapp_phone_id = $2 WHERE id = $3', [finalToken, phone_id, tenant_id]);
            res.json({ success: true, message: 'Conectado a Meta con ?xito', phone_id });
        } else {
            await pool.query('UPDATE tenants SET whatsapp_token = $1 WHERE id = $2', [finalToken, tenant_id]);
            res.json({ success: true, message: 'Conectado, pero debes configurar el ID del tel?fono manualmente' });
        }`;

const newLogic = `        if (phone_id) {
            let meta_name = null;
            let meta_picture = null;
            try {
                const profileRes = await fetch(\`https://graph.facebook.com/v19.0/\${phone_id}/whatsapp_business_profile?fields=profile_picture_url\`, { headers: { 'Authorization': \`Bearer \${finalToken}\` } });
                const profileData = await profileRes.json();
                if (profileData.data && profileData.data.length > 0) meta_picture = profileData.data[0].profile_picture_url;
                
                const nameRes = await fetch(\`https://graph.facebook.com/v19.0/\${phone_id}?fields=verified_name\`, { headers: { 'Authorization': \`Bearer \${finalToken}\` } });
                const nameData = await nameRes.json();
                meta_name = nameData.verified_name || "WhatsApp Business";
            } catch(e) { console.error(e); }
            
            await pool.query('UPDATE tenants SET whatsapp_token = $1, whatsapp_phone_id = $2, meta_name = $3, meta_picture = $4 WHERE id = $5', [finalToken, phone_id, meta_name, meta_picture, tenant_id]);
            res.json({ success: true, message: 'Conectado a Meta con éxito', phone_id, meta_name, meta_picture });
        } else {
            await pool.query('UPDATE tenants SET whatsapp_token = $1 WHERE id = $2', [finalToken, tenant_id]);
            res.json({ success: true, message: 'Conectado, pero debes configurar el ID del teléfono manualmente' });
        }`;

if (code.includes(oldLogic)) {
    code = code.replace(oldLogic, newLogic);
    fs.writeFileSync(path, code, 'utf8');
    console.log("Success");
} else {
    console.log("Not found. Check exact string.");
}
