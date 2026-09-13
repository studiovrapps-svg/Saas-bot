import re

with open('App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Update handleMetaLogin to be more verbose for debugging
new_meta_login = """    const handleMetaLogin = () => {
        if (!window.FB) {
            alert("⚠️ El SDK de Facebook no ha cargado. Revisa tu consola de internet.");
            return;
        }
        
        // Verificación de seguridad para el usuario
        if (String(window.FB._getAppId() || "").includes("AQUI_TU")) {
            alert("🛑 ¡Alto ahí! Aún no has puesto tu APP_ID de Meta en el código. Abre App.jsx en la línea ~90 y reemplaza 'AQUI_TU_APP_ID_DE_META' con tu ID real de Meta for Developers.");
            return;
        }

        console.log("Iniciando popup de Meta...");
        window.FB.login((response) => {
            console.log("Respuesta de Meta:", response);
            if (response.authResponse) {
                const accessToken = response.authResponse.accessToken;
                linkWhatsAppAccount(accessToken);
            } else {
                alert('Cancelaste la ventana de Meta o hubo un error de conexión.');
            }
        }, {
            config_id: 'AQUI_TU_CONFIG_ID', // Requerido para Embedded Signup
            response_type: 'code',
            override_default_response_type: true,
            extras: { setup: {  } }
        });
    };"""

code = re.sub(
    r'const handleMetaLogin = \(\) => \{[\s\S]*?override_default_response_type: true,\s*extras: \{ setup: \{  \} \}\s*\}\);\s*\};',
    new_meta_login,
    code
)

with open('App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done")
