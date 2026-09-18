const express = require('express');
const router = express.Router();
const telegramController = require('../controllers/telegram.controller');

router.post('/webhook', telegramController.processTelegramWebhook);

module.exports = router;
