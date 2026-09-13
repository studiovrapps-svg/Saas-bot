const pool = require('../config/db');
const { sendWhatsAppText, sendWhatsAppMenu, sendInteractiveButtons, logMessage, sendWhatsAppImage } = require('../services/whatsapp.service');
const { sendWhatsAppAI, chatCache } = require('../services/ai.service');

const verifyWebhook = (req, res) => { console.log('GET WEBHOOK RECIBIDO!');
    if (req.query[`hub.mode`] === "subscribe" && req.query[`hub.verify_token`] === process.env.WHATSAPP_VERIFY_TOKEN) {
        res.status(200).send(req.query[`hub.challenge`]);
    } else res.sendStatus(403);
};

const processWebhook = async (req, res) => {
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
            return res.sendStatus(200);
        }
        
        if (body.object && body.entry && body.entry[0].changes[0].value.messages) {
            let phone_number_id = body.entry[0].changes[0].value.metadata.phone_number_id;
            let from = body.entry[0].changes[0].value.messages[0].from;
            let profile_name = body.entry[0].changes[0].value.contacts?.[0]?.profile?.name || null;
            
            const tenantResult = await pool.query('SELECT * FROM tenants WHERE whatsapp_phone_id = $1', [phone_number_id]);
            if (tenantResult.rows.length === 0) return res.sendStatus(200);
            
            const tenant = tenantResult.rows[0];
            if (!tenant.is_active) {
                console.log(`🛑 Cliente ${tenant.name} está SUSPENDIDO. Ignorando mensajes.`);
                return res.sendStatus(200);
            }
            if (!tenant.whatsapp_token) return res.sendStatus(200);

            // Status validation happens later down with muted_until checking

                          // Extraer el texto real que escribió el usuario (o el botón que presionó, o media)
              let user_message = ``;
              let msgObj = body.entry[0].changes[0].value.messages[0];
              
              if (msgObj.type === `text`) {
                  user_message = msgObj.text.body;
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
                      user_message = await uploadImage(fakeFile, `tenant_${tenant.id}/chats`);
                  } else {
                      user_message = "[Error descargando imagen]";
                  }
              } else if (msgObj.type === `audio`) {
                  // Procesar audio (Transcribir y eliminar archivo)
                  const media_id = msgObj.audio.id;
                  const { downloadWhatsAppMedia } = require('../services/whatsapp.service');
                  const { transcribeAudio } = require('../services/ai.service');
                  const fs = require('fs');
                  const path = require('path');
                  
                  const buffer = await downloadWhatsAppMedia(media_id, tenant.whatsapp_token);
                  if (buffer) {
                      const crypto = require('crypto');
                      const os = require('os');
                      const tmpPath = path.join(os.tmpdir(), `audio_${crypto.randomUUID()}.ogg`);
                      fs.writeFileSync(tmpPath, buffer);
                      try {
                          user_message = await transcribeAudio(tmpPath, tenant.id);
                      } catch(e) {
                          user_message = "[Error transcribiendo audio]";
                      }
                      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath); // Limpieza inmediata
                  } else {
                      user_message = "[Error descargando audio]";
                  }
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
                return res.sendStatus(200); // Silent mode active
            }

            if (tenant.bot_tier === 1) {
                // Manejo de estado de pedido (Opción 3 y fotos de producto)
                
                

                // --- PILAR 4: MODO SILENCIO ---
                if (state.muted_until && Date.now() < state.muted_until) {
                    return res.sendStatus(200); // Ignorar mientras esté en silencio
                }

                // Helper para enviar menú principal interactivo
                const sendMainMenu = async () => {
                    let menus = tenant.tier1_menu || [];
                    let rows = [{ id: `btn_catalogo`, title: `🛍️ Ver productos` }];
                    menus.forEach((m, idx) => {
                        rows.push({ id: `btn_faq_${idx}`, title: m.title.substring(0, 24) });
                    });
                    
                    let payload = {
                        messaging_product: `whatsapp`,
                        to: from,
                        type: `interactive`,
                        interactive: {
                            type: `list`,
                            header: { type: `text`, text: `Menú Principal` },
                            body: { text: tenant.tier1_greeting || `¡Hola! Bienvenido a ${tenant.name}. ¿Cómo podemos ayudarte hoy?` },
                            action: {
                                button: `Ver opciones 👇`,
                                sections: [{ title: `Opciones disponibles`, rows: rows.slice(0,10) }]
                            }
                        }
                    };
                    await fetch(`https://graph.facebook.com/v19.0/${phone_number_id}/messages`, {
                        method: 'POST', headers: { 'Authorization': `Bearer ${tenant.whatsapp_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
                    });
                };

                const sendInteractiveButtons = async (text, buttons) => {
                    let payload = {
                        messaging_product: `whatsapp`,
                        to: from,
                        type: `interactive`,
                        interactive: {
                            type: `button`,
                            body: { text: text },
                            action: {
                                buttons: buttons.map(b => ({ type: `reply`, reply: { id: b.id, title: b.title } }))
                            }
                        }
                    };
                    await fetch(`https://graph.facebook.com/v19.0/${phone_number_id}/messages`, {
                        method: 'POST', headers: { 'Authorization': `Bearer ${tenant.whatsapp_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
                    });
                    await logMessage(tenant.id, from, 'outbound', 'interactive', text);
                };

                if (msgObj.type === `text`) {
                    let text = user_message.toLowerCase();

                    // --- PILAR 4: HANDOFF A HUMANO (Por texto) ---
                    if (text.includes(`asesor`) || text.includes(`humano`)) {
                        state.muted_until = Date.now() + 2 * 60 * 60 * 1000; await setSessionState(tenant.id, from, state); // 2 horas
                        await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, `👨‍💼 *Conectando con un asesor...*

He notificado a nuestro equipo. Un asesor humano leerá este chat y te responderá a la brevedad. (El bot se pausará temporalmente, tenant.id).`);
                        
                        // Pasar sesión a humano en DB
                        const sessionResult = await pool.query(`SELECT id FROM chat_sessions WHERE tenant_id = $1 AND user_phone = $2`, [tenant.id, from]);
                        if (sessionResult.rows.length > 0) {
                            await pool.query(`UPDATE chat_sessions SET status = 'humano' WHERE tenant_id = $1 AND user_phone = $2`, [tenant.id, from]);
                        } else {
                            await pool.query(`INSERT INTO chat_sessions (tenant_id, user_phone, status, platform) VALUES ($1, $2, 'humano', 'whatsapp')`, [tenant.id, from]);
                        }
                        return res.sendStatus(200);
                    }

                    // --- PILAR 1: MÁQUINA DE ESTADOS (CARRITO) ---
                    if (state.step === 'awaiting_quantity') {
                        if (isNaN(Number(user_message)) || Number(user_message) <= 0) {
                            await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, `Por favor, ingresa una cantidad numérica válida (ejemplo: 1, 2, 3).`, tenant.id);
                            return res.sendStatus(200);
                        }
                        let cart = state.cart || [];
                        cart.push({ product: state.product, quantity: Number(user_message), price: state.price || 0 });
                        
                        state.step = 'cart_decision'; state.cart = cart; await setSessionState(tenant.id, from, state);
                        
                        await sendInteractiveButtons(`🛒 *Producto añadido al carrito.*

¿Deseas seguir comprando o finalizar tu pedido?`, [
                            { id: `btn_add_more`, title: `🛍️ Seguir comprando` },
                            { id: `btn_checkout`, title: `✅ Finalizar pedido` }
                        ]);
                        return res.sendStatus(200);
                    } 
                    else if (state.step === 'awaiting_address') {
                        let cart = state.cart || [];
                        await delSessionState(tenant.id, from); state = await getSessionState(tenant.id, from);
                        
                        let cartSummary = cart.map(item => `📦 ${item.quantity}x ${item.product}`).join(``);
                        let finalMsg = `✅ *¡Pedido registrado con éxito!*

*Resumen de tu pedido:*
${cartSummary}
📍 Dirección: ${user_message}

Un asesor humano se contactará contigo por aquí en breve para coordinar el pago y la entrega. ¡Gracias por tu compra!`;
                        await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, finalMsg, tenant.id);
                        
                        // Insert into orders
                        await pool.query(
                            `INSERT INTO orders (tenant_id, customer_phone, items, delivery_address) VALUES ($1, $2, $3, $4)`,
                            [tenant.id, from, JSON.stringify(cart), user_message]
                        );
                        
                        // Pasar a humano
                        const sessionResult = await pool.query(`SELECT id FROM chat_sessions WHERE tenant_id = $1 AND user_phone = $2`, [tenant.id, from]);
                        if (sessionResult.rows.length > 0) {
                            await pool.query(`UPDATE chat_sessions SET status = 'humano' WHERE tenant_id = $1 AND user_phone = $2`, [tenant.id, from]);
                        } else {
                            await pool.query(`INSERT INTO chat_sessions (tenant_id, user_phone, status, platform) VALUES ($1, $2, 'humano', 'whatsapp')`, [tenant.id, from]);
                        }
                        return res.sendStatus(200);
                    }

                    // --- PILAR 2: GATILLOS DE PALABRAS CLAVE ---
                    let rules = [];
                    try {
                        rules = JSON.parse(tenant.business_rules || `[]`);
                    } catch(e) {}
                    
                    let matchedRule = rules.find(r => r.q && r.q.length >= 3 && text.includes(r.q.toLowerCase()));
                    if (matchedRule) {
                        await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, matchedRule.a, tenant.id);
                        await sendInteractiveButtons(`¿Puedo ayudarte con algo más?`, [
                            { id: `btn_main_menu`, title: `🔙 Menú Principal` }
                        ]);
                        return res.sendStatus(200);
                    }

                    // --- PILAR 3: RUTAS DE ESCAPE (FALLBACK ANTI-FRUSTRACIÓN) ---
                    await delSessionState(tenant.id, from); state = await getSessionState(tenant.id, from);
                    await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, `No te comprendí muy bien 😅. Para ayudarte rápido, por favor selecciona una de nuestras opciones:`, tenant.id);
                    await sendMainMenu();
                    return res.sendStatus(200);
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
                        await delSessionState(tenant.id, from); state = await getSessionState(tenant.id, from);
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
                        await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, `📝 Por favor, indícanos tu dirección de entrega completa para poder enviar tu pedido:`, tenant.id);
                    } else if (btnId.startsWith(`btn_faq_`)) {
                        let menus = tenant.tier1_menu || [];
                        let idx = parseInt(btnId.replace(`btn_faq_`, ``));
                        if (menus[idx]) {
                            if (menus[idx].image_url) {
                                await sendWhatsAppImage(phone_number_id, tenant.whatsapp_token, from, menus[idx].image_url, menus[idx].response, tenant.id);
                            } else {
                                await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, menus[idx].response, tenant.id);
                            }
                            // Siempre mandar el escape después de un FAQ
                            await sendInteractiveButtons(`¿Qué más deseas hacer?`, [
                                { id: `btn_main_menu`, title: `🔙 Menú Principal` }
                            ]);
                        }
                    } else if (btnId.startsWith(`prod_`)) {
                        let prodId = btnId.replace(`prod_`, ``);
                        let productoElegido = btnTitle;
                        
                        try {
                            const pRes = await pool.query('SELECT image_url, price FROM products WHERE id = $1', [prodId]);
                            if (pRes.rows.length > 0) {
                                state.price = pRes.rows[0].price;
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
        res.sendStatus(200); 
    } catch (error) { res.sendStatus(500); }
};


// ==========================================

// ==========================================
// ENDPOINTS DE LIVE CHAT
// ==========================================



module.exports = { verifyWebhook, processWebhook };
