const pool = require('../config/db');

// URLs base de Recurrente
const RECURRENTE_API_URL = 'https://app.recurrente.com/api';
const SECRET_KEY = process.env.RECURRENTE_SECRET_KEY;
const PUBLIC_KEY = process.env.RECURRENTE_PUBLIC_KEY;

/**
 * Genera un link de pago (Checkout) para un inquilino
 */
const createCheckout = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        
        // 1. Obtener datos del inquilino
        const tenantRes = await pool.query('SELECT name, email, monthly_price FROM tenants WHERE id = $1', [tenantId]);
        if (tenantRes.rows.length === 0) return res.status(404).json({ error: 'Inquilino no encontrado' });
        const tenant = tenantRes.rows[0];

        const priceInCents = Math.round(parseFloat(tenant.monthly_price || 50.00) * 100);

        // 2. Construir el payload para Recurrente (Ejemplo estructurado)
        const payload = {
            items: [
                {
                    name: 'Suscripción Bot Engine',
                    price_in_cents: priceInCents,
                    quantity: 1
                }
            ],
            customer: {
                email: tenant.email,
                full_name: tenant.name
            },
            cancel_url: `${process.env.FRONTEND_URL}/configuracion?payment=cancelled`,
            success_url: `${process.env.FRONTEND_URL}/configuracion?payment=success`,
            custom_metadata: {
                tenant_id: tenantId // Muy importante para identificar el pago en el webhook
            }
        };

        // 3. Llamar a la API de Recurrente
        const response = await fetch(`${RECURRENTE_API_URL}/checkouts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-PUBLIC-KEY': PUBLIC_KEY,
                'X-SECRET-KEY': SECRET_KEY
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok) {
            console.error('Error de Recurrente:', data);
            return res.status(400).json({ error: 'Error generando el pago', details: data });
        }

        // 4. Devolver la URL de pago al frontend
        res.json({ checkout_url: data.checkout_url });

    } catch (error) {
        console.error("Error en createCheckout:", error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

/**
 * Recibe eventos (Webhooks) desde Recurrente (Ej. pago exitoso)
 */
const handleWebhook = async (req, res) => {
    try {
        const { Webhook } = require('svix');
        const secret = process.env.RECURRENTE_WEBHOOK_SECRET;
        if (secret && req.rawBody) {
            const wh = new Webhook(secret);
            try {
                // Throws error if invalid signature
                wh.verify(req.rawBody, req.headers);
            } catch (err) {
                console.error("Error de verificación de Webhook de Recurrente:", err.message);
                return res.status(400).send("Invalid signature");
            }
        } else {
            console.warn("⚠️ RECURRENTE_WEBHOOK_SECRET no configurado, saltando validación de firma de Webhook");
        }

        const event = req.body;
        console.log('Webhook de Recurrente recibido:', event.type);

        if (event.type === 'checkout.completed' || event.type === 'payment.succeeded') {
            const tenantId = event.data?.custom_metadata?.tenant_id;
            const customerId = event.data?.customer_id;
            const subId = event.data?.subscription_id;

            if (tenantId) {
                await pool.query(
                    `UPDATE tenants 
                     SET is_active = true, 
                         recurrente_customer_id = $1, 
                         recurrente_subscription_id = $2, 
                         subscription_status = 'active',
                         current_period_end = NOW() + INTERVAL '30 days'
                     WHERE id = $3`,
                    [customerId, subId, tenantId]
                );
                console.log(`[Billing] Inquilino ${tenantId} activado exitosamente por pago.`);
            }
        } else if (event.type === 'subscription.canceled' || event.type === 'payment.failed') {
            // Cancelar cuenta
            const subId = event.data?.subscription_id || event.data?.id;
            if (subId) {
                await pool.query(
                    `UPDATE tenants SET is_active = false, subscription_status = 'canceled' WHERE recurrente_subscription_id = $1`,
                    [subId]
                );
                console.log(`[Billing] Inquilino desactivado por cancelación/fallo de pago. SubID: ${subId}`);
            }
        }

        res.sendStatus(200);
    } catch (error) {
        console.error("Error recibiendo Webhook de Recurrente:", error);
        if (!res.headersSent) res.status(500).send("Error");
    }
};

module.exports = { createCheckout, handleWebhook };
