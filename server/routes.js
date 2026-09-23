const express = require('express');
const router = express.Router();
const db = require('./db');
const paymentGateway = require('./gateway');
const { LOTTERY_POOLS, getPoolById, calculateExactSchedule, generateRandomCombination } = require('./pools');

// 1. Get Public Merchant & Payment Gateway Configuration
router.get('/config', (req, res) => {
    const config = paymentGateway.getPublicConfig();
    res.json({
        success: true,
        merchantName: config.merchantName,
        isGatewayConfigured: config.isGatewayConfigured,
        razorpayKeyId: config.razorpayKeyId
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

// 3. Create Secure Gateway Order (Google Pay, PhonePe, Paytm, UPI, Cards)
router.post('/orders/create', async (req, res) => {
    try {
        const { poolId, quantity = 1, selectedNumbers = [], userId = 'anon_user' } = req.body;

        const pool = getPoolById(poolId);
        if (!pool) {
            return res.status(400).json({ success: false, message: 'Invalid lottery pool' });
        }

        const qty = Math.max(1, Math.min(20, parseInt(quantity, 10) || 1));
        const totalAmount = pool.price * qty; // Authoritative pricing calculated on server

        if (!Array.isArray(selectedNumbers) || selectedNumbers.length < 6) {
            return res.status(400).json({ success: false, message: 'Must provide 6 valid numbers' });
        }

        const orderId = `ORD_${Date.now()}_${Math.random().toString(36).slice(-6).toUpperCase()}`;
        const upiReference = `ML${Date.now().toString().slice(-8)}${Math.floor(1000 + Math.random() * 9000)}`;
        const expiresAt = Date.now() + 15 * 60 * 1000; // 15 Minutes Expiry

        let gatewayOrderId = null;

        // Create Razorpay Gateway order if gateway is enabled
        if (paymentGateway.isGatewayConfigured()) {
            try {
                const rzp = await paymentGateway.createGatewayOrder({
                    orderId,
                    amount: totalAmount,
                    receipt: orderId,
                    notes: {
                        userId,
                        poolId: pool.id,
                        poolName: pool.name,
                        quantity: qty
                    }
                });
                gatewayOrderId = rzp.gatewayOrderId;
            } catch (err) {
                console.warn('Gateway order creation fallback notice:', err.message);
            }
        }

        // Store Order in DB
        const savedOrder = db.createOrder({
            orderId,
            userId,
            poolId: pool.id,
            quantity: qty,
            amount: totalAmount,
            selectedNumbers,
            upiReference: gatewayOrderId || upiReference,
            expiresAt
        });

        res.json({
            success: true,
            orderId: savedOrder.order_id,
            gatewayOrderId: gatewayOrderId,
            amount: totalAmount,
            currency: 'INR',
            merchantName: paymentGateway.getMerchantName(),
            razorpayKeyId: paymentGateway.getPublicConfig().razorpayKeyId,
            poolName: pool.name,
            quantity: qty,
            paymentStatus: savedOrder.payment_status,
            ticketStatus: savedOrder.ticket_status,
            expiresAt: expiresAt
        });
    } catch (error) {
        console.error('Error creating payment order:', error);
        res.status(500).json({ success: false, message: 'Server error while creating payment order' });
    }
});

// 4. Check Order & Ticket Status (Strict Server Verification)
router.get('/orders/:orderId/status', (req, res) => {
    try {
        const { orderId } = req.params;
        const order = db.getOrderById(orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.payment_status === 'PAID' && order.ticket_status === 'CONFIRMED') {
            const tickets = db.getTicketsByOrderId(orderId);
            return res.json({
                success: true,
                orderId: order.order_id,
                paymentStatus: 'PAID',
                ticketStatus: 'CONFIRMED',
                status: 'CONFIRMED',
                amount: order.amount,
                tickets: tickets
            });
        }

        if (order.expires_at < Date.now() && order.payment_status === 'PAYMENT_PENDING') {
            db.updateOrderStatus(orderId, 'EXPIRED', 'NOT_CONFIRMED');
            return res.json({
                success: true,
                orderId: order.order_id,
                paymentStatus: 'EXPIRED',
                ticketStatus: 'NOT_CONFIRMED',
                status: 'EXPIRED',
                message: 'Payment order has expired. No ticket issued.'
            });
        }

        return res.json({
            success: true,
            orderId: order.order_id,
            paymentStatus: order.payment_status,
            ticketStatus: order.ticket_status,
            status: 'PAYMENT_PENDING',
            message: 'Payment is pending verification.'
        });
    } catch (err) {
        console.error('Order status query error:', err);
        res.status(500).json({ success: false, message: 'Server error checking order status' });
    }
});

// 5. Server-Side Payment Verification (Razorpay / Gateway HMAC Verification)
router.post('/payments/verify', async (req, res) => {
    try {
        const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!orderId) {
            return res.status(400).json({ success: false, message: 'Missing order ID' });
        }

        const order = db.getOrderById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.payment_status === 'PAID' && order.ticket_status === 'CONFIRMED') {
            const tickets = db.getTicketsByOrderId(orderId);
            return res.json({ success: true, message: 'Payment already verified', paymentStatus: 'PAID', ticketStatus: 'CONFIRMED', tickets });
        }

        // Verify Razorpay Payment Signature
        let isSignatureValid = false;
        if (razorpay_order_id && razorpay_payment_id && razorpay_signature) {
            isSignatureValid = paymentGateway.verifyPaymentSignature({
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature
            });
        } else if (!paymentGateway.isGatewayConfigured()) {
            // Development fallback mode if gateway is not configured
            isSignatureValid = true;
        }

        if (!isSignatureValid) {
            return res.status(400).json({
                success: false,
                paymentStatus: 'FAILED',
                ticketStatus: 'NOT_CONFIRMED',
                message: 'Invalid payment signature. Transaction could not be verified.'
            });
        }

        // If genuine payment is verified: generate & issue tickets
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
                drawTargetTimestamp: exactSchedule.timestamp
            });
        }

        const confirmedTickets = db.confirmOrderAndIssueTickets({
            orderId: order.order_id,
            upiReference: razorpay_payment_id || order.upi_reference,
            tickets: ticketsToCreate
        });

        res.json({
            success: true,
            paymentStatus: 'PAID',
            ticketStatus: 'CONFIRMED',
            tickets: confirmedTickets
        });
    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({ success: false, message: 'Internal server error during verification' });
    }
});

// 6. Merchant / Gateway Webhook Listener
router.post('/payments/webhook', (req, res) => {
    try {
        const signature = req.headers['x-razorpay-signature'] || req.headers['x-webhook-signature'];
        const rawBody = req.rawBody;

        if (paymentGateway.isGatewayConfigured() && signature && rawBody) {
            const isValid = paymentGateway.verifyWebhookSignature(rawBody, signature);
            if (!isValid) {
                return res.status(400).send('Invalid webhook signature');
            }
        }

        const payload = req.body;
        const paymentEntity = payload?.payload?.payment?.entity || payload;
        const notes = paymentEntity?.notes || {};
        const orderId = notes.orderId || payload.orderId;

        const targetOrder = orderId ? db.getOrderById(orderId) : null;
        if (!targetOrder) {
            return res.status(200).json({ status: 'order_not_found' });
        }

        const status = paymentEntity.status || payload.status;
        if (status === 'captured' || status === 'paid' || status === 'PAID' || status === 'SUCCESS') {
            const pool = getPoolById(targetOrder.pool_id);
            const exactSchedule = calculateExactSchedule(pool);
            const ticketsToCreate = [];

            for (let q = 0; q < targetOrder.quantity; q++) {
                const ticketSerial = `ML-${pool.id + 10}-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
                const ticketNums = q === 0 ? targetOrder.selected_numbers : generateRandomCombination();

                ticketsToCreate.push({
                    ticketId: `TCK_${Date.now()}_${q}`,
                    serial: ticketSerial,
                    poolId: pool.id,
                    poolName: pool.name,
                    price: pool.price,
                    prize: pool.prize,
                    numbers: ticketNums,
                    exactDrawLabel: exactSchedule.exactLabel,
                    drawTargetTimestamp: exactSchedule.timestamp
                });
            }

            const confirmedTickets = db.confirmOrderAndIssueTickets({
                orderId: targetOrder.order_id,
                upiReference: paymentEntity.id || targetOrder.upi_reference,
                tickets: ticketsToCreate
            });

            return res.status(200).json({ status: 'confirmed', tickets: confirmedTickets.length });
        }

        return res.status(200).json({ status: 'processed' });
    } catch (err) {
        console.error('Webhook processing error:', err);
        res.status(500).send('Server error');
    }
});

// 7. Get Tickets for User
router.get('/tickets/user/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const tickets = db.getTicketsByUserId(userId);
        res.json({ success: true, tickets });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error retrieving user tickets' });
    }
});

// 8. Admin/Owner Order Inspection
router.get('/admin/orders', (req, res) => {
    try {
        const orders = db.getAllOrders(50);
        res.json({ success: true, orders });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error fetching orders' });
    }
});

module.exports = router;
