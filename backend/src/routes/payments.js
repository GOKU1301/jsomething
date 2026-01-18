const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/auth');

// Create payment (requires authentication)
router.post('/create', authenticateToken, paymentController.createPayment);

// Webhook endpoint (no authentication - verified by signature)
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook);

// Get payment status (requires authentication)
router.get('/:orderId', authenticateToken, paymentController.getPaymentStatus);

module.exports = router;
