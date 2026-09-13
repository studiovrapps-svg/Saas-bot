import re

def update_webhook():
    file_path = "C:/Antigravity/Chatbots/bot-engine-backend/src/controllers/webhook.controller.js"
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Helpers DB state
    helpers = """
            // --- Helper Functions for State (DB) ---
            async function getSessionState(t_id, phone) {
                const res = await pool.query('SELECT state_data FROM chat_sessions WHERE tenant_id = $1 AND user_phone = $2', [t_id, phone]);
                if (res.rows.length > 0 && res.rows[0].state_data) return res.rows[0].state_data;
                return {};
            }
            async function setSessionState(t_id, phone, newState) {
                await pool.query(
                    'INSERT INTO chat_sessions (tenant_id, user_phone, state_data) VALUES ($1, $2, $3) ON CONFLICT (tenant_id, user_phone) DO UPDATE SET state_data = $3',
                    [t_id, phone, JSON.stringify(newState)]
                );
            }
            async function delSessionState(t_id, phone) {
                const state = await getSessionState(t_id, phone);
                if (state.muted_until) {
                    await setSessionState(t_id, phone, { muted_until: state.muted_until });
                } else {
                    await pool.query('UPDATE chat_sessions SET state_data = $3 WHERE tenant_id = $1 AND user_phone = $2', [t_id, phone, JSON.stringify({})]);
                }
            }
"""

    content = content.replace("let muteKey = `mute_${tenant.id}_${from}`;", helpers + "\n            let state = await getSessionState(tenant.id, from);")
    content = content.replace("let muteUntil = chatCache.get(muteKey);", "let muteUntil = state.muted_until;")
    
    content = content.replace("let cacheKey = `tier1_${tenant.id}_${from}`;", "")
    content = content.replace("let state = chatCache.get(cacheKey) || {};", "")
    
    content = content.replace("chatCache.set(cacheKey, { muted_until: Date.now() + 2 * 60 * 60 * 1000 }, 7200);", "state.muted_until = Date.now() + 2 * 60 * 60 * 1000; await setSessionState(tenant.id, from, state);")
    
    content = content.replace("chatCache.set(cacheKey, { step: 'cart_decision', cart: cart }, 3600);", "state.step = 'cart_decision'; state.cart = cart; await setSessionState(tenant.id, from, state);")
    
    content = content.replace("chatCache.del(cacheKey);", "await delSessionState(tenant.id, from); state = await getSessionState(tenant.id, from);")
    
    content = content.replace("chatCache.set(cacheKey, { step: 'adding_more', cart: state.cart || [] }, 3600);", "state.step = 'adding_more'; await setSessionState(tenant.id, from, state);")
    
    content = content.replace("chatCache.set(cacheKey, { step: 'awaiting_address', cart: state.cart || [] }, 3600);", "state.step = 'awaiting_address'; await setSessionState(tenant.id, from, state);")
    
    content = content.replace("chatCache.set(cacheKey, { step: 'awaiting_quantity', product: productoElegido, cart: state.cart || [] }, 3600);", "state.step = 'awaiting_quantity'; state.product = productoElegido; await setSessionState(tenant.id, from, state);")

    # Fix logic for awaiting_quantity validation
    content = content.replace(
        """if (state.step === 'awaiting_quantity') {
                        let cart = state.cart || [];
                        cart.push({ product: state.product, quantity: user_message });""",
        """if (state.step === 'awaiting_quantity') {
                        if (isNaN(Number(user_message)) || Number(user_message) <= 0) {
                            await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, `Por favor, ingresa una cantidad numérica válida (ejemplo: 1, 2, 3).`);
                            return res.sendStatus(200);
                        }
                        let cart = state.cart || [];
                        cart.push({ product: state.product, quantity: Number(user_message) });"""
    )
    
    # Fix btn_checkout prompt string
    content = content.replace(
        """} else if (btnId === `btn_checkout`) {
                        state.step = 'awaiting_address'; await setSessionState(tenant.id, from, state);
                        await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, `¡Excelente elección! 🌟\\n\\n¿Cuántas unidades deseas llevar? (Responde con un número)`);""",
        """} else if (btnId === `btn_checkout`) {
                        state.step = 'awaiting_address'; await setSessionState(tenant.id, from, state);
                        await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, `📝 Por favor, indícanos tu dirección de entrega completa para poder enviar tu pedido:`);"""
    )

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

update_webhook()

def update_ai_service():
    file_path = "C:/Antigravity/Chatbots/bot-engine-backend/src/services/ai.service.js"
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # In ai.service, we replace the chatCache.set(`mute_...`) with a DB update
    content = content.replace(
        "chatCache.set(`mute_${tenant_id}_${to}`, Date.now() + (2 * 60 * 60 * 1000));",
        """
                    // Update state in DB instead of cache
                    await pool.query(
                        'INSERT INTO chat_sessions (tenant_id, user_phone, state_data) VALUES ($1, $2, $3) ON CONFLICT (tenant_id, user_phone) DO UPDATE SET state_data = jsonb_set(COALESCE(chat_sessions.state_data, \\'{}\\'), \\'{muted_until}\\', $4::jsonb)',
                        [tenant_id, to, JSON.stringify({ muted_until: Date.now() + (2 * 60 * 60 * 1000) }), (Date.now() + (2 * 60 * 60 * 1000)).toString()]
                    );
        """
    )
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

update_ai_service()
