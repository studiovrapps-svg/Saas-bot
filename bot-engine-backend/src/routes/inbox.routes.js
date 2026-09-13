const express = require('express');
const router = express.Router();
const inboxController = require('../controllers/inbox.controller');

router.get('/:id/chats', inboxController.getChats);
router.get('/:id/chats/:phone', inboxController.getChatMessages);
router.post('/:id/chats/:phone/send', inboxController.sendReply);

module.exports = router;
