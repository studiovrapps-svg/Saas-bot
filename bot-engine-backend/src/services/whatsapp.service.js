const pool = require('../config/db');
const { logSystemEvent } = require('./logger.service');

async function logMessage(tenant_id, phone, direction, type, content, meta_message_id = null, delivery_status = 'sent', customer_name = null, sender_type = 'bot') {
    try {
        await pool.query(
            `INSERT INTO messages (tenant_id, customer_phone, direction, message_type, content, meta_message_id, delivery_status, customer_name, sender_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [tenant_id, phone, direction, type, content, meta_message_id, delivery_status, customer_name, sender_type]
        );
        
        // Optimización: Mantener actualizada la sesión de chat para lectura rápida en el Inbox
        await pool.query(
            `INSERT INTO chat_sessions (tenant_id, user_phone, customer_name, last_interaction) 
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP) 
             ON CONFLICT (tenant_id, user_phone) 
             DO UPDATE SET last_interaction = CURRENT_TIMESTAMP, customer_name = COALESCE(chat_sessions.customer_name, $3)`,
            [tenant_id, phone, customer_name]
        );
    } catch (e) {
        console.error(`Error logging message:`, e);
    }
}

async function sendWhatsAppMenu(phone_number_id, token, to, tenant_id, tenant_name) {
    try {
        const tenantResult = await pool.query('SELECT currency, business_vertical FROM tenants WHERE id = $1', [tenant_id]);
          const currency = tenantResult.rows[0]?.currency || 'Q';
          const vertical = tenantResult.rows[0]?.business_vertical || 'ecommerce';
          const prodResult = await pool.query('SELECT * FROM products WHERE tenant_id = $1 AND is_active = true LIMIT 10', [tenant_id]);
        const productos = prodResult.rows;
        let payload;
        if (productos.length === 0) {
            payload = { messaging_product: `whatsapp`, to: to, type: `text`, text: { body: `Hola! Bienvenido a *${tenant_name}*.\nEn este momento estamos actualizando nuestro catálogo. ¡Vuelve pronto!` } };
        } else {
            const rows = productos.map(p => ({ id: `prod_${p.id}`, title: p.name.substring(0, 24), description: `${currency}${p.price} - ${(p.description || '').substring(0, 50)}` }));
            payload = {
                messaging_product: `whatsapp`, to: to, type: `interactive`,
                interactive: {
                    type: `list`, header: { type: `text`, text: (`Menú de ${tenant_name}`).substring(0, 60) },
                    body: { text: `Selecciona el producto que deseas pedir o consultar:` },
                    footer: { text: `Dynova` },
                    action: { button: vertical === 'clinic' ? 'Ver Servicios 🩺' : 'Ver Catálogo 🛍️', sections: [{ title: vertical === 'clinic' ? 'Servicios Disponibles' : 'Productos Disponibles', rows: rows }] }
                }
            };
        }
        const response = await fetch(`https://graph.facebook.com/v19.0/${phone_number_id}/messages`, {
            method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (data.error) await logSystemEvent({ tenant_id, level: 'ERROR', event_type: 'META_API', message: 'Error enviando menú', details: data.error });
        const wamid = data?.messages?.[0]?.id || null;
        if (tenant_id) await logMessage(tenant_id, to, 'outbound', 'interactive', 'Envió el menú interactivo', wamid);
    } catch (error) { 
        console.error(`Error enviando menú WhatsApp:`, error);
        await logSystemEvent({ tenant_id, level: 'ERROR', event_type: 'SYSTEM', message: 'Excepción en sendWhatsAppMenu', details: { err: error.message } });
    }
}

async function sendWhatsAppText(phone_number_id, token, to, text, tenant_id = null, sender_type = 'bot') {
    try {
        text = text.replace(/\*\*/g, '*');
        const response = await fetch(`https://graph.facebook.com/v19.0/${phone_number_id}/messages`, {
            method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ messaging_product: `whatsapp`, to: to, type: `text`, text: { body: text } })
        });
        const data = await response.json();
        if (!response.ok || data.error) {
            await logSystemEvent({ tenant_id, level: 'ERROR', event_type: 'META_API', message: 'Error enviando texto', details: data.error || data });
            if (tenant_id) await logMessage(tenant_id, to, 'outbound', 'text', text, null, 'failed', null, sender_type);
            throw new Error(data.error?.message || "Error enviando texto");
        }
        const wamid = data?.messages?.[0]?.id || null;
        if (tenant_id) await logMessage(tenant_id, to, 'outbound', 'text', text, wamid, 'sent', null, sender_type);
        return data; 
    } catch (error) { 
        console.error(`Error enviando texto WhatsApp:`, error); 
        await logSystemEvent({ tenant_id, level: 'ERROR', event_type: 'SYSTEM', message: 'Excepción en sendWhatsAppText', details: { err: error.message } });
        throw error;
    }
}

// Interactive Buttons Helper
async function sendInteractiveButtons(phone_number_id, token, to, text, buttons, tenant_id = null) {
    try {
        const payload = {
            messaging_product: "whatsapp", to: to, type: "interactive",
                interactive: {
                type: "button", body: { text: text },
                action: { buttons: buttons.map(b => ({ type: "reply", reply: { id: b.id, title: b.title } })) }
            }
        };
        const response = await fetch(`https://graph.facebook.com/v19.0/${phone_number_id}/messages`, {
            method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (data.error) await logSystemEvent({ tenant_id, level: 'ERROR', event_type: 'META_API', message: 'Error enviando botones', details: data.error });
        const wamid = data?.messages?.[0]?.id || null;
        if (tenant_id) await logMessage(tenant_id, to, 'outbound', 'interactive', text, wamid, 'sent', null, 'bot');
    } catch (error) { 
        console.error(`Error enviando botones interactivos:`, error); 
        await logSystemEvent({ tenant_id, level: 'ERROR', event_type: 'SYSTEM', message: 'Excepción en sendInteractiveButtons', details: { err: error.message } });
    }
}


async function sendWhatsAppTemplate(phone_number_id, token, to, template_name, language_code = 'es', tenant_id = null) {
    try {
        const payload = {
            messaging_product: "whatsapp",
            to: to,
            type: "template",
            template: {
                name: template_name,
                language: { code: language_code }
            }
        };
        const response = await fetch(`https://graph.facebook.com/v19.0/${phone_number_id}/messages`, {
            method: 'POST', 
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, 
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (data.error) await logSystemEvent({ tenant_id, level: 'ERROR', event_type: 'META_API', message: 'Error enviando plantilla', details: data.error });
        const wamid = data?.messages?.[0]?.id || null;
        if (tenant_id) await logMessage(tenant_id, to, 'outbound', 'template', `[Campa�a: ${template_name}]`, wamid);
        return data; // Parche para pg-boss
    } catch (error) { 
        console.error(`Error enviando plantilla WhatsApp:`, error); 
        await logSystemEvent({ tenant_id, level: 'ERROR', event_type: 'SYSTEM', message: 'Excepci�n en sendWhatsAppTemplate', details: { err: error.message } });
        throw error; // Parche para pg-boss (Reintentos)
    }
}

async function downloadWhatsAppMedia(media_id, token) {
    try {
        const res = await fetch(`https://graph.facebook.com/v19.0/${media_id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok || data.error) {
            await logSystemEvent({ tenant_id: null, level: 'ERROR', event_type: 'META_API', message: 'Error obteniendo media URL', details: data.error || data });
            throw new Error("Meta API Error: " + (data.error?.message || "Unknown error"));
        }
        if (!data.url) throw new Error("No media url from Meta");

        const mediaRes = await fetch(data.url, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' // Meta blocks requests without User-Agent
            }
        });
        if (!mediaRes.ok) throw new Error("Meta Media Download Error: " + mediaRes.status);
        
        const arrayBuffer = await mediaRes.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (e) {
        console.error("Error descargando media de WhatsApp:", e);
        await logSystemEvent({ tenant_id: null, level: 'ERROR', event_type: 'SYSTEM', message: 'Excepción en downloadWhatsAppMedia', details: { err: e.message } });
        throw e;
    }
}

async function sendWhatsAppImage(phone_number_id, token, to, imageUrl, caption = '', tenant_id = null) {
    try {
        caption = caption.replace(/\*\*/g, '*');
        const payload = {
            messaging_product: "whatsapp",
            to: to,
            type: "image",
            image: { link: imageUrl, caption: caption }
        };
        const response = await fetch(`https://graph.facebook.com/v19.0/${phone_number_id}/messages`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok || data.error) {
            await logSystemEvent({ tenant_id, level: 'ERROR', event_type: 'META_API', message: 'Error enviando imagen', details: data.error || data });
            if (tenant_id) await logMessage(tenant_id, to, 'outbound', 'image', caption ? `[Imagen: ${imageUrl}]\n${caption}` : `[Imagen: ${imageUrl}]`, null, 'failed', null, 'bot');
            throw new Error(data.error?.message || "Error enviando imagen");
        }
        const wamid = data?.messages?.[0]?.id || null;
        if (tenant_id) await logMessage(tenant_id, to, 'outbound', 'image', caption ? `[Imagen: ${imageUrl}]\n${caption}` : `[Imagen: ${imageUrl}]`, wamid);
        return data;
    } catch (e) {
        console.error("Error enviando imagen WhatsApp:", e);
        await logSystemEvent({ tenant_id, level: 'ERROR', event_type: 'SYSTEM', message: 'Excepción en sendWhatsAppImage', details: { err: e.message } });
        throw e;
    }
}

async function sendTypingIndicator(phone_number_id, token, message_id, to_phone, tenant_id = null) {
    try {
        // Enviar "leído" y "escribiendo" al mismo tiempo (como lo exige la API Cloud v20+)
        const payload = {
            messaging_product: "whatsapp",
            status: "read",
            message_id: message_id,
            to: to_phone,
            typing_indicator: { type: "text" }
        };
        
        await fetch(`https://graph.facebook.com/v19.0/${phone_number_id}/messages`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch (error) {
        console.error(`Error enviando typing indicator:`, error);
    }
}
}

module.exports = { sendWhatsAppTemplate, logMessage, sendWhatsAppMenu, sendWhatsAppText, sendInteractiveButtons, downloadWhatsAppMedia, sendWhatsAppImage, sendTypingIndicator };
