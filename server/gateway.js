const Razorpay = require('razorpay');
const crypto = require('crypto');
require('dotenv').config();

const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_1DP5mmOlF5G5ag';
const keySecret = process.env.RAZORPAY_KEY_SECRET || 's9x3W5eBw1YvX1948zQk8LmQ';
const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'megalotto_webhook_secret_2026';
const merchantVpa = process.env.MERCHANT_VPA || 'mrvikash@fam';
const merchantName = process.env.MERCHANT_NAME || 'MEGA LOTTO INDIA';

let razorpayInstance = null;
try {
    razorpayInstance = new Razorpay({
        key_id: keyId,
        key_secret: keySecret
    });
} catch (e) {
    console.warn('Razorpay initialization warning:', e.message);
}

const paymentGateway = {
    getKeyId() {
        return keyId;
    },

    getMerchantVpa() {
        return merchantVpa;
    },

    getMerchantName() {
        return merchantName;
    },

    // Create a real Gateway Order on Razorpay
    async createOrder({ orderId, amount, currency = 'INR', notes = {} }) {
        const amountInPaise = Math.round(amount * 100);

        try {
            if (razorpayInstance && keyId && !keyId.includes('YourKeyHere')) {
                const rzpOrder = await razorpayInstance.orders.create({
                    amount: amountInPaise,
                    currency: currency,
                    receipt: orderId,
                    payment_capture: 1,
                    notes: {
                        orderId: orderId,
                        ...notes
                    }
                });

                return {
                    gatewayOrderId: rzpOrder.id,
                    amount: amount,
                    currency: currency,
                    keyId: keyId,
                    rawOrder: rzpOrder
                };
            }
        } catch (error) {
            console.error('Razorpay API order creation failed, using sandbox order ID:', error.message);
        }

        // Fallback for offline test mode when gateway credentials are test placeholders
        return {
            gatewayOrderId: `order_test_${Date.now()}_${Math.random().toString(36).slice(-6)}`,
            amount: amount,
            currency: currency,
            keyId: keyId,
            isSandboxFallback: true
        };
    },

    // Verify Standard Checkout Signature (HMAC-SHA256)
    verifyPaymentSignature({ gatewayOrderId, paymentId, signature }) {
        if (!gatewayOrderId || !paymentId || !signature) {
            return false;
        }

        try {
            const hmac = crypto.createHmac('sha256', keySecret);
            hmac.update(`${gatewayOrderId}|${paymentId}`);
            const expectedSignature = hmac.digest('hex');

            return expectedSignature === signature;
        } catch (e) {
            console.error('Signature verification error:', e);
            return false;
        }
    },

    // Verify Gateway Webhook Signature (HMAC-SHA256 over raw request buffer)
    verifyWebhookSignature(rawBodyBuffer, signature) {
        if (!rawBodyBuffer || !signature) {
            return false;
        }

        try {
            const hmac = crypto.createHmac('sha256', webhookSecret);
            hmac.update(rawBodyBuffer);
            const expectedSignature = hmac.digest('hex');

            return expectedSignature === signature;
        } catch (e) {
            console.error('Webhook signature verification error:', e);
            return false;
        }
    },

    // Fetch direct payment capture status from Gateway API
    async fetchPaymentStatus(paymentId) {
        if (!razorpayInstance || !paymentId) return null;
        try {
            const payment = await razorpayInstance.payments.fetch(paymentId);
            return payment;
        } catch (e) {
            console.error('Error fetching payment from Razorpay API:', e.message);
            return null;
        }
    }
};

module.exports = paymentGateway;
