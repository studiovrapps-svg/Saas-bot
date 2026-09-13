import re

with open('App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Fix the JSX syntax error using regex
code = re.sub(
    r'<p className="text-gray-500 text-sm mb-6 px-2">\{Esta acci.*?n no se puede deshacer y se eliminar.*?\s*\{deleteConfirm\.type === \'producto\' \? \'de tu cat.*?logo de WhatsApp inmediatamente\.\' : \'de la configuraci.*?n de tu bot de WhatsApp\.\'\}\}</p>',
    r'<p className="text-gray-500 text-sm mb-6 px-2">Esta acción no se puede deshacer y se eliminará {deleteConfirm.type === \'producto\' ? \'de tu catálogo de WhatsApp inmediatamente.\' : \'de la configuración de tu bot de WhatsApp.\'}</p>',
    code
)

with open('App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done")
