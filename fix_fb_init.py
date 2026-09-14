import sys
import re

file_path = 'bot-engine-frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the handleMetaLogin to manually call FB.init if needed, and log everything.
new_handler = '''  const handleMetaLogin = () => {
        console.log("Iniciando handleMetaLogin...");
        if (!window.FB) {
            alert("?? El SDK de Facebook no ha cargado. Revisa tu consola de internet.");
            return;
        }

        try {
            console.log("Forzando inicialización de FB...");
            window.FB.init({
                appId      : '1567518045121608',
                cookie     : true,
                xfbml      : true,
                version    : 'v19.0'
            });
        } catch (e) {
            console.log("FB.init error (puede ignorarse si ya estaba inicializado):", e);
        }

        console.log("Iniciando popup de Meta...");
        window.FB.login((response) => {
            console.log("Respuesta de Meta:", response);
            if (response.authResponse) {
                const accessToken = response.authResponse.code || response.authResponse.accessToken;
                linkWhatsAppAccount(accessToken);
            } else {
                alert('Cancelaste la ventana de Meta o hubo un error de conexión.');
            }
        }, {
            config_id: '2203459136878980', // Requerido para Embedded Signup
            response_type: 'code',
            override_default_response_type: true,
            extras: { setup: {  } }
        });
    };'''

# Use regex to replace the old handleMetaLogin
content = re.sub(r'const handleMetaLogin = \(\) => \{.*?\}\s*;\s*\}', new_handler, content, flags=re.DOTALL)
# Wait, the regex might be tricky. Let me just replace the specific block.
