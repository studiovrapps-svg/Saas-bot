const pool = require('../config/db');
const { sendWhatsAppText, sendWhatsAppMenu, sendInteractiveButtons, logMessage, sendWhatsAppImage } = require('../services/whatsapp.service');
const { sendWhatsAppAI, chatCache } = require('../services/ai.service');

const verifyWebhook = (req, res) => { console.log('GET WEBHOOK RECIBIDO!');
    if (req.query[`hub.mode`] === "subscribe" && req.query[`hub.verify_token`] === process.env.WHATSAPP_VERIFY_TOKEN) {
        res.status(200).send(req.query[`hub.challenge`]);
    } else res.sendStatus(403);
};

const processWebhook = (req, res) => {
    res.sendStatus(200);
    setImmediate(async () => {
        try {
            let body = req.body;
        if (body.object && body.entry && body.entry[0].changes[0].value.statuses) {
            // META DELIVERY RECEIPTS
            const statusObj = body.entry[0].changes[0].value.statuses[0];
            const meta_id = statusObj.id;
            const status = statusObj.status; // sent, delivered, read
            
            await pool.query(
                `UPDATE messages SET delivery_status = $1 WHERE meta_message_id = $2`,
                [status, meta_id]
            );
            return;
        }
        
        if (body.object && body.entry && body.entry[0].changes[0].value.messages) {
            let phone_number_id = body.entry[0].changes[0].value.metadata.phone_number_id;
            let from = body.entry[0].changes[0].value.messages[0].from;
            let profile_name = body.entry[0].changes[0].value.contacts?.[0]?.profile?.name || null;
            
            const tenantResult = await pool.query('SELECT * FROM tenants WHERE whatsapp_phone_id = $1', [phone_number_id]);
            if (tenantResult.rows.length === 0) return;
            
            const tenant = tenantResult.rows[0];
            if (!tenant.is_active) {
                console.log(`🛑 Cliente ${tenant.name} está SUSPENDIDO. Ignorando mensajes.`);
                return;
            }
            if (!tenant.whatsapp_token) return;

            // Status validation happens later down with muted_until checking

                          // Extraer el texto real que escribió el usuario (o el botón que presionó, o media)
              let user_message = ``;
              let msgObj = body.entry[0].changes[0].value.messages[0];
              
              if (msgObj.type === `text`) {
                  user_message = msgObj.text?.body || '';
              } else if (msgObj.type === `interactive`) {
                  if (msgObj.interactive.type === `list_reply`) user_message = msgObj.interactive.list_reply.title;
                  else if (msgObj.interactive.type === `button_reply`) user_message = msgObj.interactive.button_reply.title;
              } else if (msgObj.type === `image`) {
                  // Procesar imagen (Guardar permanente en AWS)
                  const media_id = msgObj.image.id;
                  const mime_type = msgObj.image.mime_type || 'image/jpeg';
                  const ext = mime_type.split('/')[1] || 'jpg';
                  
                  const { downloadWhatsAppMedia } = require('../services/whatsapp.service');
                  const { uploadImage } = require('../services/aws.service');
                  
                  const buffer = await downloadWhatsAppMedia(media_id, tenant.whatsapp_token);
                    if (buffer) {
                        const fakeFile = {
                            originalname: `img_${Date.now()}.${ext}`,
                            buffer: buffer,
                            mimetype: mime_type
                        };
                        const s3Url = await uploadImage(fakeFile, `tenant_${tenant.id}/chats`);
                        user_message = (msgObj.image.caption ? msgObj.image.caption + '\n' : '') + `[Imagen adjunta: ${s3Url}]`;
                    } else {
                      user_message = "[Error descargando imagen]";
                  }
              } else if (msgObj.type === `audio`) {
                  const media_id = msgObj.audio.id;
                  const { downloadWhatsAppMedia } = require('../services/whatsapp.service');
                  const { transcribeAudio } = require('../services/ai.service');
                  const buffer = await downloadWhatsAppMedia(media_id, tenant.whatsapp_token);
                  if (buffer) {
                      try {
                          user_message = await transcribeAudio(buffer, tenant.id);
                      } catch(e) {
                          user_message = "[Error transcribiendo audio]";
                      }
                  } else {
                      user_message = "[Error descargando audio]";
                  }
              } else {
                      user_message = "[Error descargando audio]";
                  }
              } else {
                  user_message = `[Multimedia o documento adjunto: ${msgObj.type}]`;
              }
            
            // Log incoming message
            await logMessage(tenant.id, from, 'inbound', msgObj.type, user_message || `media`, null, 'received', profile_name);
            
            // GLOBAL MUTE CHECK (For human handoff in ANY tier)
            
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

            let state = await getSessionState(tenant.id, from);
            let muteUntil = state.muted_until;
            if (muteUntil && Date.now() < muteUntil) {
                return; // Silent mode active
            }

            // --- PILAR 4 (GLOBAL): HANDOFF A HUMANO (Por texto) ---
            if (user_message && (user_message.toLowerCase().includes('asesor') || user_message.toLowerCase().includes('humano')) && state.step !== 'awaiting_address' && state.step !== 'awaiting_quantity') {
                state.muted_until = Date.now() + 2 * 60 * 60 * 1000; await setSessionState(tenant.id, from, state);
                await pool.query(`INSERT INTO chat_sessions (tenant_id, user_phone, status, state_data) VALUES ($1, $2, 'humano', $3) ON CONFLICT (tenant_id, user_phone) DO UPDATE SET status = 'humano', last_interaction = NOW(), state_data = jsonb_set(COALESCE(chat_sessions.state_data, \'{}\'), \'{muted_until}\', $4::jsonb)`, [tenant.id, from, JSON.stringify({ muted_until: state.muted_until }), state.muted_until.toString()]);
                await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, `👩‍💻 *Conectando con un asesor...*\n\nHe notificado a nuestro equipo. Un asesor humano leerá este chat y te responderá a la brevedad. (El bot se pausará temporalmente).`, tenant.id);
                return;
            }

            if (tenant.bot_tier === 1) {
                // Manejo de estado de pedido (Opción 3 y fotos de producto)
                
                



                // Helper para enviar menú principal interactivo
                const sendMainMenu = async () => {
                    let menus = Array.isArray(tenant.tier1_menu) ? tenant.tier1_menu : JSON.parse(tenant.tier1_menu || '[]');
                    let rows = [{ id: `btn_catalogo`, title: `🛍️ Ver productos` }];
                    menus.forEach((m, idx) => {
                        if (m.title && m.title.trim().length > 0) {
                            rows.push({ id: `btn_faq_${idx}`, title: m.title.trim().substring(0, 24) });
                        }
                    });
                    
                    const finalRows = rows.slice(0, 10);
                    let payload = {
                        messaging_product: `whatsapp`,
                        to: from,
                        type: `interactive`,
                        interactive: {
                            type: `list`,
                            header: { type: `text`, text: `Menú Principal` },
                            body: { text: tenant.tier1_greeting || `¡Hola! Bienvenido a ${tenant.name}. ¿Cómo podemos ayudarte hoy?` },
                            action: {
                                button: `Opciones`,
                                sections: [{ title: `Opciones disponibles`, rows: finalRows }]
                            }
                        }
                    };
                    const metaRes = await fetch(`https://graph.facebook.com/v19.0/${phone_number_id}/messages`, {
                        method: 'POST', headers: { 'Authorization': `Bearer ${tenant.whatsapp_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
                    });
                    const metaResData = await metaRes.json();
                    console.log("META RESPONSE:", JSON.stringify(metaResData, null, 2));
                    await logMessage(tenant.id, from, 'outbound', 'interactive', 'Menú Principal enviado');
                };

                if (msgObj.type === `text` || msgObj.type === `image` || (msgObj.type === `audio` && user_message)) {
                    let text = user_message.toLowerCase();

                    // Skip state destruction if in cart decision
                    if (state.step === 'cart_decision') { if (['cancelar', 'menu', 'salir', 'volver', 'reiniciar'].some(k => text.includes(k))) { await delSessionState(tenant.id, from); await sendMainMenu(); return; } await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, 'Por favor, selecciona una de las opciones en los botones de arriba para continuar tu compra, o escribe *cancelar* para volver al inicio.', tenant.id); return; }

                    // Handoff movido globalmente arriba
                    // --- PILAR 1: MÁQUINA DE ESTADOS (CARRITO) ---
                    if (state.step === 'awaiting_quantity') {
                        if (['cancelar', 'menu', 'salir', 'volver'].some(k => user_message.toLowerCase().includes(k))) { await delSessionState(tenant.id, from); await sendMainMenu(); return; } 
                        const parsedQty = parseInt(user_message.trim(), 10);
                        if (isNaN(parsedQty) || parsedQty <= 0 || parsedQty.toString() !== user_message.trim() || parsedQty > 999) {
                            await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, `Por favor, ingresa una cantidad numérica entera válida (ejemplo: 1, 2, 3) o escribe *cancelar*.`, tenant.id);
                            return;
                        }
                        let cart = state.cart || [];
                        cart.push({ product: state.product, quantity: parsedQty, price: state.price || 0 });
                        
                        state.step = 'cart_decision'; state.cart = cart; await setSessionState(tenant.id, from, state);
                        
                        await sendInteractiveButtons(phone_number_id, tenant.whatsapp_token, from, `🛒 *Producto añadido al carrito.*

¿Deseas seguir comprando o finalizar tu pedido?`, [
                            { id: `btn_add_more`, title: `🛍️ Seguir comprando` },
                            { id: `btn_checkout`, title: `✅ Finalizar pedido` }
                        ]);
                        return;
                    } 
                    else if (state.step === 'awaiting_address') {
                        if (['cancelar', 'menu', 'salir', 'volver'].some(k => text.includes(k))) { await delSessionState(tenant.id, from); await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, 'Pedido cancelado. Volviendo al menú principal...', tenant.id); await sendMainMenu(); return; } if (user_message.trim().length < 5) {
                            await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, `Por favor, indícanos una dirección de entrega válida y detallada.`, tenant.id);
                            return;
                        }
                        let cart = state.cart || [];
                        await delSessionState(tenant.id, from); state = await getSessionState(tenant.id, from);
                        
                        let cartSummary = cart.map(item => `📦 ${item.quantity}x ${item.product}`).join('\n');
                        let finalMsg = `✅ *¡Pedido registrado con éxito!*

*Resumen de tu pedido:*
${cartSummary}
📍 Datos de entrega: ${user_message}

Un asesor humano se contactará contigo por aquí en breve para coordinar el pago y la entrega. ¡Gracias por tu compra!`;
                        await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, finalMsg, tenant.id);
                        
                        // Insert into orders
                        await pool.query(
                            `INSERT INTO orders (tenant_id, customer_phone, items, delivery_address) VALUES ($1, $2, $3, $4)`,
                            [tenant.id, from, JSON.stringify(cart), user_message]
                        );
                        
                        // Pasar a humano
                        state.muted_until = Date.now() + 2 * 60 * 60 * 1000; await setSessionState(tenant.id, from, state);
                        const sessionResult = await pool.query(`SELECT id FROM chat_sessions WHERE tenant_id = $1 AND user_phone = $2`, [tenant.id, from]);
                        if (sessionResult.rows.length > 0) {
                            await pool.query(`UPDATE chat_sessions SET status = 'humano' WHERE tenant_id = $1 AND user_phone = $2`, [tenant.id, from]);
                        } else {
                            await pool.query(`INSERT INTO chat_sessions (tenant_id, user_phone, status) VALUES ($1, $2, 'humano')`, [tenant.id, from]);
                        }
                        return;
                    }

                    // --- PILAR 2: GATILLOS DE PALABRAS CLAVE ---
                    let rules = [];
                    try {
                        rules = Array.isArray(tenant.business_rules) ? tenant.business_rules : JSON.parse(tenant.business_rules || '[]');
                    } catch(e) {}
                    
                    let matchedRule = rules.find(r => r.q && r.q.length >= 3 && text.includes(r.q.toLowerCase()));
                    if (matchedRule) {
                        await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, matchedRule.a, tenant.id);
                        
                        if (matchedRule.action === 'catalog') {
                            await sendWhatsAppMenu(phone_number_id, tenant.whatsapp_token, from, tenant.id, tenant.name);
                        } else if (matchedRule.action === 'transfer') {
                            state.muted_until = Date.now() + 2 * 60 * 60 * 1000; await setSessionState(tenant.id, from, state);
                            await pool.query(`UPDATE chat_sessions SET status = 'humano', last_interaction = NOW() WHERE tenant_id = $1 AND user_phone = $2`, [tenant.id, from]);
                        } else {
                            await sendInteractiveButtons(phone_number_id, tenant.whatsapp_token, from, `¿Puedo ayudarte con algo más?`, [
                                { id: `btn_main_menu`, title: `🏠 Menú Principal` }
                            ]);
                        }
                        return;
                    }

                    // --- PILAR 3: RUTAS DE ESCAPE (FALLBACK ANTI-FRUSTRACIÓN) ---
                    await delSessionState(tenant.id, from); state = await getSessionState(tenant.id, from);
                    
                    const isGreeting = ['hola', 'menu', 'menú', 'inicio', 'buenas', 'buenos', 'saludos', 'ayuda', 'ola'].some(g => text.includes(g));
                    
                    if (!isGreeting) {
                        await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, `No te comprendí muy bien 😅. Para ayudarte rápido, por favor selecciona una de nuestras opciones:`, tenant.id);
                    }
                    
                    await sendMainMenu();
                    return;
                }

                if (msgObj.type === `interactive`) {
                    let btnId = ``;
                    let btnTitle = ``;
                    if (msgObj.interactive.type === `list_reply`) {
                        btnId = msgObj.interactive.list_reply.id;
                        btnTitle = msgObj.interactive.list_reply.title;
                    } else if (msgObj.interactive.type === `button_reply`) {
                        btnId = msgObj.interactive.button_reply.id;
                        btnTitle = msgObj.interactive.button_reply.title;
                    }

                    if (btnId === `btn_main_menu` || btnId === `btn_catalogo`) {
                        let preservedCart = state.cart;
                        await delSessionState(tenant.id, from); state = await getSessionState(tenant.id, from);
                        if (preservedCart) { state.cart = preservedCart; await setSessionState(tenant.id, from, state); }
                        
                        if (btnId === `btn_catalogo`) {
                            await sendWhatsAppMenu(phone_number_id, tenant.whatsapp_token, from, tenant.id, tenant.name);
                        } else {
                            await sendMainMenu();
                        }
                    } else if (btnId === `btn_add_more`) {
                        state.step = 'adding_more'; await setSessionState(tenant.id, from, state);
                        await sendWhatsAppMenu(phone_number_id, tenant.whatsapp_token, from, tenant.id, tenant.name);
                    } else if (btnId === `btn_checkout`) {
                        state.step = 'awaiting_address'; await setSessionState(tenant.id, from, state);
                        await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, `🛍️ Por favor, indícanos tu **Nombre Completo y Dirección exacta** para poder procesar y enviar tu pedido:`, tenant.id);
                    } else if (btnId.startsWith(`btn_faq_`)) {
                        let menus = Array.isArray(tenant.tier1_menu) ? tenant.tier1_menu : JSON.parse(tenant.tier1_menu || '[]');
                        let idx = parseInt(btnId.replace(`btn_faq_`, ``));
                        if (menus[idx]) {
                            if (menus[idx].image_url) {
                                await sendWhatsAppImage(phone_number_id, tenant.whatsapp_token, from, menus[idx].image_url, (menus[idx].response || '').substring(0, 1024), tenant.id);
                            } else {
                                await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, menus[idx].response, tenant.id);
                            }
                            
                            if (menus[idx].action === 'catalog') {
                                await sendWhatsAppMenu(phone_number_id, tenant.whatsapp_token, from, tenant.id, tenant.name);
                            } else if (menus[idx].action === 'transfer') {
                                state.muted_until = Date.now() + 2 * 60 * 60 * 1000; await setSessionState(tenant.id, from, state);
                                await pool.query(`UPDATE chat_sessions SET status = 'humano', last_interaction = NOW() WHERE tenant_id = $1 AND user_phone = $2`, [tenant.id, from]);
                            } else {
                                // Siempre mandar el escape despuǸs de un FAQ normal
                                await sendInteractiveButtons(phone_number_id, tenant.whatsapp_token, from, `¿Qué más deseas hacer?`, [
                                    { id: `btn_main_menu`, title: `🏠 Menú Principal` }
                                ]);
                            }
                        }
                    } else if (btnId.startsWith(`prod_`)) {
                        let prodId = btnId.replace(`prod_`, ``);
                        let productoElegido = btnTitle;
                        
                        try {
                            const pRes = await pool.query('SELECT name, image_url, price FROM products WHERE id = $1', [prodId]);
                            if (pRes.rows.length > 0) {
                                state.price = pRes.rows[0].price;
                                productoElegido = pRes.rows[0].name;
                                if (pRes.rows[0].image_url) {
                                    await sendWhatsAppImage(phone_number_id, tenant.whatsapp_token, from, pRes.rows[0].image_url, `Seleccionaste: *${productoElegido}*`, tenant.id);
                                }
                            }
                        } catch(e) { console.error(`Error buscando info de producto`, e); }

                        state.step = 'awaiting_quantity'; state.product = productoElegido; await setSessionState(tenant.id, from, state);
                        await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, `¡Excelente elección! 📦\n\n¿Cuántas unidades deseas llevar? (Responde con un número)`, tenant.id);

                    } else {
                        // Fallback fallback
                        await sendMainMenu();
                    }
                }
} else if (tenant.bot_tier >= 2) {
                await sendWhatsAppAI(phone_number_id, tenant.whatsapp_token, from, tenant.id, tenant.name, tenant.system_prompt, user_message);
            }
        }
        return; 
    } catch (error) { 
        console.error("WEBHOOK CRASH DETAILED:", error);
    }
    });
};


// ==========================================

// ==========================================
// ENDPOINTS DE LIVE CHAT
// ==========================================



module.exports = { verifyWebhook, processWebhook };
