require('dotenv').config();
const express = require('express');
const cors = require('cors');

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
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 SaaS Bot Engine REST Controller (MVC) corriendo en puerto ${PORT}`);
});
