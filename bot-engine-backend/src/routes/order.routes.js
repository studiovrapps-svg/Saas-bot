const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');

router.put('/:id/status', orderController.updateOrderStatus); // Wait, original was /api/orders/:id/status

module.exports = router;
