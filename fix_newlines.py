import re

with open('bot-engine-backend/index.js', 'r', encoding='utf-8') as f:
    code = f.read()

# I need to fix the multi-line string literals that broke due to python string parsing.
# The issue is at:
# await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, "👨‍💼 *Conectando con un asesor...*

bad_str_1 = '''await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, "👨‍💼 *Conectando con un asesor...*\\n\\nHe notificado a nuestro equipo. Un asesor humano leer este chat y te responder a la brevedad. (El bot se pausar temporalmente).");'''
good_str_1 = 'await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, `👨‍💼 *Conectando con un asesor...*\\n\\nHe notificado a nuestro equipo. Un asesor humano leer este chat y te responder a la brevedad. (El bot se pausar temporalmente).`);'

bad_str_2 = '''await sendInteractiveButtons("🛒 *Producto aadido al carrito.*\\n\\nDeseas seguir comprando o finalizar tu pedido?", ['''
good_str_2 = 'await sendInteractiveButtons(`🛒 *Producto aadido al carrito.*\\n\\nDeseas seguir comprando o finalizar tu pedido?`, ['

bad_str_3 = '''let finalMsg = `📝 *Pedido registrado con xito!*\\n\\n*Resumen de tu pedido:*\\n${cartSummary}\\n📍 Direccin: ${user_message}\\n\\nUn asesor humano se contactar contigo por aqu en breve para coordinar el pago y la entrega. Gracias por tu compra!`;'''
good_str_3 = 'let finalMsg = `📝 *Pedido registrado con xito!*\\n\\n*Resumen de tu pedido:*\\n${cartSummary}\\n📍 Direccin: ${user_message}\\n\\nUn asesor humano se contactar contigo por aqu en breve para coordinar el pago y la entrega. Gracias por tu compra!`;'

bad_str_4 = '''await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, `Excelente eleccin! 🌟\\n\\nCuntas unidades deseas llevar? (Responde con un nmero)`);'''
good_str_4 = 'await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, `Excelente eleccin! 🌟\\n\\nCuntas unidades deseas llevar? (Responde con un nmero)`);'


# It's easier to just re-run the apply script but with RAW strings in python!
code = re.sub(r'"👨‍💼 \*Conectando con un asesor...\*\n\nHe notificado.*?\);', good_str_1, code, flags=re.DOTALL)
code = re.sub(r'"🛒 \*Producto aadido al carrito\.\*\n\nDeseas seguir comprando.*?", \[', good_str_2, code, flags=re.DOTALL)

with open('bot-engine-backend/index.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done")
