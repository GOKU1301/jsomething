const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Create order (students only)
router.post('/', orderController.createOrder);

// Get orders (filtered by role)
router.get('/', orderController.getOrders);

// Get single order
router.get('/:id', orderController.getOrderById);

// Update order status (admin only)
router.patch('/:id/status', requireAdmin, orderController.updateOrderStatus);

// Delete order (admin only)
router.delete('/:id', requireAdmin, orderController.deleteOrder);

// Get order history
router.get('/:id/history', orderController.getOrderHistory);

module.exports = router;
