import re

with open('App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace the hardcoded block with a regex check or just remove it
old_check = """        const APP_ID = 'AQUI_TU_APP_ID_DE_META'; 
        if (APP_ID === 'AQUI_TU_APP_ID_DE_META') {
            alert("🛑 ¡Alto ahí! Aún no has puesto tu APP_ID de Meta en el código. Abre App.jsx y reemplaza 'AQUI_TU_APP_ID_DE_META' con tu ID real de Meta for Developers.");
            return;
        }"""

new_check = """        // Check if the script was initialized with the placeholder
        if (document.body.innerHTML.includes('AQUI_TU_APP_ID_DE_META')) {
            alert("🛑 ¡Alto ahí! Aún no has puesto tu APP_ID de Meta en el código. Abre App.jsx y reemplaza 'AQUI_TU_APP_ID_DE_META' con tu ID real de Meta for Developers.");
            return;
        }"""

code = code.replace(old_check, new_check)

with open('App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done")
