import re

with open('index.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Add the /api/tenant/:id/meta-connect endpoint
meta_endpoint = """// ==========================================
// 🚀 ENDPOINT DE CONEXIÓN OFICIAL CON META
// ==========================================
app.post('/api/tenant/:id/meta-connect', async (req, res) => {
    try {
        const { id } = req.params;
        const { accessToken } = req.body;
        if (!accessToken) return res.status(400).json({ error: "No se proporcionó el token de acceso" });

        // En un entorno de producción real, aquí haríamos 3 pasos con el Graph API de Meta:
        // 1. Validar el accessToken con Facebook (debug_token).
        // 2. Hacer fetch a `https://graph.facebook.com/v19.0/me/businesses` para obtener el WABA ID.
        // 3. Hacer fetch a los phone numbers de ese WABA y guardar el ID seleccionado por el cliente.
        // 4. Intercambiar el token corto por un System User Token permanente.

        console.log(`[Meta Auth] Recibido token de conexión para el tenant ${id}`);
        console.log(`[Meta Auth] Token recibido (fragmento): ${accessToken.substring(0, 15)}...`);

        // Simularemos el guardado en base de datos para la demostración local
        // En la vida real aquí harías un UPDATE con el token y phone_id oficial que retorne Meta
        const mockPhoneId = "123456789_PHONE_MOCK";
        
        await pool.query(
            "UPDATE tenants SET whatsapp_token = $1, whatsapp_phone_id = $2 WHERE id = $3",
            [accessToken, mockPhoneId, id]
        );

        res.json({ success: true, message: "WhatsApp conectado con éxito en modo Coexistencia" });
    } catch(err) {
        console.error("Error en Meta Connect:", err);
        res.status(500).json({ error: err.message });
    }
});"""

code = code.replace("app.post('/api/upload',", meta_endpoint + "\n\napp.post('/api/upload',")

with open('index.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done")
