import sys
import re

app_id = '1567518045121608'
app_secret = 'cbc0d6041a9c6302aac8c73f6b2c4352'
config_id = '2203459136878980'

# 1. Update Frontend
file_path_front = '../bot-engine-frontend/src/App.jsx'
with open(file_path_front, 'r', encoding='utf-8') as f:
    front_content = f.read()

# Replace APP_ID in init
front_content = front_content.replace("'AQUI_TU_APP_ID_DE_META'", f"'{app_id}'")

# Use regex to remove the alert block robustly
alert_pattern = r'if\s*\(document\.body\.innerHTML\.includes\([\'"]AQUI_TU_APP_ID_DE_META[\'"]\)\)\s*\{[\s\S]*?return;\s*\}'
front_content = re.sub(alert_pattern, "", front_content)

# Update config_id
front_content = front_content.replace("'AQUI_TU_CONFIG_ID'", f"'{config_id}'")

# Ensure it uses code
front_content = front_content.replace("const accessToken = response.authResponse.accessToken;", "const accessToken = response.authResponse.code || response.authResponse.accessToken;")

with open(file_path_front, 'w', encoding='utf-8') as f:
    f.write(front_content)

# 2. Update Backend
file_path_back = './src/controllers/tenant.controller.js'
with open(file_path_back, 'r', encoding='utf-8') as f:
    back_content = f.read()

new_meta_connect = f'''const metaConnect = async (req, res) => {{
    try {{
        const {{ accessToken }} = req.body; 
        const tenant_id = req.params.id;
        
        const fetch = require('node-fetch');
        
        // Exchanging code
        const tokenRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id={app_id}&client_secret={app_secret}&code=${{accessToken}}`);
        const tokenData = await tokenRes.json();
        
        const finalToken = tokenData.access_token || accessToken;
        
        const debugRes = await fetch(`https://graph.facebook.com/v19.0/debug_token?input_token=${{finalToken}}&access_token={app_id}|{app_secret}`);
        const debugData = await debugRes.json();
        
        let phone_id = null;
        if(debugData.data && debugData.data.granular_scopes) {{
             const target = debugData.data.granular_scopes.find(s => s.scope === 'whatsapp_business_messaging');
             if(target && target.target_ids && target.target_ids.length > 0) {{
                 const waba_id = target.target_ids[0];
                 const phoneRes = await fetch(`https://graph.facebook.com/v19.0/${{waba_id}}/phone_numbers`, {{
                     headers: {{ 'Authorization': `Bearer ${{finalToken}}` }}
                 }});
                 const phoneData = await phoneRes.json();
                 if(phoneData.data && phoneData.data.length > 0) {{
                     phone_id = phoneData.data[0].id;
                 }}
             }}
        }}
        
        const pool = require('../config/db');
        if (phone_id) {{
            await pool.query('UPDATE tenants SET whatsapp_token = $1, whatsapp_phone_id = $2 WHERE id = $3', [finalToken, phone_id, tenant_id]);
            res.json({{ success: true, message: 'Conectado a Meta con ?xito', phone_id }});
        }} else {{
            await pool.query('UPDATE tenants SET whatsapp_token = $1 WHERE id = $2', [finalToken, tenant_id]);
            res.json({{ success: true, message: 'Conectado, pero debes configurar el ID del tel?fono manualmente' }});
        }}
        
    }} catch (error) {{
        console.error(error);
        res.status(500).json({{ error: 'Error interno' }});
    }}
}};'''

back_content = re.sub(r'const metaConnect = async \(req, res\) => \{.*?\n\};', new_meta_connect, back_content, flags=re.DOTALL)

with open(file_path_back, 'w', encoding='utf-8') as f:
    f.write(back_content)
    
print("Done")
