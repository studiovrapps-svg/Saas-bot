import re

with open('App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Fix the products fetch to handle non-array responses
code = re.sub(
    r'const resP = await fetch\(`\$\{API_URL\}/productos/\$\{tenantId\}`\);\s*setProductos\(await resP\.json\(\)\);',
    r'const resP = await fetch(`${API_URL}/productos/${tenantId}`);\n      const dataP = await resP.json();\n      setProductos(Array.isArray(dataP) ? dataP : []);',
    code
)

with open('App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done")
