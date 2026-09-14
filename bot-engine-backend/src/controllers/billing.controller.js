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
        const tenantRes = await pool.query('SELECT name, email FROM tenants WHERE id = $1', [tenantId]);
        if (tenantRes.rows.length === 0) return res.status(404).json({ error: 'Inquilino no encontrado' });
        const tenant = tenantRes.rows[0];

        // 2. Construir el payload para Recurrente (Ejemplo estructurado)
        const payload = {
            items: [
                {
                    name: 'Suscripción Bot Engine - Nivel 1',
                    price_in_cents: 5000, // 50 USD o su equivalente local
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
        // Enviar 200 OK de inmediato para que Recurrente no reintente
        res.sendStatus(200);

        setImmediate(async () => {
            try {
                const event = req.body;
                console.log('Webhook de Recurrente recibido:', event.type);

                // Validar que sea un evento de pago exitoso (ejemplo de nombre de evento)
                if (event.type === 'checkout.completed' || event.type === 'payment.succeeded') {
                    // Extraer la metadata que enviamos al crear el checkout
                    const tenantId = event.data?.custom_metadata?.tenant_id;
                    const customerId = event.data?.customer_id;
                    const subId = event.data?.subscription_id;

                    if (tenantId) {
                        // Actualizar el estado del inquilino en la BD
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
                }
                
                // TODO: Manejar eventos de 'subscription.canceled' o 'payment.failed'
                // para hacer `is_active = false`
                
            } catch (err) {
                console.error("Error procesando Webhook de Recurrente en 2do plano:", err);
            }
        });
    } catch (error) {
        console.error("Error recibiendo Webhook de Recurrente:", error);
    }
};

module.exports = { createCheckout, handleWebhook };
