with open('bot-engine-backend/index.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(len(lines)):
    # if it has a literal newline inside quotes, it's breaking node.
    if 'await sendInteractiveButtons("' in lines[i] and 'carrito' in lines[i]:
        lines[i] = '                        await sendInteractiveButtons(`🛒 *Producto añadido al carrito.*\\n\\n¿Deseas seguir comprando o finalizar tu pedido?`, [\n'
        # next line might be the continuation, blank it
        if 'Deseas seguir comprando' in lines[i+1] or 'finalizar tu pedido' in lines[i+1]:
            lines[i+1] = '\n'
            
    if 'let finalMsg = `' in lines[i] and 'Pedido registrado' in lines[i]:
        lines[i] = '                        let finalMsg = `📦 *¡Pedido registrado con éxito!*\\n\\n*Resumen de tu pedido:*\\n${cartSummary}\\n📍 Dirección: ${user_message}\\n\\nUn asesor humano se contactará contigo por aquí en breve para coordinar el pago y la entrega. ¡Gracias por tu compra!`;\n'
        if 'Resumen de tu pedido' in lines[i+1]:
            lines[i+1] = '\n'
            lines[i+2] = '\n'
            lines[i+3] = '\n'
            
    if 'await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, "' in lines[i] and 'Excelente' in lines[i]:
        lines[i] = '                        await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, `¡Excelente elección! 🌟\\n\\n¿Cuántas unidades deseas llevar? (Responde con un número)`);\n'
        if 'unidades deseas llevar' in lines[i+1] or '(Responde con un n' in lines[i+1]:
            lines[i+1] = '\n'
            lines[i+2] = '\n'

with open('bot-engine-backend/index.js', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print("Done")
