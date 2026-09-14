const express = require('express');
const { requireAuth } = require('../middlewares/auth.middleware');
const { createCheckout, handleWebhook } = require('../controllers/billing.controller');

const router = express.Router();

// Ruta para generar un link de pago (El inquilino lo solicita desde su panel)
router.post('/checkout', requireAuth, createCheckout);

// Ruta pública para recibir notificaciones de Recurrente (Webhooks)
router.post('/webhook', handleWebhook);

module.exports = router;
