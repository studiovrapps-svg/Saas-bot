import sys, re
file_path = r'../bot-engine-frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Just inject it somewhere near 'Cerrar Sesión' or something in the configuration tab
search_str = 'onClick={logout} className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl shadow-md"'
replace_str = '''onClick={async () => {
                        try {
                            const res = await fetch(\\/billing/checkout\, {
                                method: 'POST',
                                headers: { 'Authorization': \Bearer \\ }
                            });
                            const data = await res.json();
                            if (data.checkout_url) window.location.href = data.checkout_url;
                            else alert('Error: ' + data.error);
                        } catch (e) { alert('Error de red al intentar generar pago'); }
                    }} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl shadow-md mr-4">
                        ?? Renovar Suscripción (Recurrente)
                    </button>
                    <button onClick={logout} className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl shadow-md"'''

content = content.replace(search_str, replace_str)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Frontend patched')
