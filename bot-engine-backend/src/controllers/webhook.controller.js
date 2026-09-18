const socketConfig = require('../config/socket');
const crypto = require('crypto');
const { sendWhatsAppText, sendWhatsAppMenu, sendInteractiveButtons, logMessage, sendWhatsAppImage } = require('../services/whatsapp.service');
const { sendWhatsAppAI } = require('../services/ai.service');
const { downloadWhatsAppMedia } = require('../services/whatsapp.service');
const { uploadImage } = require('../services/aws.service');
const { transcribeAudio } = require('../services/ai.service');

// Repositories & Config
const tenantRepo = require('../repositories/tenant.repository');
const sessionRepo = require('../repositories/session.repository');
const messageRepo = require('../repositories/message.repository');
const orderRepo = require('../repositories/order.repository');
const productRepo = require('../repositories/product.repository');
const { KEYWORDS, COPY, HANDOFF_SILENCE_DURATION_MS } = require('../config/constants');

const verifyWebhook = (req, res) => {
    if (req.query[`hub.mode`] === "subscribe" && req.query[`hub.verify_token`] === process.env.WHATSAPP_VERIFY_TOKEN) {
        res.status(200).send(req.query[`hub.challenge`]);
    } else {
        res.sendStatus(403);
    }
};

const processWebhook = (req, res) => {
    // 1. Validar Firma Criptográfica de Meta
    if (process.env.META_APP_SECRET) {
        const signature = req.headers['x-hub-signature-256'];
        if (!signature || !req.rawBody) {
            console.error("Falta firma x-hub-signature-256 o cuerpo en la petición");
            return res.sendStatus(401);
        }
        const expectedSignature = 'sha256=' + crypto.createHmac('sha256', process.env.META_APP_SECRET).update(req.rawBody).digest('hex');
        const sigBuffer = Buffer.from(signature);
        const expectedBuffer = Buffer.from(expectedSignature);
        
        if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
            console.error("Firma de Meta inválida. Posible ataque de Spoofing o Timing Attack.");
            return res.sendStatus(401);
        }
    }

    res.sendStatus(200);

    setImmediate(async () => {
        try {
            const body = req.body;
            if (!body.object || !body.entry) return;

            // --- 2. META DELIVERY RECEIPTS ---
            if (body.entry[0].changes[0].value.statuses) {
                const statusObj = body.entry[0].changes[0].value.statuses[0];
                const tenantId = await messageRepo.updateDeliveryStatus(statusObj.id, statusObj.status);
                if (tenantId) {
                    try {
                        socketConfig.getIO().to(`tenant_${tenantId}`).emit('message_status_update', { meta_id: statusObj.id, status: statusObj.status });
                    } catch (error) {
                        console.warn("⚠️ Advertencia: No se pudo emitir status update a Socket.IO.", error.message);
                    }
                }
                return; // Early return para receipts
            }
            
            // --- 3. MENSAJES ENTRANTES ---
            if (!body.entry[0].changes[0].value.messages) return;

            const phone_number_id = body.entry[0].changes[0].value.metadata.phone_number_id;
            const from = body.entry[0].changes[0].value.messages[0].from;
            const profile_name = body.entry[0].changes[0].value.contacts?.[0]?.profile?.name || null;
            const msgObj = body.entry[0].changes[0].value.messages[0];

            // 4. Validar Tenant
            const tenant = await tenantRepo.getTenantByPhoneId(phone_number_id);
            if (!tenant || !tenant.is_active || !tenant.whatsapp_token) return;

            // 5. PROTECCIÓN ANTI-DUPLICADOS (Idempotencia)
            if (msgObj.id) {
                try {
                    await messageRepo.acquireIdempotencyLock(msgObj.id);
                } catch (error) {
                    if (error.code === '23505') {
                        console.log(`[Idempotencia] 🛡️ Webhook duplicado de Meta bloqueado. wamid: ${msgObj.id}`);
                        return;
                    }
                    throw error; 
                }
            }

            // 6. Extracción de Contenido del Mensaje
            let user_message = await extractMessageContent(msgObj, tenant);

            // Log de entrada
            await logMessage(tenant.id, from, 'inbound', msgObj.type, user_message || `media`, msgObj.id, 'received', profile_name, 'customer');
            
            // Evento WebSocket
            try {
                socketConfig.getIO().to(`tenant_${tenant.id}`).emit('new_message', { phone: from, message: user_message, direction: 'inbound', isAudio: msgObj.type === 'audio' });
            } catch(error) {
                console.warn("⚠️ Advertencia: No se pudo emitir a Socket.IO. El mensaje fue procesado en DB.", error.message);
            }

            // 7. Gestión de Estado de Sesión (Máquina de Estados)
            let { state, status: sessionStatus, customer_name } = await sessionRepo.getSessionState(tenant.id, from);
            if (state.muted_until && Date.now() < state.muted_until) {
                return; // Silent mode activo (Controlado por humano)
            }

            // 8. HANDOFF A HUMANO GLOBAL (Tier 1 y 2/3)
            const isHandoffReq = msgObj.type === 'text' && user_message && KEYWORDS.HANDOFF_REQUEST.some(k => user_message.toLowerCase().includes(k));
            if (isHandoffReq && state.step !== 'awaiting_address' && state.step !== 'awaiting_quantity') {
                const mutedTimestamp = Date.now() + HANDOFF_SILENCE_DURATION_MS;
                await sessionRepo.setHumanStatus(tenant.id, from, mutedTimestamp);
                await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, COPY.HANDOFF_INITIATED, tenant.id);
                return;
            }

            // 9. ENRUTAMIENTO POR TIER
            if (tenant.bot_tier === 1) {
                await handleTier1Flow(tenant, phone_number_id, from, msgObj, user_message, state, customer_name);
            } else if (tenant.bot_tier >= 2) {
                if (user_message) {
                    await sendWhatsAppAI(phone_number_id, tenant.whatsapp_token, from, user_message, tenant.id);
                }
            }

        } catch (error) {
            console.error("Error crítico en processWebhook:", error);
        }
    });
};

// --- HELPER FUNCTIONS (Refactorizadas fuera del controlador gigante) ---

async function extractMessageContent(msgObj, tenant) {
    let user_message = '';
    if (msgObj.type === 'text') {
        user_message = msgObj.text?.body || '';
    } else if (msgObj.type === 'interactive') {
        if (msgObj.interactive.type === 'list_reply') user_message = msgObj.interactive.list_reply.title;
        else if (msgObj.interactive.type === 'button_reply') user_message = msgObj.interactive.button_reply.title;
    } else if (msgObj.type === 'image') {
        const ext = (msgObj.image.mime_type || 'image/jpeg').split('/')[1] || 'jpg';
        const buffer = await downloadWhatsAppMedia(msgObj.image.id, tenant.whatsapp_token);
        if (buffer) {
            const fakeFile = { originalname: `img_${Date.now()}.${ext}`, buffer, mimetype: msgObj.image.mime_type || 'image/jpeg' };
            const s3Url = await uploadImage(fakeFile, `tenant_${tenant.id}/chats`);
            user_message = (msgObj.image.caption ? msgObj.image.caption + '\n' : '') + `[Imagen adjunta: ${s3Url}]`;
        } else {
            user_message = COPY.IMAGE_ERROR;
        }
    } else if (msgObj.type === 'audio') {
        const buffer = await downloadWhatsAppMedia(msgObj.audio.id, tenant.whatsapp_token);
        if (buffer) {
            user_message = await transcribeAudio(buffer, tenant.id);
        } else {
            user_message = COPY.AUDIO_ERROR;
        }
    } else if (msgObj.type === 'sticker') {
        user_message = COPY.STICKER_REJECTED;
    } else if (msgObj.type === 'location') {
        user_message = `📍 Lat: ${msgObj.location.latitude}, Long: ${msgObj.location.longitude}`;
    } else {
        user_message = `[Multimedia adjunto: ${msgObj.type}]`;
    }
    return user_message;
}

// Lógica de carrito Tier 1 abstraída
async function handleTier1Flow(tenant, phone_number_id, from, msgObj, user_message, state, customer_name) {
    let text = user_message.toLowerCase();

    // Enviar menú principal Helper
    const sendMainMenu = async () => {
        let menus = Array.isArray(tenant.tier1_menu) ? tenant.tier1_menu : JSON.parse(tenant.tier1_menu || '[]');
        let rows = [{ id: 'btn_catalogo', title: '🛍️ Ver productos' }];
        menus.forEach((m, idx) => {
            if (m.title && m.title.trim().length > 0) rows.push({ id: `btn_faq_${idx}`, title: m.title.trim().substring(0, 24) });
        });
        
        let greetingText = tenant.tier1_greeting || `¡Hola! Bienvenido a ${tenant.name}. ¿Cómo podemos ayudarte hoy?`;
        if (customer_name) {
            greetingText = `¡Hola ${customer_name.split(' ')[0]}! 👋\nBienvenido a ${tenant.name}. ¿En qué podemos ayudarte?`;
        }

        let payload = {
            messaging_product: 'whatsapp', to: from, type: 'interactive',
            interactive: {
                type: 'list', header: { type: 'text', text: 'Menú Principal' },
                body: { text: greetingText },
                action: { button: 'Opciones', sections: [{ title: 'Opciones disponibles', rows: rows.slice(0, 10) }] }
            }
        };
        const metaRes = await fetch(`https://graph.facebook.com/v19.0/${phone_number_id}/messages`, {
            method: 'POST', headers: { 'Authorization': `Bearer ${tenant.whatsapp_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        if (!metaRes.ok) console.error("Error enviando Menú", await metaRes.text());
        await logMessage(tenant.id, from, 'outbound', 'interactive', 'Menú Principal enviado');
    };

    if (msgObj.type === 'sticker') { 
        await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, COPY.STICKER_REJECTED, tenant.id); 
        return; 
    }

    if (msgObj.type === 'text' || msgObj.type === 'image' || msgObj.type === 'audio' || msgObj.type === 'location') {
        
        const isEscape = KEYWORDS.ESCAPE_FLOW.some(k => text.includes(k));

        if (state.step === 'cart_decision' || state.step === 'adding_more' || state.step === 'awaiting_quantity' || state.step === 'awaiting_address' || state.step === 'awaiting_initial_name' || state.step === 'awaiting_transfer_info') {
            if (isEscape) {
                await sessionRepo.clearSessionState(tenant.id, from);
                if (customer_name) await sendMainMenu();
                else await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, `¡Hola! Bienvenido a ${tenant.name}. Para brindarte una mejor atención, ¿me podrías decir tu nombre?`, tenant.id);
                return;
            }
        }

        if (state.step === 'awaiting_transfer_info') {
            await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, "¡Recibido! Un asesor se pondrá en contacto contigo lo antes posible.", tenant.id);
            await sessionRepo.clearSessionState(tenant.id, from);
            const mutedTimestamp = Date.now() + HANDOFF_SILENCE_DURATION_MS;
            await sessionRepo.setHumanStatus(tenant.id, from, mutedTimestamp);
            return;
        }

        if (state.step === 'awaiting_initial_name') {
            if (user_message.trim().length < 3) {
                await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, 'Por favor, escribe un nombre válido (mínimo 3 letras) para continuar:', tenant.id);
                return;
            }
            customer_name = user_message.trim();
            await sessionRepo.setCustomerName(tenant.id, from, customer_name);
            await sessionRepo.clearSessionState(tenant.id, from);
            await sendMainMenu();
            return;
        }

        if (state.step === 'cart_decision') {
            await sendInteractiveButtons(phone_number_id, tenant.whatsapp_token, from, 'Por favor selecciona una opción para continuar tu compra o escribe *cancelar*:', [{id: 'btn_add_more', title: 'Seguir comprando'}, {id: 'btn_checkout', title: 'Finalizar pedido'}, {id: 'btn_clear_cart', title: 'Vaciar Carrito 🗑️'}], tenant.id);
            return;
        }

        if (state.step === 'adding_more') {
            await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, 'Por favor selecciona un producto del catálogo, o escribe *cancelar*.', tenant.id);
            return;
        }

        if (state.step === 'awaiting_quantity') {
            let qty = parseInt(text.trim());
            if (isNaN(qty) || qty <= 0) {
                await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, `Por favor, escribe un número válido para la cantidad (ejemplo: 2), o escribe *cancelar*.`, tenant.id);
                return;
            }
            let cart = state.cart || [];
            cart.push({ product: state.pending_product.title, price: state.pending_product.price, quantity: qty });
            state.cart = cart;
            state.step = 'cart_decision';
            delete state.pending_product;
            await sessionRepo.setSessionState(tenant.id, from, state);
            await sendInteractiveButtons(phone_number_id, tenant.whatsapp_token, from, `Se agregó ${qty}x ${cart[cart.length-1].product} a tu pedido. ¿Qué deseas hacer ahora?`, [{id: 'btn_add_more', title: 'Seguir comprando'}, {id: 'btn_checkout', title: 'Finalizar pedido'}, {id: 'btn_clear_cart', title: 'Vaciar Carrito 🗑️'}], tenant.id);
            return;
        }

        if (state.step === 'awaiting_address') {
            let cart = state.cart || [];
            if (cart.length === 0) {
                await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, 'Tu carrito está vacío. Por favor selecciona productos del catálogo.', tenant.id);
                await sessionRepo.clearSessionState(tenant.id, from);
                return;
            }
            let cName = customer_name || 'Sin nombre';
            let deliveryInfo = `Nombre: ${cName}\nDirección: ${user_message}`;
            await orderRepo.createOrder(tenant.id, from, cart, deliveryInfo);
            
            let total = 0;
            let cartSummary = cart.map(item => {
                total += (item.price * item.quantity);
                return `🛍️ ${item.quantity}x ${item.product}`;
            }).join('\n');
            let orderId = Math.floor(1000 + Math.random() * 9000);
            
            let finalMsg = `${COPY.ORDER_SUCCESS}\n*Orden #${orderId}*\n\n*Resumen de tu pedido:*\n${cartSummary}\n\n💰 *Total a pagar: Q${total.toFixed(2)}*\n\n👤 Nombre: ${cName}\n📍 Dirección: ${user_message}\n\nUn asesor humano se contactará contigo por aquí en breve para coordinar el pago y la entrega. ¡Gracias por tu compra!`;
            await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, finalMsg, tenant.id);
            
            await sessionRepo.clearSessionState(tenant.id, from);
            const mutedTimestamp = Date.now() + HANDOFF_SILENCE_DURATION_MS;
            await sessionRepo.setHumanStatus(tenant.id, from, mutedTimestamp);
            return;
        }

        // Gatillos por reglas de negocio Tier 1
        const rules = await tenantRepo.getBusinessRules(tenant.id);
        let matchedRule = rules.find(r => r.q && r.q.length >= 3 && text.includes(r.q.toLowerCase()));
        if (matchedRule) {
            await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, matchedRule.a, tenant.id);
            return;
        }

        // Default: Fallback o Menú
        await sessionRepo.clearSessionState(tenant.id, from);
        const isGreeting = KEYWORDS.GREETINGS.some(g => text.includes(g));
        
        if (!customer_name && !isGreeting) {
            state.step = 'awaiting_initial_name';
            await sessionRepo.setSessionState(tenant.id, from, state);
            await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, `¡Hola! Para brindarte una atención más personalizada, ¿me podrías decir tu nombre o apodo?`, tenant.id);
            return;
        }

        if (!isGreeting) {
            await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, COPY.FALLBACK_MISUNDERSTOOD, tenant.id);
        } else if (!customer_name) {
            state.step = 'awaiting_initial_name';
            await sessionRepo.setSessionState(tenant.id, from, state);
            await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, `¡Hola! Bienvenido a ${tenant.name}. Para brindarte una mejor atención, ¿me podrías decir tu nombre?`, tenant.id);
            return;
        }
        await sendMainMenu();
        return;
    }

    if (msgObj.type === 'interactive') {
        let btnId = '';
        if (msgObj.interactive.type === 'list_reply') btnId = msgObj.interactive.list_reply.id;
        else if (msgObj.interactive.type === 'button_reply') btnId = msgObj.interactive.button_reply.id;

        if (btnId === 'btn_main_menu' || btnId === 'btn_catalogo') {
            let preservedCart = state.cart;
            await sessionRepo.clearSessionState(tenant.id, from);
            let newState = await sessionRepo.getSessionState(tenant.id, from);
            if (preservedCart) { newState.state.cart = preservedCart; await sessionRepo.setSessionState(tenant.id, from, newState.state); }
            
            if (btnId === 'btn_catalogo') {
                await sendWhatsAppMenu(phone_number_id, tenant.whatsapp_token, from, tenant.id, tenant.name);
            } else {
                await sendMainMenu();
            }
            return;
        }

        if (btnId === 'btn_clear_cart') {
            state.cart = [];
            state.step = null;
            await sessionRepo.setSessionState(tenant.id, from, state);
            await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, 'Tu carrito ha sido vaciado.', tenant.id);
            await sendMainMenu();
            return;
        }

        if (btnId === 'btn_add_more') {
            state.step = 'adding_more'; await sessionRepo.setSessionState(tenant.id, from, state);
            await sendWhatsAppMenu(phone_number_id, tenant.whatsapp_token, from, tenant.id, tenant.name);
            return;
        }
        
        if (btnId === 'btn_checkout') {
            state.step = 'awaiting_address'; await sessionRepo.setSessionState(tenant.id, from, state);
            let promptName = customer_name ? customer_name.split(' ')[0] : 'amigo';
            await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, `¡Casi listos, ${promptName}! Para finalizar tu pedido, por favor escribe tu dirección completa de entrega:`, tenant.id);
            return;
        }

        if (btnId.startsWith('btn_faq_')) {
            let idx = parseInt(btnId.replace('btn_faq_', ''));
            let menus = Array.isArray(tenant.tier1_menu) ? tenant.tier1_menu : JSON.parse(tenant.tier1_menu || '[]');
            if (menus[idx]) {
                let responseText = menus[idx].content || menus[idx].response;
                if (menus[idx].action === 'catalog') {
                    // Send a brief message, then the catalog directly instead of falling into a trap
                    await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, responseText, tenant.id);
                    await sendWhatsAppMenu(phone_number_id, tenant.whatsapp_token, from, tenant.id, tenant.name);
                } else if (menus[idx].action === 'transfer') {
                    await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, responseText, tenant.id);
                    state.step = 'awaiting_transfer_info';
                    await sessionRepo.setSessionState(tenant.id, from, state);
                } else {
                    await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, responseText, tenant.id);
                    await sendInteractiveButtons(phone_number_id, tenant.whatsapp_token, from, '¿Necesitas algo más?', [{id: 'btn_main_menu', title: 'Volver al Menú'}], tenant.id);
                }
            }
            return;
        }

        if (btnId.startsWith('prod_')) {
            let prodId = parseInt(btnId.replace('prod_', ''));
            const products = await productRepo.findProductsByIds(tenant.id, [prodId]);
            const pRes = products[0];
            
            if (pRes) {
                let caption = `*${pRes.name}*\nPrecio: Q${pRes.price}`;
                if (pRes.image_url) {
                    await sendWhatsAppImage(phone_number_id, tenant.whatsapp_token, from, pRes.image_url, caption, tenant.id);
                } else {
                    await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, caption, tenant.id);
                }
                
                state.step = 'awaiting_quantity';
                state.pending_product = { id: prodId, title: pRes.name, price: pRes.price };
                await sessionRepo.setSessionState(tenant.id, from, state);
                await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, `¿Cuántas unidades de *${pRes.name}* deseas pedir? (Escribe solo el número)`, tenant.id);
            } else {
                await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, 'Lo siento, este producto ya no está disponible.', tenant.id);
            }
            return;
        }
    }
}

module.exports = { verifyWebhook, processWebhook };
