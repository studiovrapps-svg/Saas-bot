const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenant.controller');
const { requireSuperAdmin } = require('../middlewares/auth.middleware');

// Superadmin
router.get('/admin/stats', requireSuperAdmin, tenantController.getGlobalStats);
router.get('/admin/pricing', requireSuperAdmin, tenantController.getGlobalPricing);
router.put('/admin/pricing', requireSuperAdmin, tenantController.updateGlobalPricing);
router.get('/admin/logs', requireSuperAdmin, tenantController.getSystemLogs);
router.get('/clientes', requireSuperAdmin, tenantController.getClientes);
router.post('/clientes', requireSuperAdmin, tenantController.createCliente);
router.put('/clientes/:id', requireSuperAdmin, tenantController.updateCliente);
router.delete('/clientes/:id', requireSuperAdmin, tenantController.deleteCliente);

router.get('/templates', requireSuperAdmin, tenantController.getTemplates);
router.post('/templates', requireSuperAdmin, tenantController.createTemplate);
router.put('/templates/:id', requireSuperAdmin, tenantController.updateTemplate);
router.delete('/templates/:id', requireSuperAdmin, tenantController.deleteTemplate);

const multer = require('multer');
const upload = multer({ 
    storage: multer.memoryStorage(), 
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Solo imágenes'), false);
    }
});

// Tenant
router.get('/tenant/:id', tenantController.getTenantConfig);
router.get('/tenant/:id/stats', tenantController.getStats);
router.put('/tenant/:id/config', tenantController.updateTenantConfig);
router.post('/tenant/:id/upload', upload.single('image'), tenantController.uploadMenuImage);
router.post('/tenant/:id/meta-connect', tenantController.metaConnect);
router.post('/tenant/:id/sync-profile', tenantController.syncProfile);

const orderController = require('../controllers/order.controller');
router.get('/tenant/:id/orders', orderController.getOrders);

module.exports = router;
