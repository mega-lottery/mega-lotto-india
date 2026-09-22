const crypto = require('crypto');
require('dotenv').config();

const merchantVpa = process.env.MERCHANT_VPA || 'mrvikash@fam';
const merchantName = process.env.MERCHANT_NAME || 'MEGA LOTTO INDIA';
const merchantApiKey = process.env.MERCHANT_UPI_API_KEY || '';
const merchantApiSecret = process.env.MERCHANT_UPI_API_SECRET || '';
const webhookSecret = process.env.UPI_WEBHOOK_SECRET || '';

const upiIntentManager = {
    getMerchantVpa() {
        return merchantVpa;
    },

    getMerchantName() {
        return merchantName;
    },

    // Check if an official automated UPI Merchant Status API / Bank Webhook is configured
    isOfficialMerchantApiConfigured() {
        return Boolean(merchantApiKey && merchantApiSecret);
    },

    /**
     * Generate Standard NPCI UPI Intent URI
     * @param {Object} params
     * @param {string} params.orderId - Unique Order ID
     * @param {string} params.tr - Unique Transaction Reference ID
     * @param {number} params.amount - Amount in INR (e.g. 19.00)
     * @param {string} [params.note] - Optional custom note
     * @returns {string} Standard UPI URI (e.g. upi://pay?pa=...&pn=...&am=...&cu=INR&tr=...&tn=...)
     */
    generateUpiIntentUri({ orderId, tr, amount, note = null }) {
        const formattedAmount = Number(amount).toFixed(2);
        const transactionNote = encodeURIComponent(note || `Ticket-${orderId}`);
        const encodedMerchantName = encodeURIComponent(merchantName);
        const encodedVpa = encodeURIComponent(merchantVpa);

        // Standard NPCI Universal UPI DeepLink Format
        return `upi://pay?pa=${encodedVpa}&pn=${encodedMerchantName}&am=${formattedAmount}&cu=INR&tr=${encodeURIComponent(tr)}&tn=${transactionNote}`;
    },

    /**
     * Verify Webhook Signature from official merchant banking partner
     * @param {Buffer|string} rawBody 
     * @param {string} signature 
     * @returns {boolean}
     */
    verifyMerchantWebhookSignature(rawBody, signature) {
        if (!webhookSecret || !signature || !rawBody) {
            return false;
        }

        try {
            const hmac = crypto.createHmac('sha256', webhookSecret);
            hmac.update(rawBody);
            const expected = hmac.digest('hex');
            return expected === signature;
        } catch (err) {
            console.error('Webhook signature verification error:', err);
            return false;
        }
    },

    /**
     * Official Bank / UPI Merchant Status Query
     * If no official merchant API key is plugged in, returns unverified without faking.
     */
    async queryTransactionStatus({ orderId, upiReference, amount }) {
        if (!this.isOfficialMerchantApiConfigured()) {
            return {
                verified: false,
                status: 'PAYMENT_PENDING',
                reason: 'NO_MERCHANT_STATUS_API',
                message: 'A standard personal/P2P UPI ID (@fam, @okhdfcbank, @paytm) does not expose automated server query APIs. Ticket remains locked in PAYMENT_PENDING until confirmed by genuine merchant webhook or bank settlement callback.'
            };
        }

        // When official merchant API credentials (e.g. ICICI UPI 2.0 / Cashfree / Setu / Decentro) are provided:
        try {
            // Placeholder for official merchant provider status API integration
            return {
                verified: false,
                status: 'PAYMENT_PENDING',
                message: 'Awaiting bank confirmation for reference ' + upiReference
            };
        } catch (e) {
            return {
                verified: false,
                status: 'ERROR',
                message: e.message
            };
        }
    }
};

module.exports = upiIntentManager;
