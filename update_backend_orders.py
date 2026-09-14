import re

with open('bot-engine-backend/index.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Inject the INSERT INTO orders query in the checkout block
checkout_pattern = re.compile(r'(let cart = state\.cart \|\| \[\];\s*chatCache\.del\(cacheKey\);\s*let cartSummary = [^\n]+\s*let finalMsg = [^\n]+await sendWhatsAppText[^\n]+)\s*if \(sessionResult\.rows\.length > 0\)', re.DOTALL)

def checkout_replacement(match):
    before_session = match.group(1)
    insert_logic = """
                        // GUARDAR PEDIDO EN LA BASE DE DATOS
                        try {
                            const itemsJson = JSON.stringify(cart);
                            await pool.query(
                                "INSERT INTO orders (tenant_id, customer_phone, items, delivery_address) VALUES ($1, $2, $3, $4)",
                                [tenant.id, from, itemsJson, user_message]
                            );
                            console.log(`Pedido guardado para tenant ${tenant.id}, cliente ${from}`);
                        } catch(dbErr) {
                            console.error("Error guardando pedido:", dbErr);
                        }

                        if (sessionResult.rows.length > 0)"""
    return before_session + insert_logic.lstrip()

code = checkout_pattern.sub(checkout_replacement, code)

# 2. Add the GET and PUT endpoints before the module.exports or listen
endpoints = """
// ==========================================
// ENDPOINTS DE PEDIDOS (ORDERS)
// ==========================================

app.get('/api/tenant/:id/orders', async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM orders WHERE tenant_id = $1 ORDER BY created_at DESC", 
            [req.params.id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error interno al obtener pedidos" });
    }
});

app.put('/api/orders/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        await pool.query("UPDATE orders SET status = $1 WHERE id = $2", [status, req.params.id]);
        res.json({ message: "Estado actualizado exitosamente" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error interno al actualizar pedido" });
    }
});

"""

# Inject before `const PORT = process.env.PORT`
code = code.replace("const PORT = process.env.PORT", endpoints + "const PORT = process.env.PORT")

with open('bot-engine-backend/index.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done")
