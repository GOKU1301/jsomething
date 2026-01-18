const express = require('express');
const router = express.Router();
const sseService = require('../services/sseService');
const { authenticateToken } = require('../middleware/auth');

/**
 * SSE endpoint for real-time notifications
 */
router.get('/events', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    // Add client to SSE service
    sseService.addClient(userId, res, isAdmin);

    // Keep connection alive with periodic heartbeat
    const heartbeat = setInterval(() => {
        try {
            res.write(':heartbeat\n\n');
        } catch (error) {
            clearInterval(heartbeat);
        }
    }, 30000); // Every 30 seconds

    // Clean up on disconnect
    req.on('close', () => {
        clearInterval(heartbeat);
    });
});

/**
 * Get SSE connection statistics (admin only)
 */
router.get('/stats', authenticateToken, (req, res) => {
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    const stats = sseService.getStats();
    res.json(stats);
});

module.exports = router;
