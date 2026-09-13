const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhook.controller');
const { verifyMetaSignature } = require('../middlewares/webhook.middleware');

router.get('/', webhookController.verifyWebhook);
router.post('/', verifyMetaSignature, webhookController.processWebhook);

module.exports = router;
