import re

with open('App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Clean up duplicate {activeTab === 'conexion'} code block
bad_conexion_block = r'\{activeTab === \'conexion\' && \([\s\S]*?\}\)\s*\}'
code = re.sub(bad_conexion_block, '', code)

# 2. Fix the handleMetaLogin function to prevent crashing on _getAppId
fixed_login = """    const handleMetaLogin = () => {
        if (!window.FB) {
            alert("⚠️ El SDK de Facebook no ha cargado. Revisa tu consola de internet.");
            return;
        }

        // Simplemente mostraremos la alerta siempre si sabemos que el ID no se ha cambiado
        const APP_ID = 'AQUI_TU_APP_ID_DE_META'; 
        if (APP_ID === 'AQUI_TU_APP_ID_DE_META') {
            alert("🛑 ¡Alto ahí! Aún no has puesto tu APP_ID de Meta en el código. Abre App.jsx y reemplaza 'AQUI_TU_APP_ID_DE_META' con tu ID real de Meta for Developers.");
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

# Use a precise replacement for the handleMetaLogin block
old_login_pattern = r'const handleMetaLogin = \(\) => \{[\s\S]*?override_default_response_type: true,\s*extras: \{ setup: \{  \} \}\s*\}\);\s*\};'
code = re.sub(old_login_pattern, fixed_login, code)

with open('App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done")
