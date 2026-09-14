const fs = require('fs');
const path = './bot-engine-frontend/src/App.jsx';
let content = fs.readFileSync(path, 'utf8');

const oldHandler =   const handleMetaLogin = () => {
        if (!window.FB) {
            alert("?? El SDK de Facebook no ha cargado. Revisa tu consola de internet.");
            return;
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
    };;

const newHandler =   const handleMetaLogin = () => {
        if (!window.FB) {
            alert("?? El SDK de Facebook no ha cargado. Revisa tu consola de internet.");
            return;
        }

        try {
            window.FB.init({
                appId      : '1567518045121608',
                cookie     : true,
                xfbml      : true,
                version    : 'v19.0'
            });
        } catch(e) { console.log(e); }

        console.log("Iniciando popup de Meta...");
        window.FB.login((response) => {
            console.log("Respuesta de Meta:", response);
            if (response.authResponse) {
                const accessToken = response.authResponse.code || response.authResponse.accessToken;
                linkWhatsAppAccount(accessToken);
            } else {
                alert('Cancelaste la ventana de Meta o hubo un error de conexion.');
            }
        }, {
            config_id: '2203459136878980',
            response_type: 'code',
            override_default_response_type: true,
            extras: { setup: {  } }
        });
    };;

// Because of character encoding differences ( vs ó), doing a regex replace for the whole block is safer.
const re = /const handleMetaLogin = \(\) => \{[\s\S]*?config_id: '2203459136878980'[\s\S]*?\}\);[\s\n]*\};/;
content = content.replace(re, newHandler);
fs.writeFileSync(path, content, 'utf8');
console.log('Fixed');
