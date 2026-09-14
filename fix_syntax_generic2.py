with open('bot-engine-backend/index.js', 'r', encoding='utf-8') as f:
    code = f.read()

bad = '¿Cuántas unidades deseas llevar? (Responde con un número, tenant.id)`);'
good = '¿Cuántas unidades deseas llevar? (Responde con un número)`);'
code = code.replace(bad, good)
code = code.replace('\n`', '`') # fix weird spanning backticks

with open('bot-engine-backend/index.js', 'w', encoding='utf-8') as f:
    f.write(code)
print("Done generic 2")
