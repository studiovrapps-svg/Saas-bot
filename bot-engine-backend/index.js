require('dotenv').config(); // MUST BE FIRST

const { startQueue, boss } = require('./src/config/queue');
const express = require('express');
const http = require('http');
const socketConfig = require('./src/config/socket');
const cors = require('cors');
const pool = require('./src/config/db');

// Fail-Fast: Validar variables de entorno críticas
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET', 'META_APP_SECRET', 'WHATSAPP_VERIFY_TOKEN'];
const missingVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingVars.length > 0) {
    console.warn(`?? ADVERTENCIA: Faltan variables de entorno críticas: ${missingVars.join(', ')}. El sistema podría fallar.`);
}

const authRoutes = require('./src/routes/auth.routes');
const tenantRoutes = require('./src/routes/tenant.routes');
const productRoutes = require('./src/routes/product.routes');
const inboxRoutes = require('./src/routes/inbox.routes');
const orderRoutes = require('./src/routes/order.routes');
const webhookRoutes = require('./src/routes/webhook.routes');
const campaignRoutes = require('./src/routes/campaign.routes');
const billingRoutes = require('./src/routes/billing.routes');

const { requireAuth, restrictToSelf } = require('./src/middlewares/auth.middleware');

const app = express();
app.set('trust proxy', 1); // Necesario para que express-rate-limit funcione detrás de proxies (Netlify/Railway)

const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:3000'
];

app.use(cors({
    origin: function(origin, callback) {
        if (!origin || allowedOrigins.some(o => origin.startsWith(o))) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));

// API REST Rutas - Públicas
app.use('/api', authRoutes); // /api/login

// API REST Rutas - Protegidas
app.use('/api', requireAuth, restrictToSelf, tenantRoutes); 
app.use('/api/productos', requireAuth, restrictToSelf, productRoutes);
app.use('/api/tenant', requireAuth, restrictToSelf, inboxRoutes);
app.use('/api/orders', requireAuth, restrictToSelf, orderRoutes);
app.use('/api/tenant', requireAuth, restrictToSelf, campaignRoutes);

// Rutas de Facturación
app.use('/api/billing', billingRoutes);

// Webhooks Meta
app.use('/webhook', webhookRoutes);
app.use('/api/telegram', require('./src/routes/telegram.routes'));

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('?? Error global capturado:', err);
    res.status(err.status || 500).json({ error: 'Error interno del servidor.' });
});

const PORT = process.env.PORT || 3000;
// Arranque secuencial: garantizar cola antes de aceptar tráfico
(async () => {
    try {
        await startQueue();
    } catch(e) {
        console.error("Error crítico iniciando sistema de colas:", e);
        process.exit(1); // Fail-Fast: Matar el proceso si la cola no levanta
    }
    
    const server = http.createServer(app);
    socketConfig.init(server); // Inicializar WebSockets

    server.listen(PORT, () => {
        if (process.env.BACKEND_URL) {
            require('./src/services/telegram.service').setWebhook(process.env.BACKEND_URL + '/api/telegram/webhook');
        }
        console.log(`?? SaaS Bot Engine REST Controller (MVC) + WebSockets corriendo en puerto ${PORT}`);
    });
})();

// Control asíncrono y fallos críticos
process.on('unhandledRejection', (reason, promise) => {
    console.error('?? Rechazo de promesa no controlado:', reason);
});
process.on('uncaughtException', (err) => {
    console.error('?? Excepción no capturada (Mortal):', err);
    shutdown();
});

// Graceful Shutdown
const shutdown = async () => {
    console.log("Cerrando servicios de forma segura...");
    if (boss) await boss.stop({ graceful: true, timeout: 10000 });
    if (pool) await pool.end();
    process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
