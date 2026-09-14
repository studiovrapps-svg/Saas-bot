import re

with open('bot-engine-backend/index.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace all `"👨‍💼 *Conectando...` (and others) with backticks instead of quotes
code = code.replace('"👨‍💼 *Conectando con un asesor...*', '`👨‍💼 *Conectando con un asesor...*')
code = code.replace('(El bot se pausar temporalmente).");', '(El bot se pausar temporalmente).`);')

code = code.replace('"🛒 *Producto aadido al carrito.*', '`🛒 *Producto aadido al carrito.*')
code = code.replace('o finalizar tu pedido?", [', 'o finalizar tu pedido?`, [')

with open('bot-engine-backend/index.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done")
