const express = require('express');
const router = express.Router();
const inboxController = require('../controllers/inbox.controller');

router.get('/:id/chats', inboxController.getChats);
router.get('/:id/chats/:phone', inboxController.getChatMessages);
router.post('/:id/chats/:phone/send', inboxController.sendReply);

router.get('/:id/chats/:phone/session', inboxController.getChatSession);
router.post('/:id/chats/:phone/toggle', inboxController.toggleBotStatus);
router.post('/:id/chats/:phone/action', inboxController.sendQuickAction);
module.exports = router;
