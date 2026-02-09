const Razorpay = require('razorpay');
const crypto = require('crypto');
require('dotenv').config();

// Initialize Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

/**
 * Verify Razorpay webhook signature
 * @param {string} signature - X-Razorpay-Signature header
 * @param {object} payload - Request body
 * @returns {boolean} True if signature is valid
 */
const verifyWebhookSignature = (signature, payload) => {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');

    return signature === expectedSignature;
};

/**
 * Verify payment signature (for frontend verification)
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} signature - Razorpay signature
 * @returns {boolean} True if signature is valid
 */
const verifyPaymentSignature = (orderId, paymentId, signature) => {
    const body = orderId + '|' + paymentId;

    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');

    return signature === expectedSignature;
};

module.exports = {
    razorpay,
    verifyWebhookSignature,
    verifyPaymentSignature
};
