const db = require('../config/database');
const { razorpay, verifyWebhookSignature } = require('../config/payment');
const sseService = require('../services/sseService');

/**
 * Create payment order
 */
const createPayment = async (req, res) => {
    const client = await db.pool.connect();

    try {
        const { orderId } = req.body;
        const userId = req.user.id;

        await client.query('BEGIN');

        // Get order details
        const orderResult = await client.query(
            'SELECT id, user_id, amount, status FROM print_orders WHERE id = $1 AND user_id = $2',
            [orderId, userId]
        );

        if (orderResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Order not found' });
        }

        const order = orderResult.rows[0];

        // Check if order is in correct status
        if (order.status !== 'UPLOADED') {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Order is not in a payable state' });
        }

        // Create Razorpay order
        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(order.amount * 100), // Convert to paise
            currency: 'INR',
            receipt: `order_${order.id}`,
            notes: {
                orderId: order.id,
                userId: userId
            }
        });

        // Save payment record
        await client.query(
            `INSERT INTO payments (order_id, provider, provider_payment_id, status, amount) 
       VALUES ($1, 'razorpay', $2, 'CREATED', $3)`,
            [order.id, razorpayOrder.id, order.amount]
        );

        // Update order status to PAYMENT_PENDING
        await client.query(
            'UPDATE print_orders SET status = $1 WHERE id = $2',
            ['PAYMENT_PENDING', order.id]
        );

        // Log status change
        await client.query(
            `INSERT INTO order_status_history (order_id, old_status, new_status, changed_by) 
       VALUES ($1, $2, $3, $4)`,
            [order.id, 'UPLOADED', 'PAYMENT_PENDING', userId]
        );

        await client.query('COMMIT');

        res.json({
            razorpayOrderId: razorpayOrder.id,
            amount: order.amount,
            currency: 'INR',
            keyId: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Create payment error:', error);
        res.status(500).json({ error: 'Failed to create payment' });
    } finally {
        client.release();
    }
};

/**
 * Handle Razorpay webhook
 */
const handleWebhook = async (req, res) => {
    const client = await db.pool.connect();

    try {
        const signature = req.headers['x-razorpay-signature'];
        const payload = req.body;

        // Verify webhook signature
        if (!verifyWebhookSignature(signature, payload)) {
            return res.status(400).json({ error: 'Invalid signature' });
        }

        const event = payload.event;
        const paymentEntity = payload.payload.payment.entity;

        if (event === 'payment.captured') {
            await client.query('BEGIN');

            // Find payment record
            const paymentResult = await client.query(
                'SELECT id, order_id, status FROM payments WHERE provider_payment_id = $1',
                [paymentEntity.order_id]
            );

            if (paymentResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Payment not found' });
            }

            const payment = paymentResult.rows[0];

            // Update payment status
            await client.query(
                'UPDATE payments SET status = $1 WHERE id = $2',
                ['SUCCESS', payment.id]
            );

            // Get order details
            const orderResult = await client.query(
                'SELECT id, user_id, status FROM print_orders WHERE id = $1',
                [payment.order_id]
            );

            const order = orderResult.rows[0];
            const oldStatus = order.status;

            // Update order status to PAID
            await client.query(
                'UPDATE print_orders SET status = $1 WHERE id = $2',
                ['PAID', order.id]
            );

            // Log status change
            await client.query(
                `INSERT INTO order_status_history (order_id, old_status, new_status, changed_by) 
         VALUES ($1, $2, $3, NULL)`,
                [order.id, oldStatus, 'PAID']
            );

            // Auto-transition to QUEUED
            await client.query(
                'UPDATE print_orders SET status = $1 WHERE id = $2',
                ['QUEUED', order.id]
            );

            // Log QUEUED status
            await client.query(
                `INSERT INTO order_status_history (order_id, old_status, new_status, changed_by) 
         VALUES ($1, $2, $3, NULL)`,
                [order.id, 'PAID', 'QUEUED']
            );

            await client.query('COMMIT');

            // Send SSE notifications
            sseService.sendToUser(order.user_id, 'paymentSuccess', {
                orderId: order.id,
                status: 'QUEUED',
                timestamp: new Date().toISOString()
            });

            sseService.sendToAdmins('newOrder', {
                orderId: order.id,
                timestamp: new Date().toISOString()
            });

            res.json({ status: 'ok' });
        } else if (event === 'payment.failed') {
            await client.query('BEGIN');

            // Find payment record
            const paymentResult = await client.query(
                'SELECT id, order_id FROM payments WHERE provider_payment_id = $1',
                [paymentEntity.order_id]
            );

            if (paymentResult.rows.length > 0) {
                const payment = paymentResult.rows[0];

                // Update payment status
                await client.query(
                    'UPDATE payments SET status = $1 WHERE id = $2',
                    ['FAILED', payment.id]
                );

                // Get order details
                const orderResult = await client.query(
                    'SELECT user_id FROM print_orders WHERE id = $1',
                    [payment.order_id]
                );

                if (orderResult.rows.length > 0) {
                    const order = orderResult.rows[0];

                    // Notify user of payment failure
                    sseService.sendToUser(order.user_id, 'paymentFailed', {
                        orderId: payment.order_id,
                        timestamp: new Date().toISOString()
                    });
                }
            }

            await client.query('COMMIT');
            res.json({ status: 'ok' });
        } else {
            // Other events - just acknowledge
            res.json({ status: 'ok' });
        }
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    } finally {
        client.release();
    }
};

/**
 * Get payment status for an order
 */
const getPaymentStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.id;

        // Verify order belongs to user
        const orderResult = await db.query(
            'SELECT id FROM print_orders WHERE id = $1 AND user_id = $2',
            [orderId, userId]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Get payment details
        const paymentResult = await db.query(
            'SELECT id, provider, provider_payment_id, status, amount, created_at FROM payments WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1',
            [orderId]
        );

        if (paymentResult.rows.length === 0) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        const payment = paymentResult.rows[0];

        res.json({
            payment: {
                id: payment.id,
                provider: payment.provider,
                status: payment.status,
                amount: payment.amount,
                createdAt: payment.created_at
            }
        });
    } catch (error) {
        console.error('Get payment status error:', error);
        res.status(500).json({ error: 'Failed to fetch payment status' });
    }
};

module.exports = {
    createPayment,
    handleWebhook,
    getPaymentStatus
};
