const express = require('express');
const router = express.Router();
const db = require('./db');
const upiIntentManager = require('./gateway');
const { LOTTERY_POOLS, getPoolById, calculateExactSchedule, generateRandomCombination } = require('./pools');

// 1. Get Public Merchant Configuration
router.get('/config', (req, res) => {
    res.json({
        success: true,
        merchantName: upiIntentManager.getMerchantName(),
        merchantVpa: upiIntentManager.getMerchantVpa(),
        isOfficialMerchantApiConfigured: upiIntentManager.isOfficialMerchantApiConfigured()
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

// 3. Create Unique Mobile UPI Intent Order (Authoritative Server Pricing)
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
        const upiReference = `ML${Date.now().toString().slice(-8)}${Math.floor(1000 + Math.random() * 9000)}`;
        const expiresAt = Date.now() + 15 * 60 * 1000; // 15 Minutes Expiry

        // Generate Standard Universal UPI Intent URI
        const upiUri = upiIntentManager.generateUpiIntentUri({
            orderId,
            tr: upiReference,
            amount: totalAmount,
            note: `MegaLotto-${pool.name.replace(/[^a-zA-Z0-9]/g, '')}`
        });

        // Store Order in DB with status: PAYMENT_PENDING, ticketStatus: PAYMENT_PENDING
        const savedOrder = db.createOrder({
            orderId,
            userId,
            poolId: pool.id,
            quantity: qty,
            amount: totalAmount,
            selectedNumbers,
            upiReference,
            expiresAt
        });

        res.json({
            success: true,
            orderId: savedOrder.order_id,
            upiReference: upiReference,
            upiUri: upiUri,
            amount: totalAmount,
            currency: 'INR',
            merchantVpa: upiIntentManager.getMerchantVpa(),
            merchantName: upiIntentManager.getMerchantName(),
            poolName: pool.name,
            quantity: qty,
            paymentStatus: savedOrder.payment_status,
            ticketStatus: savedOrder.ticket_status,
            expiresAt: expiresAt
        });
    } catch (error) {
        console.error('Error creating UPI intent order:', error);
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
            message: 'Payment is pending. No ticket issued until genuine bank transaction is verified on server.'
        });
    } catch (err) {
        console.error('Order status query error:', err);
        res.status(500).json({ success: false, message: 'Server error checking order status' });
    }
});

// 5. Server-Side Payment Verification (No Faking)
router.post('/payments/verify', async (req, res) => {
    try {
        const { orderId } = req.body;

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

        // Query genuine merchant / banking transaction status
        const queryResult = await upiIntentManager.queryTransactionStatus({
            orderId: order.order_id,
            upiReference: order.upi_reference,
            amount: order.amount
        });

        if (!queryResult.verified) {
            return res.json({
                success: false,
                paymentStatus: 'PAYMENT_PENDING',
                ticketStatus: 'NOT_CONFIRMED',
                message: queryResult.message || 'Payment not confirmed on banking rail. Ticket cannot be issued without verified transaction.'
            });
        }

        // If genuine bank status confirms payment: issue tickets
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
            upiReference: order.upi_reference,
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

// 6. Merchant / Bank Webhook Listener (Authentic Server Confirmation Rail)
router.post('/payments/webhook', (req, res) => {
    try {
        const signature = req.headers['x-upi-signature'] || req.headers['x-webhook-signature'];
        const rawBody = req.rawBody;

        if (upiIntentManager.isOfficialMerchantApiConfigured() && signature && rawBody) {
            const isValid = upiIntentManager.verifyMerchantWebhookSignature(rawBody, signature);
            if (!isValid) {
                return res.status(400).send('Invalid signature');
            }
        }

        const { orderId, upiReference, amount, status } = req.body;
        const targetOrder = orderId ? db.getOrderById(orderId) : (upiReference ? db.getOrderByUpiRef(upiReference) : null);

        if (!targetOrder) {
            return res.status(200).json({ status: 'order_not_found' });
        }

        if (status === 'SUCCESS' || status === 'PAID') {
            if (Number(amount) < Number(targetOrder.amount)) {
                console.warn(`Amount mismatch for order ${targetOrder.order_id}: expected ${targetOrder.amount}, received ${amount}`);
                db.updateOrderStatus(targetOrder.order_id, 'FAILED', 'NOT_CONFIRMED');
                return res.status(400).json({ status: 'amount_mismatch' });
            }

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
                upiReference: upiReference || targetOrder.upi_reference,
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
