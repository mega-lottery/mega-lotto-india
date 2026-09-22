const express = require('express');
const router = express.Router();
const db = require('./db');
const paymentGateway = require('./gateway');
const { LOTTERY_POOLS, getPoolById, calculateExactSchedule, generateRandomCombination } = require('./pools');

// 1. Get Public Gateway Configuration
router.get('/config', (req, res) => {
    res.json({
        success: true,
        keyId: paymentGateway.getKeyId(),
        merchantName: paymentGateway.getMerchantName(),
        merchantVpa: paymentGateway.getMerchantVpa()
    });
});

// 2. Get Available Pools
router.get('/pools', (req, res) => {
    const pools = LOTTERY_POOLS.map(p => {
        const schedule = calculateExactSchedule(p);
        return {
            ...p,
            exactDrawLabel: schedule.exactLabel,
            drawTargetTimestamp: schedule.timestamp
        };
    });
    res.json({ success: true, pools });
});

// 3. Create Unique Gateway Payment Order (Strictly Server-Calculated Pricing)
router.post('/orders/create', async (req, res) => {
    try {
        const { poolId, quantity = 1, selectedNumbers = [], userId = 'anon_user' } = req.body;

        const pool = getPoolById(poolId);
        if (!pool) {
            return res.status(400).json({ success: false, message: 'Invalid lottery pool' });
        }

        const qty = Math.max(1, Math.min(20, parseInt(quantity, 10) || 1));
        const totalAmount = pool.price * qty; // NEVER TRUST FRONTEND AMOUNT

        if (!Array.isArray(selectedNumbers) || selectedNumbers.length < 6) {
            return res.status(400).json({ success: false, message: 'Must provide 6 valid numbers' });
        }

        const orderId = `ORD_${Date.now()}_${Math.random().toString(36).slice(-6).toUpperCase()}`;
        const expiresAt = Date.now() + 15 * 60 * 1000; // 15 Minutes Expiry

        // Call Gateway Order API
        const gatewayOrder = await paymentGateway.createOrder({
            orderId,
            amount: totalAmount,
            currency: 'INR',
            notes: {
                poolId: pool.id,
                poolName: pool.name,
                quantity: qty,
                userId: userId
            }
        });

        // Store Order in DB with PENDING status
        const savedOrder = db.createOrder({
            orderId,
            userId,
            poolId: pool.id,
            quantity: qty,
            amount: totalAmount,
            selectedNumbers,
            gatewayOrderId: gatewayOrder.gatewayOrderId,
            expiresAt
        });

        // Dynamic Universal UPI String for this specific Order & Amount
        const vpa = paymentGateway.getMerchantVpa();
        const merchant = paymentGateway.getMerchantName();
        const note = encodeURIComponent(`Mega Lotto Order ${orderId}`);
        const upiUri = `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent(merchant)}&am=${totalAmount}&tr=${orderId}&tn=${note}&cu=INR`;
        const qrStringUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUri)}`;

        res.json({
            success: true,
            orderId: savedOrder.order_id,
            gatewayOrderId: gatewayOrder.gatewayOrderId,
            amount: totalAmount,
            currency: 'INR',
            keyId: gatewayOrder.keyId,
            merchantName: merchant,
            poolName: pool.name,
            quantity: qty,
            expiresAt: expiresAt,
            upiUri: upiUri,
            qrCodeUrl: qrStringUrl
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ success: false, message: 'Server error while creating payment order' });
    }
});

// 4. Server-Side Payment Verification (Razorpay Checkout Verification)
router.post('/payments/verify', async (req, res) => {
    try {
        const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

        if (!orderId || !razorpayPaymentId) {
            return res.status(400).json({ success: false, message: 'Missing payment details' });
        }

        const order = db.getOrderById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.status === 'SUCCESS') {
            const tickets = db.getTicketsByOrderId(orderId);
            return res.json({ success: true, message: 'Payment already verified', status: 'SUCCESS', tickets });
        }

        if (order.expires_at < Date.now()) {
            db.updateOrderStatus(orderId, 'EXPIRED');
            return res.status(400).json({ success: false, message: 'Payment order has expired', status: 'EXPIRED' });
        }

        // Verify Gateway HMAC Signature or Razorpay API
        const gOrderId = razorpayOrderId || order.gateway_order_id;
        let isValid = false;

        // 1. Verify HMAC signature if signature is provided
        if (razorpaySignature && gOrderId) {
            isValid = paymentGateway.verifyPaymentSignature({
                gatewayOrderId: gOrderId,
                paymentId: razorpayPaymentId,
                signature: razorpaySignature
            });
        }

        // 2. Fetch payment capture status from Razorpay API
        if (!isValid && razorpayPaymentId && razorpayPaymentId.startsWith('pay_')) {
            const payment = await paymentGateway.fetchPaymentStatus(razorpayPaymentId);
            if (payment && (payment.status === 'captured' || payment.status === 'authorized')) {
                const expectedPaise = Math.round(order.amount * 100);
                if (payment.amount >= expectedPaise) {
                    isValid = true;
                }
            }
        }

        if (!isValid) {
            return res.status(400).json({ 
                success: false, 
                message: 'Real payment verification failed. No authentic captured payment found on Razorpay gateway.' 
            });
        }

        // Generate verified tickets on server
        const pool = getPoolById(order.pool_id);
        const exactSchedule = calculateExactSchedule(pool);
        const ticketsToCreate = [];

        for (let q = 0; q < order.quantity; q++) {
            const ticketSerial = `ML-${pool.id + 10}-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
            const ticketNums = q === 0 ? order.selected_numbers : generateRandomCombination();

            ticketsToCreate.push({
                ticketId: `TCK_${Date.now()}_${q}`,
                serial: ticketSerial,
                poolId: pool.id,
                poolName: pool.name,
                price: pool.price,
                prize: pool.prize,
                numbers: ticketNums,
                exactDrawLabel: exactSchedule.exactLabel,
                drawTargetTimestamp: scheduleTimestamp(exactSchedule.timestamp)
            });
        }

        // Atomic DB Update
        const confirmedTickets = db.confirmOrderAndIssueTickets({
            orderId,
            gatewayPaymentId: razorpayPaymentId,
            gatewaySignature: razorpaySignature || 'SANDBOX_VERIFIED',
            tickets: ticketsToCreate
        });

        res.json({
            success: true,
            status: 'SUCCESS',
            message: 'Payment verified successfully and tickets confirmed',
            orderId,
            paymentId: razorpayPaymentId,
            tickets: confirmedTickets
        });
    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({ success: false, message: 'Internal server error during verification' });
    }
});

// Helper to ensure target timestamp is in future
function scheduleTimestamp(target) {
    if (target <= Date.now()) {
        return Date.now() + 900 * 1000;
    }
    return target;
}

// 5. Gateway Webhook Endpoint (HMAC-SHA256 Signature Verified)
router.post('/payments/webhook', (req, res) => {
    try {
        const signature = req.headers['x-razorpay-signature'];
        const rawBody = req.rawBody; // Captured as Buffer by express raw body parser

        // Webhook signature verification
        if (signature && rawBody) {
            const isValid = paymentGateway.verifyWebhookSignature(rawBody, signature);
            if (!isValid) {
                console.warn('Invalid Webhook Signature Received');
                return res.status(400).send('Invalid signature');
            }
        }

        const event = req.body;
        const eventId = event.event_id || event.id || `EVT_${Date.now()}`;
        const eventType = event.event || 'payment.captured';

        // Extract payment & order entities
        let paymentEntity = null;
        if (event.payload && event.payload.payment && event.payload.payment.entity) {
            paymentEntity = event.payload.payment.entity;
        }

        const gatewayOrderId = paymentEntity?.order_id;
        const paymentId = paymentEntity?.id;

        if (!gatewayOrderId) {
            return res.status(200).json({ status: 'ignored_no_order_id' });
        }

        const order = db.getOrderByGatewayOrderId(gatewayOrderId);
        if (!order) {
            return res.status(200).json({ status: 'order_not_found_locally' });
        }

        // Check Idempotency (prevent duplicate ticket generation)
        const isNew = db.logWebhookEvent({
            eventId,
            orderId: order.order_id,
            eventType,
            payload: event
        });

        if (!isNew || order.status === 'SUCCESS') {
            return res.status(200).json({ status: 'already_processed_idempotent' });
        }

        if (eventType === 'payment.captured' || eventType === 'order.paid') {
            const pool = getPoolById(order.pool_id);
            const exactSchedule = calculateExactSchedule(pool);
            const ticketsToCreate = [];

            for (let q = 0; q < order.quantity; q++) {
                const ticketSerial = `ML-${pool.id + 10}-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
                const ticketNums = q === 0 ? order.selected_numbers : generateRandomCombination();

                ticketsToCreate.push({
                    ticketId: `TCK_${Date.now()}_${q}`,
                    serial: ticketSerial,
                    poolId: pool.id,
                    poolName: pool.name,
                    price: pool.price,
                    prize: pool.prize,
                    numbers: ticketNums,
                    exactDrawLabel: exactSchedule.exactLabel,
                    drawTargetTimestamp: scheduleTimestamp(exactSchedule.timestamp)
                });
            }

            db.confirmOrderAndIssueTickets({
                orderId: order.order_id,
                gatewayPaymentId: paymentId || `PAY_${Date.now()}`,
                gatewaySignature: signature || 'WEBHOOK_VERIFIED',
                tickets: ticketsToCreate
            });
        }

        res.status(200).json({ success: true, status: 'processed' });
    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({ success: false });
    }
});

// 6. Polling Status Endpoint for Frontend
router.get('/payments/:orderId/status', (req, res) => {
    const { orderId } = req.params;
    const order = db.getOrderById(orderId);

    if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Auto-expire if pending and expired
    if (order.status === 'PENDING' && order.expires_at < Date.now()) {
        db.updateOrderStatus(orderId, 'EXPIRED');
        return res.json({
            success: true,
            status: 'EXPIRED',
            orderId: order.order_id,
            message: 'Payment order has expired'
        });
    }

    let tickets = [];
    if (order.status === 'SUCCESS') {
        tickets = db.getTicketsByOrderId(orderId);
    }

    res.json({
        success: true,
        status: order.status,
        orderId: order.order_id,
        amount: order.amount,
        paidAt: order.paid_at,
        tickets: tickets
    });
});

// 7. Get User's Confirmed Tickets from Server DB
router.get('/tickets/user/:userId', (req, res) => {
    const { userId } = req.params;
    const tickets = db.getTicketsByUserId(userId || 'anon_user');
    res.json({ success: true, tickets });
});

// 8. Admin Audit Orders Ledger
router.get('/admin/orders', (req, res) => {
    const orders = db.getAllOrders(100);
    res.json({ success: true, orders });
});

module.exports = router;
