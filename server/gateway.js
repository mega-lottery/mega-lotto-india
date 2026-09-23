const crypto = require('crypto');
const Razorpay = require('razorpay');
require('dotenv').config();

const merchantName = process.env.MERCHANT_NAME || 'MEGA LOTTO INDIA';
const razorpayKeyId = process.env.RAZORPAY_KEY_ID || '';
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || '';
const razorpayWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';

// Initialize Razorpay instance if credentials are present
let razorpayClient = null;
if (razorpayKeyId && razorpayKeySecret) {
    try {
        razorpayClient = new Razorpay({
            key_id: razorpayKeyId,
            key_secret: razorpayKeySecret
        });
    } catch (err) {
        console.error('Error initializing Razorpay client:', err);
    }
}

const paymentGatewayManager = {
    getMerchantName() {
        return merchantName;
    },

    isGatewayConfigured() {
        return Boolean(razorpayKeyId && razorpayKeySecret);
    },

    getPublicConfig() {
        return {
            merchantName: merchantName,
            isGatewayConfigured: this.isGatewayConfigured(),
            razorpayKeyId: razorpayKeyId ? razorpayKeyId : null
        };
    },

    /**
     * Create Razorpay Gateway Order for GPay, PhonePe, Paytm, UPI, Cards, Netbanking
     * @param {Object} params
     * @param {string} params.orderId - Internal System Order ID
     * @param {number} params.amount - Total amount in INR
     * @param {string} [params.receipt] - Receipt ID
     * @param {Object} [params.notes] - Custom metadata
     * @returns {Promise<Object>}
     */
    async createGatewayOrder({ orderId, amount, receipt, notes = {} }) {
        if (!this.isGatewayConfigured() || !razorpayClient) {
            throw new Error('Payment gateway is not configured with active credentials.');
        }

        const amountInPaise = Math.round(Number(amount) * 100);

        try {
            const rzpOrder = await razorpayClient.orders.create({
                amount: amountInPaise,
                currency: 'INR',
                receipt: receipt || orderId,
                notes: {
                    orderId: orderId,
                    ...notes
                }
            });

            return {
                gatewayOrderId: rzpOrder.id,
                amount: rzpOrder.amount,
                currency: rzpOrder.currency,
                receipt: rzpOrder.receipt
            };
        } catch (error) {
            console.error('Razorpay order creation error:', error);
            throw error;
        }
    },

    /**
     * Cryptographically verify Razorpay Payment Signature
     * @param {Object} params
     * @param {string} params.razorpayOrderId
     * @param {string} params.razorpayPaymentId
     * @param {string} params.razorpaySignature
     * @returns {boolean}
     */
    verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
        if (!razorpayKeySecret || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            return false;
        }

        try {
            const body = razorpayOrderId + '|' + razorpayPaymentId;
            const expectedSignature = crypto
                .createHmac('sha256', razorpayKeySecret)
                .update(body.toString())
                .digest('hex');

            return expectedSignature === razorpaySignature;
        } catch (err) {
            console.error('Signature verification error:', err);
            return false;
        }
    },

    /**
     * Verify Webhook Signature from Razorpay
     * @param {Buffer|string} rawBody 
     * @param {string} signature 
     * @returns {boolean}
     */
    verifyWebhookSignature(rawBody, signature) {
        const secret = razorpayWebhookSecret || razorpayKeySecret;
        if (!secret || !signature || !rawBody) {
            return false;
        }

        try {
            const expected = crypto
                .createHmac('sha256', secret)
                .update(rawBody)
                .digest('hex');
            return expected === signature;
        } catch (err) {
            console.error('Webhook signature verification error:', err);
            return false;
        }
    }
};

module.exports = paymentGatewayManager;
