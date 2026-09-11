const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');
const multer = require('multer');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Groq = require('groq-sdk');
const NodeCache = require('node-cache');

const app = express();
app.use(cors());
app.use(express.json());

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const bucketName = process.env.AWS_S3_BUCKET;
const upload = multer({ storage: multer.memoryStorage() });
const JWT_SECRET = process.env.JWT_SECRET || 'super-secreto-saas-2026';

// 🧠 Configuración Inteligencia Artificial
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const chatCache = new NodeCache({ stdTTL: 900 }); // Borra memoria de chats a los 15 minutos

// --- FUNCIONES DEL BOT (WHATSAPP API) ---
async function sendWhatsAppMenu(phone_number_id, token, to, tenant_id, tenant_name) {
    try {
        const prodResult = await pool.query('SELECT * FROM products WHERE tenant_id = $1 AND is_active = true LIMIT 10', [tenant_id]);
        const productos = prodResult.rows;
        let payload;
        if (productos.length === 0) {
            payload = { messaging_product: "whatsapp", to: to, type: "text", text: { body: `Hola! Bienvenido a *${tenant_name}*.\nEn este momento estamos actualizando nuestro catálogo. ¡Vuelve pronto!` } };
        } else {
            const rows = productos.map(p => ({ id: `prod_${p.id}`, title: p.name.substring(0, 24), description: `Q${p.price} - ${p.description.substring(0, 50)}` }));
            payload = {
                messaging_product: "whatsapp", to: to, type: "interactive",
                interactive: {
                    type: "list", header: { type: "text", text: `Menú de ${tenant_name}` },
                    body: { text: "Selecciona el producto que deseas pedir o consultar:" },
                    footer: { text: "SaaS Bot Engine" },
                    action: { button: "Ver Catálogo 🛍️", sections: [{ title: "Productos Disponibles", rows: rows }] }
                }
            };
        }
        await fetch(`https://graph.facebook.com/v19.0/${phone_number_id}/messages`, {
            method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
    } catch (error) { console.error("Error enviando menú WhatsApp:", error); }
}

async function sendWhatsAppText(phone_number_id, token, to, text) {
    try {
        await fetch(`https://graph.facebook.com/v19.0/${phone_number_id}/messages`, {
            method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ messaging_product: "whatsapp", to: to, type: "text", text: { body: text } })
        });
    } catch (error) { console.error("Error enviando texto WhatsApp:", error); }
}

async function sendWhatsAppAI(phone_number_id, token, to, tenant_id, tenant_name, system_prompt, user_message) {
    try {
        const prodResult = await pool.query('SELECT * FROM products WHERE tenant_id = $1 AND is_active = true', [tenant_id]);
        const tenantResult = await pool.query('SELECT business_rules FROM tenants WHERE id = $1', [tenant_id]);
        const business_rules = tenantResult.rows[0]?.business_rules || "";
        
        let catalogoTexto = "CATÁLOGO DE PRODUCTOS:\n";
        if (prodResult.rows.length === 0) catalogoTexto += "No hay productos.\n";
        prodResult.rows.forEach(p => catalogoTexto += `- ${p.name}: Q${p.price} (${p.description}) (ID_FOTO=${p.id})\n`);

        let faqTexto = "";
        try {
            if (business_rules) {
                const faqs = JSON.parse(business_rules);
                if (Array.isArray(faqs)) {
                    faqs.forEach(f => faqTexto += `PREGUNTA/TEMA: ${f.q}\nRESPUESTA/ACCIÓN: ${f.a}\n\n`);
                } else faqTexto = business_rules;
            }
        } catch(e) {
            faqTexto = business_rules || "No hay información adicional.";
        }

        const basePrompt = `Eres el asistente virtual oficial de ${tenant_name}.
Tu objetivo es atender a los clientes, mostrarles el catálogo y ayudarles a realizar pedidos.

REGLAS DE COMPORTAMIENTO:
1. Sé muy breve, amable y servicial. EXCEPCIÓN: Si vas a mostrar el catálogo completo, usa una lista con viñetas y saltos de línea, NO lo amontones en un solo párrafo.
2. Usa SOLO el siguiente catálogo para ofrecer productos y precios. ¡No inventes nada!
3. Si el usuario te saluda o pide el menú, muéstrale las opciones disponibles ordenadas hacia abajo. ¡NUNCA incluyas la palabra ID_FOTO en la lista!
4. ÚNICAMENTE si el usuario te habla de política, religión o temas completamente ajenos al negocio, debes responder: "Solo puedo ayudarte con temas de ${tenant_name}".
5. MAGIA VISUAL: Si el cliente pide la "foto" o "ver" un producto en específico, responde su duda e incluye el código secreto [IMG_X], reemplazando la X por el número de su ID_FOTO.

${catalogoTexto}

BASE DE CONOCIMIENTO (PREGUNTAS FRECUENTES Y REGLAS):
Utiliza la siguiente información para responder dudas del cliente sobre envíos, pagos, o cualquier tema específico. NUNCA inventes información que no esté aquí, si no lo sabes, dile que un humano le informará:
${faqTexto}

Instrucciones extra del dueño:
${system_prompt || "Sé amable y guía al usuario a realizar una compra."}`;

        const cacheKey = `chat_${tenant_id}_${to}`;
        let history = chatCache.get(cacheKey) || [];
        
        if (history.length === 0) history.push({ role: "system", content: basePrompt });
        history.push({ role: "user", content: user_message });
        if (history.length > 11) history = [history[0], ...history.slice(history.length - 10)]; // Límite para ahorrar tokens

        const completion = await groq.chat.completions.create({
            messages: history,
            model: "openai/gpt-oss-20b", // Modelo disponible en la API actual
            temperature: 0.1,
            max_tokens: 500,
        });

        let aiResponse = completion.choices[0]?.message?.content || "Tuve un problema. Intenta de nuevo.";
        console.log("=== AI ORIGINAL RESPONSE ===", aiResponse);
        
        // Enviar todas las imágenes que la IA haya mencionado
        const regex = /\[IMG_(\d+)\]/g;
        let match;
        while ((match = regex.exec(aiResponse)) !== null) {
            const prodId = match[1];
            const p = prodResult.rows.find(row => row.id == prodId);
            if (p && p.image_url) {
                await fetch(`https://graph.facebook.com/v19.0/${phone_number_id}/messages`, {
                    method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messaging_product: "whatsapp", to: to, type: "image", image: { link: p.image_url } })
                });
            }
        }
        
        // Limpiar todas las etiquetas sucias para el usuario
        aiResponse = aiResponse.replace(/\[IMG_(\d+)\]/g, "").trim();
        aiResponse = aiResponse.replace(/\(ID_FOTO=\d+\)/g, "").trim();
        aiResponse = aiResponse.replace(/ID_FOTO/g, "").trim();
        aiResponse = aiResponse.replace(/ID_IMAGEN:?/g, "").trim();

        history.push({ role: "assistant", content: aiResponse });
        chatCache.set(cacheKey, history);

        if (aiResponse.length > 0) {
            const txtRes = await fetch(`https://graph.facebook.com/v19.0/${phone_number_id}/messages`, {
                method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ messaging_product: "whatsapp", to: to, type: "text", text: { body: aiResponse } })
            });
            console.log("=== TEXT SEND STATUS ===", txtRes.status);
        }
    } catch (error) { console.error("Error AI:", error); }
}

// --- RUTAS DE LA API (PANEL WEB REACT) ---

// LOGIN (Súper Admin y Clientes)
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (email === 'admin@admin.com' && password === 'admin123') {
            const token = jwt.sign({ role: 'admin' }, JWT_SECRET);
            return res.json({ token, role: 'admin' });
        }
        const result = await pool.query('SELECT * FROM tenants WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(401).json({ error: "Credenciales inválidas" });
        
        const tenant = result.rows[0];
        if (!tenant.is_active) return res.status(403).json({ error: "Tu cuenta ha sido suspendida. Contacta a soporte." });

        // Si no hay password_hash (clientes creados antes de este parche), permitir pasar solo si pusieron "123456" para propósitos de migración
        if (!tenant.password_hash && password === '123456') {
             // Pass
        } else {
             const match = await bcrypt.compare(password, tenant.password_hash);
             if (!match) return res.status(401).json({ error: "Credenciales inválidas" });
        }

        const token = jwt.sign({ role: 'client', tenant_id: tenant.id }, JWT_SECRET);
        res.json({ token, role: 'client', tenant_id: tenant.id, name: tenant.name });
    } catch (error) { res.status(500).json({ error: "Error interno" }); }
});

app.get('/api/clientes', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, email, bot_tier, is_active, whatsapp_phone_id, whatsapp_token, created_at FROM tenants ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) { res.status(500).json({ error: "Error interno" }); }
});

app.post('/api/clientes', async (req, res) => {
    try {
        const { name, email, bot_tier, password, template_id } = req.body;
        if (!name || !email || !password) return res.status(400).json({ error: "Faltan datos" });
        const hash = await bcrypt.hash(password, 10);
        
        let systemPrompt = null;
        let businessRules = '[]';
        let finalTier = bot_tier || 1;

        if (template_id) {
            const tpl = await pool.query('SELECT * FROM templates WHERE id = $1', [template_id]);
            if (tpl.rows.length > 0) {
                systemPrompt = tpl.rows[0].system_prompt;
                businessRules = JSON.stringify(tpl.rows[0].business_rules);
                finalTier = tpl.rows[0].bot_tier;
            }
        }

        const result = await pool.query(
            'INSERT INTO tenants (name, email, bot_tier, password_hash, is_active, system_prompt, business_rules) VALUES ($1, $2, $3, $4, true, $5, $6) RETURNING id, name, email, bot_tier',
            [name, email, finalTier, hash, systemPrompt, businessRules]
        );
        res.status(201).json({ message: "Cliente creado", cliente: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') return res.status(400).json({ error: "Correo duplicado." });
        res.status(500).json({ error: "Error interno" });
    }
});

// Rutas de Plantillas
app.get('/api/templates', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM templates ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) { res.status(500).json({ error: "Error interno" }); }
});

app.post('/api/templates', async (req, res) => {
    try {
        const { name, bot_tier, system_prompt, business_rules } = req.body;
        const result = await pool.query(
            'INSERT INTO templates (name, bot_tier, system_prompt, business_rules) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, bot_tier, system_prompt, JSON.stringify(business_rules || [])]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) { res.status(500).json({ error: "Error interno" }); }
});

app.put('/api/templates/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, bot_tier, system_prompt, business_rules } = req.body;
        await pool.query(
            'UPDATE templates SET name = $1, bot_tier = $2, system_prompt = $3, business_rules = $4 WHERE id = $5',
            [name, bot_tier, system_prompt, JSON.stringify(business_rules || []), id]
        );
        res.json({ message: "Plantilla actualizada" });
    } catch (error) { res.status(500).json({ error: "Error interno" }); }
});

app.delete('/api/templates/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM templates WHERE id = $1', [req.params.id]);
        res.json({ message: "Plantilla eliminada" });
    } catch (error) { res.status(500).json({ error: "Error interno" }); }
});

// Editar Cliente (Tokens y Kill-switch)
app.put('/api/clientes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { whatsapp_token, whatsapp_phone_id, is_active, name, bot_tier } = req.body;
        await pool.query(
            'UPDATE tenants SET whatsapp_token = $1, whatsapp_phone_id = $2, is_active = $3, name = $4, bot_tier = $5 WHERE id = $6',
            [whatsapp_token, whatsapp_phone_id, is_active, name, bot_tier, id]
        );
        res.json({ message: "Cliente actualizado" });
    } catch (error) { res.status(500).json({ error: "Error interno" }); }
});

app.get('/api/tenant/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT bot_tier, system_prompt, tier1_greeting, tier1_menu, business_rules FROM tenants WHERE id = $1', [req.params.id]);
        res.json(result.rows[0]);
    } catch (error) { res.status(500).json({ error: "Error interno" }); }
});

app.put('/api/tenant/:id/config', async (req, res) => {
    try {
        const { system_prompt, tier1_greeting, tier1_menu, business_rules } = req.body;
        await pool.query(
            'UPDATE tenants SET system_prompt = $1, tier1_greeting = $2, tier1_menu = $3, business_rules = $4 WHERE id = $5',
            [system_prompt, tier1_greeting, JSON.stringify(tier1_menu || []), business_rules, req.params.id]
        );
        res.json({ message: "Configuración guardada" });
    } catch (error) { console.error(error); res.status(500).json({ error: "Error interno" }); }
});

app.post('/api/productos', upload.single('image'), async (req, res) => {
    try {
        const { tenant_id, name, description, price } = req.body;
        const file = req.file;
        if (!tenant_id || !name || !file) return res.status(400).json({ error: "Faltan datos" });

        const fileExtension = file.originalname.split('.').pop();
        const randomName = crypto.randomBytes(16).toString('hex');
        const s3Key = `catalogo/${tenant_id}/${randomName}.${fileExtension}`;

        await s3Client.send(new PutObjectCommand({ Bucket: bucketName, Key: s3Key, Body: file.buffer, ContentType: file.mimetype }));
        const imageUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
        
        const result = await pool.query(
            'INSERT INTO products (tenant_id, name, description, price, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [tenant_id, name, description, price, imageUrl]
        );
        res.status(201).json({ message: "Producto guardado", producto: result.rows[0] });
    } catch (error) { res.status(500).json({ error: "Error interno" }); }
});

app.put('/api/productos/:id', upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price } = req.body;
        const file = req.file;

        if (!name) return res.status(400).json({ error: "Falta el nombre" });

        if (file) {
            const fileExtension = file.originalname.split('.').pop();
            const randomName = crypto.randomBytes(16).toString('hex');
            const s3Key = `catalogo/edits/${randomName}.${fileExtension}`;
            await s3Client.send(new PutObjectCommand({ Bucket: bucketName, Key: s3Key, Body: file.buffer, ContentType: file.mimetype }));
            const imageUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
            
            await pool.query(
                'UPDATE products SET name = $1, description = $2, price = $3, image_url = $4 WHERE id = $5',
                [name, description, price, imageUrl, id]
            );
        } else {
            await pool.query(
                'UPDATE products SET name = $1, description = $2, price = $3 WHERE id = $4',
                [name, description, price, id]
            );
        }
        res.json({ message: "Producto actualizado" });
    } catch (error) { console.error(error); res.status(500).json({ error: "Error interno" }); }
});

app.get('/api/productos/:tenant_id', async (req, res) => {
    try {
        const { tenant_id } = req.params;
        const result = await pool.query('SELECT * FROM products WHERE tenant_id = $1 ORDER BY created_at DESC', [tenant_id]);
        res.json(result.rows);
    } catch (error) { res.status(500).json({ error: "Error interno" }); }
});

// Eliminar Producto
app.delete('/api/productos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pResult = await pool.query('SELECT image_url FROM products WHERE id = $1', [id]);
        if (pResult.rows.length > 0) {
            const s3Key = pResult.rows[0].image_url.split('.amazonaws.com/')[1];
            if (s3Key) await s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: s3Key })).catch(()=>{});
        }
        await pool.query('DELETE FROM products WHERE id = $1', [id]);
        res.json({ message: "Producto eliminado" });
    } catch (error) { res.status(500).json({ error: "Error interno" }); }
});

// --- RUTAS DEL WEBHOOK ---
app.get('/webhook', (req, res) => { console.log('GET WEBHOOK RECIBIDO!');
    if (req.query["hub.mode"] === "subscribe" && req.query["hub.verify_token"] === process.env.WHATSAPP_VERIFY_TOKEN) {
        res.status(200).send(req.query["hub.challenge"]);
    } else res.sendStatus(403);
});

app.post('/webhook', async (req, res) => {
    try {
        let body = req.body;
        if (body.object && body.entry && body.entry[0].changes[0].value.messages) {
            let phone_number_id = body.entry[0].changes[0].value.metadata.phone_number_id;
            let from = body.entry[0].changes[0].value.messages[0].from;
            
            const tenantResult = await pool.query('SELECT * FROM tenants WHERE whatsapp_phone_id = $1', [phone_number_id]);
            if (tenantResult.rows.length === 0) return res.sendStatus(200);
            
            const tenant = tenantResult.rows[0];
            if (!tenant.is_active) {
                console.log(`🛑 Cliente ${tenant.name} está SUSPENDIDO. Ignorando mensajes.`);
                return res.sendStatus(200);
            }
            if (!tenant.whatsapp_token) return res.sendStatus(200);

            const sessionResult = await pool.query('SELECT status FROM chat_sessions WHERE tenant_id = $1 AND user_phone = $2', [tenant.id, from]);
            if (sessionResult.rows.length > 0 && sessionResult.rows[0].status === 'humano') return res.sendStatus(200);

            // Extraer el texto real que escribió el usuario (o el botón que presionó)
            let user_message = "";
            let msgObj = body.entry[0].changes[0].value.messages[0];
            if (msgObj.type === "text") user_message = msgObj.text.body;
            else if (msgObj.type === "interactive") {
                if (msgObj.interactive.type === "list_reply") user_message = msgObj.interactive.list_reply.title;
                else if (msgObj.interactive.type === "button_reply") user_message = msgObj.interactive.button_reply.title;
            }

            if (tenant.bot_tier === 1) {
                // Nivel 1: Menú Principal Personalizado
                if (msgObj.type === "interactive" && msgObj.interactive.type === "list_reply") {
                    let btnId = msgObj.interactive.list_reply.id;
                    
                    if (btnId === "btn_catalogo") {
                        await sendWhatsAppMenu(phone_number_id, tenant.whatsapp_token, from, tenant.id, tenant.name);
                    } else if (btnId.startsWith("btn_faq_")) {
                        // Buscar el texto correspondiente en tier1_menu
                        let menus = tenant.tier1_menu || [];
                        let idx = parseInt(btnId.replace("btn_faq_", ""));
                        if (menus[idx]) {
                            await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, menus[idx].response);
                        }
                    } else {
                        // Para los catalogos antiguos (si tocan una hamburguesa directo del catálogo)
                        let productoElegido = msgObj.interactive.list_reply.title;
                        await sendWhatsAppText(phone_number_id, tenant.whatsapp_token, from, `¡Excelente elección! Has seleccionado: *${productoElegido}*.\n\nEn un momento un asesor humano tomará tu pedido para coordinar el pago y la entrega. ¡Gracias por preferir ${tenant.name}!`);
                    }
                } else {
                    // Si saluda, mandamos el Menú Principal (Botones configurables)
                    let menus = tenant.tier1_menu || [];
                    let rows = [{ id: "btn_catalogo", title: "🛍️ Ver productos" }];
                    menus.forEach((m, idx) => {
                        rows.push({ id: `btn_faq_${idx}`, title: m.title.substring(0, 24) });
                    });
                    
                    let payload = {
                        messaging_product: "whatsapp",
                        to: from,
                        type: "interactive",
                        interactive: {
                            type: "list",
                            header: { type: "text", text: "Menú Principal" },
                            body: { text: tenant.tier1_greeting || `¡Hola! Bienvenido a ${tenant.name}. ¿Cómo podemos ayudarte hoy?` },
                            action: {
                                button: "Ver opciones 👇",
                                sections: [{ title: "Opciones disponibles", rows: rows.slice(0,10) }] // Límite de Meta es 10
                            }
                        }
                    };
                    await fetch(`https://graph.facebook.com/v19.0/${phone_number_id}/messages`, {
                        method: 'POST', headers: { 'Authorization': `Bearer ${tenant.whatsapp_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
                    });
                }
            } else if (tenant.bot_tier >= 2) {
                await sendWhatsAppAI(phone_number_id, tenant.whatsapp_token, from, tenant.id, tenant.name, tenant.system_prompt, user_message);
            }
        }
        res.sendStatus(200); 
    } catch (error) { res.sendStatus(500); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Motor central SaaS iniciado en el puerto ${PORT}`));
