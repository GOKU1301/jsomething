const db = require('../config/database');
const Joi = require('joi');
const sseService = require('../services/sseService');

// Validation schema
const createOrderSchema = Joi.object({
    fileId: Joi.string().uuid().required(),
    copies: Joi.number().integer().min(1).max(100).required(),
    isColor: Joi.boolean().required(),
    isBinding: Joi.boolean().required()
});

/**
 * Calculate order amount based on preferences
 */
const calculateAmount = (pageCount, copies, isColor, isBinding) => {
    const pricePerPage = isColor
        ? parseFloat(process.env.PRICE_PER_PAGE_COLOR)
        : parseFloat(process.env.PRICE_PER_PAGE_BW);

    const bindingPrice = isBinding ? parseFloat(process.env.PRICE_BINDING) : 0;

    const totalAmount = (pageCount * copies * pricePerPage) + bindingPrice;
    return parseFloat(totalAmount.toFixed(2));
};

/**
 * Create a new print order
 */
const createOrder = async (req, res) => {
    const client = await db.pool.connect();

    try {
        // Validate input
        const { error, value } = createOrderSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { fileId, copies, isColor, isBinding } = value;
        const userId = req.user.id;

        await client.query('BEGIN');

        // Verify file belongs to user
        const fileResult = await client.query(
            'SELECT id, page_count FROM files WHERE id = $1 AND user_id = $2',
            [fileId, userId]
        );

        if (fileResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'File not found' });
        }

        const file = fileResult.rows[0];

        // Calculate amount
        const amount = calculateAmount(file.page_count, copies, isColor, isBinding);

        // Create order
        const orderResult = await client.query(
            `INSERT INTO print_orders (user_id, file_id, copies, is_color, is_binding, amount, status) 
       VALUES ($1, $2, $3, $4, $5, $6, 'UPLOADED') 
       RETURNING id, user_id, file_id, copies, is_color, is_binding, amount, status, created_at`,
            [userId, fileId, copies, isColor, isBinding, amount]
        );

        const order = orderResult.rows[0];

        // Log status history
        await client.query(
            `INSERT INTO order_status_history (order_id, old_status, new_status, changed_by) 
       VALUES ($1, NULL, 'UPLOADED', $2)`,
            [order.id, userId]
        );

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Order created successfully',
            order: {
                id: order.id,
                fileId: order.file_id,
                copies: order.copies,
                isColor: order.is_color,
                isBinding: order.is_binding,
                amount: order.amount,
                status: order.status,
                createdAt: order.created_at
            }
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Create order error:', error);
        res.status(500).json({ error: 'Failed to create order' });
    } finally {
        client.release();
    }
};

/**
 * Get all orders (filtered by role)
 */
const getOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const isAdmin = req.user.role === 'ADMIN';
        const { status } = req.query;

        let query;
        let params;

        if (isAdmin) {
            // Admin sees all orders, optionally filtered by status
            if (status) {
                query = `
          SELECT o.*, f.original_filename, f.page_count, u.name as user_name, u.email as user_email, u.roll_number
          FROM print_orders o
          JOIN files f ON o.file_id = f.id
          JOIN users u ON o.user_id = u.id
          WHERE o.status = $1
          ORDER BY o.created_at ASC
        `;
                params = [status];
            } else {
                query = `
          SELECT o.*, f.original_filename, f.page_count, u.name as user_name, u.email as user_email, u.roll_number
          FROM print_orders o
          JOIN files f ON o.file_id = f.id
          JOIN users u ON o.user_id = u.id
          ORDER BY o.created_at ASC
        `;
                params = [];
            }
        } else {
            // Students see only their own orders
            if (status) {
                query = `
          SELECT o.*, f.original_filename, f.page_count
          FROM print_orders o
          JOIN files f ON o.file_id = f.id
          WHERE o.user_id = $1 AND o.status = $2
          ORDER BY o.created_at DESC
        `;
                params = [userId, status];
            } else {
                query = `
          SELECT o.*, f.original_filename, f.page_count
          FROM print_orders o
          JOIN files f ON o.file_id = f.id
          WHERE o.user_id = $1
          ORDER BY o.created_at DESC
        `;
                params = [userId];
            }
        }

        const result = await db.query(query, params);

        const orders = result.rows.map(row => ({
            id: row.id,
            fileId: row.file_id,
            fileName: row.original_filename,
            pageCount: row.page_count,
            copies: row.copies,
            isColor: row.is_color,
            isBinding: row.is_binding,
            amount: row.amount,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            ...(isAdmin && {
                userName: row.user_name,
                userEmail: row.user_email,
                rollNumber: row.roll_number
            })
        }));

        res.json({ orders });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
};

/**
 * Get single order details
 */
const getOrderById = async (req, res) => {
    try {
        const orderId = req.params.id;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'ADMIN';

        const query = isAdmin
            ? `SELECT o.*, f.original_filename, f.page_count, f.s3_key, u.name as user_name, u.email as user_email, u.roll_number
         FROM print_orders o
         JOIN files f ON o.file_id = f.id
         JOIN users u ON o.user_id = u.id
         WHERE o.id = $1`
            : `SELECT o.*, f.original_filename, f.page_count, f.s3_key
         FROM print_orders o
         JOIN files f ON o.file_id = f.id
         WHERE o.id = $1 AND o.user_id = $2`;

        const params = isAdmin ? [orderId] : [orderId, userId];
        const result = await db.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const row = result.rows[0];
        const order = {
            id: row.id,
            fileId: row.file_id,
            fileName: row.original_filename,
            pageCount: row.page_count,
            copies: row.copies,
            isColor: row.is_color,
            isBinding: row.is_binding,
            amount: row.amount,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            ...(isAdmin && {
                userName: row.user_name,
                userEmail: row.user_email,
                rollNumber: row.roll_number
            })
        };

        res.json({ order });
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
};

/**
 * Update order status (admin only)
 */
const updateOrderStatus = async (req, res) => {
    const client = await db.pool.connect();

    try {
        const orderId = req.params.id;
        const { status } = req.body;
        const adminId = req.user.id;

        // Validate status
        const validStatuses = ['UPLOADED', 'PAYMENT_PENDING', 'PAID', 'QUEUED', 'PRINTED', 'COLLECTED', 'CANCELLED'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        await client.query('BEGIN');

        // Get current order
        const orderResult = await client.query(
            'SELECT id, user_id, status FROM print_orders WHERE id = $1',
            [orderId]
        );

        if (orderResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Order not found' });
        }

        const order = orderResult.rows[0];
        const oldStatus = order.status;

        if (oldStatus === status) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Order already has this status' });
        }

        // Update order status
        await client.query(
            'UPDATE print_orders SET status = $1 WHERE id = $2',
            [status, orderId]
        );

        // Log status history
        await client.query(
            `INSERT INTO order_status_history (order_id, old_status, new_status, changed_by) 
       VALUES ($1, $2, $3, $4)`,
            [orderId, oldStatus, status, adminId]
        );

        await client.query('COMMIT');

        // Send SSE notification to user
        sseService.sendToUser(order.user_id, 'orderStatusUpdate', {
            orderId: order.id,
            oldStatus,
            newStatus: status,
            timestamp: new Date().toISOString()
        });

        res.json({
            message: 'Order status updated successfully',
            order: {
                id: order.id,
                oldStatus,
                newStatus: status
            }
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Update order status error:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    } finally {
        client.release();
    }
};

/**
 * Get order status history
 */
const getOrderHistory = async (req, res) => {
    try {
        const orderId = req.params.id;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'ADMIN';

        // Verify order access
        const orderQuery = isAdmin
            ? 'SELECT id FROM print_orders WHERE id = $1'
            : 'SELECT id FROM print_orders WHERE id = $1 AND user_id = $2';

        const orderParams = isAdmin ? [orderId] : [orderId, userId];
        const orderResult = await db.query(orderQuery, orderParams);

        if (orderResult.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Get history
        const historyResult = await db.query(
            `SELECT h.*, u.name as changed_by_name 
       FROM order_status_history h
       LEFT JOIN users u ON h.changed_by = u.id
       WHERE h.order_id = $1
       ORDER BY h.changed_at ASC`,
            [orderId]
        );

        const history = historyResult.rows.map(row => ({
            id: row.id,
            oldStatus: row.old_status,
            newStatus: row.new_status,
            changedBy: row.changed_by_name,
            changedAt: row.changed_at
        }));

        res.json({ history });
    } catch (error) {
        console.error('Get order history error:', error);
        res.status(500).json({ error: 'Failed to fetch order history' });
    }
};

module.exports = {
    createOrder,
    getOrders,
    getOrderById,
    updateOrderStatus,
    getOrderHistory,
    calculateAmount
};
