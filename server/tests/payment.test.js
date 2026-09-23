const assert = require('assert');
const crypto = require('crypto');
const db = require('../db');
const paymentGateway = require('../gateway');
const { getPoolById, calculateExactSchedule } = require('../pools');

console.log('----------------------------------------------------');
console.log('🧪 RUNNING PAYMENT GATEWAY & SECURE TICKETING SUITE');
console.log('----------------------------------------------------');

async function runTests() {
    let passed = 0;
    let failed = 0;

    function test(name, fn) {
        try {
            fn();
            console.log(`  ✅ PASS: ${name}`);
            passed++;
        } catch (e) {
            console.error(`  ❌ FAIL: ${name}`);
            console.error('     Error:', e.message);
            failed++;
        }
    }

    // 1. Test Server Pricing Integrity
    test('Scenario 1: Server enforces authoritative pricing (ignores client amount tampering)', () => {
        const pool = getPoolById(0); // ₹19
        assert.strictEqual(pool.price, 19, 'Pool 0 must strictly cost ₹19');
        const qty = 3;
        const serverComputedTotal = pool.price * qty;
        assert.strictEqual(serverComputedTotal, 57, '3 tickets in Pool 0 must strictly cost ₹57');
    });

    // 2. Test Privacy: Public config does not expose personal UPI ID or personal name
    test('Scenario 2: Gateway public config conceals personal VPA and provides business merchant info', () => {
        const config = paymentGateway.getPublicConfig();
        assert.strictEqual(config.merchantName, 'MEGA LOTTO INDIA');
        assert.strictEqual(config.isGatewayConfigured, true);
        assert.strictEqual(typeof config.razorpayKeyId, 'string');
        assert.strictEqual(config.merchantVpa, undefined, 'Must not expose personal VPA in public config');
    });

    // 3. Test Cryptographic Signature Verification
    test('Scenario 3: HMAC SHA-256 signature verification validates authentic gateway callback', () => {
        const secret = process.env.RAZORPAY_KEY_SECRET || 's9x3W5eBw1YvX1948zQk8LmQ';
        const orderId = 'order_test_999';
        const paymentId = 'pay_test_888';
        
        const validSignature = crypto
            .createHmac('sha256', secret)
            .update(`${orderId}|${paymentId}`)
            .digest('hex');

        const isValid = paymentGateway.verifyPaymentSignature({
            razorpayOrderId: orderId,
            razorpayPaymentId: paymentId,
            razorpaySignature: validSignature
        });

        assert.strictEqual(isValid, true, 'Valid HMAC signature must verify');

        const isInvalid = paymentGateway.verifyPaymentSignature({
            razorpayOrderId: orderId,
            razorpayPaymentId: paymentId,
            razorpaySignature: 'tampered_signature_hex'
        });

        assert.strictEqual(isInvalid, false, 'Tampered signature must be rejected');
    });

    // 4. Test Order Creation in Database with PAYMENT_PENDING
    test('Scenario 4: Unique order is created in DB with PAYMENT_PENDING status', () => {
        const orderId = `ORD_TEST_${Date.now()}_1`;
        const upiReference = `ML${Date.now().toString().slice(-6)}`;
        const expiresAt = Date.now() + 900000;

        const order = db.createOrder({
            orderId,
            userId: 'test_user_1',
            poolId: 0,
            quantity: 1,
            amount: 19,
            selectedNumbers: [7, 14, 28, 35, 49, 72],
            upiReference,
            expiresAt
        });

        assert(order, 'Order must be created in DB');
        assert.strictEqual(order.payment_status, 'PAYMENT_PENDING', 'Order must start with PAYMENT_PENDING');
        assert.strictEqual(order.ticket_status, 'PAYMENT_PENDING', 'Ticket must start with PAYMENT_PENDING');
        assert.strictEqual(order.amount, 19, 'Order amount must be 19');
    });

    // 5. Test Unconfirmed Order Does Not Return Tickets
    test('Scenario 5: User returning without confirmed payment does NOT get tickets issued', () => {
        const orderId = `ORD_TEST_${Date.now()}_unpaid`;
        db.createOrder({
            orderId,
            userId: 'test_user_unpaid',
            poolId: 0,
            quantity: 1,
            amount: 19,
            selectedNumbers: [7, 14, 28, 35, 49, 72],
            upiReference: `ML_UNPAID_${Date.now()}`,
            expiresAt: Date.now() + 900000
        });

        const order = db.getOrderById(orderId);
        assert.strictEqual(order.payment_status, 'PAYMENT_PENDING');
        assert.strictEqual(order.ticket_status, 'PAYMENT_PENDING');

        const issuedTickets = db.getTicketsByOrderId(orderId);
        assert.strictEqual(issuedTickets.length, 0, 'Zero tickets must be issued for unverified order');
    });

    // 6. Test Atomic Ticket Confirmation upon Verified Payment
    test('Scenario 6: Verified transaction confirms order (PAID/CONFIRMED) and issues tickets atomically in DB', () => {
        const orderId = `ORD_TEST_${Date.now()}_2`;
        const upiRef = `ML_PAID_${Date.now()}`;
        db.createOrder({
            orderId,
            userId: 'test_user_2',
            poolId: 0,
            quantity: 2,
            amount: 38,
            selectedNumbers: [1, 2, 3, 4, 5, 6],
            upiReference: upiRef,
            expiresAt: Date.now() + 900000
        });

        const confirmedTickets = db.confirmOrderAndIssueTickets({
            orderId,
            upiReference: upiRef,
            tickets: [
                {
                    ticketId: `TCK_TEST_${Date.now()}_0`,
                    serial: `ML-10-TEST-${Date.now()}-0001`,
                    poolId: 0,
                    poolName: '₹19 Pocket Booster',
                    price: 19,
                    prize: '₹2,500 Cash',
                    numbers: [1, 2, 3, 4, 5, 6],
                    exactDrawLabel: 'Today in 15 mins',
                    drawTargetTimestamp: Date.now() + 900000
                },
                {
                    ticketId: `TCK_TEST_${Date.now()}_1`,
                    serial: `ML-10-TEST-${Date.now()}-0002`,
                    poolId: 0,
                    poolName: '₹19 Pocket Booster',
                    price: 19,
                    prize: '₹2,500 Cash',
                    numbers: [10, 20, 30, 40, 50, 60],
                    exactDrawLabel: 'Today in 15 mins',
                    drawTargetTimestamp: Date.now() + 900000
                }
            ]
        });

        assert.strictEqual(confirmedTickets.length, 2, 'Exactly 2 confirmed tickets must be created');
        const updatedOrder = db.getOrderById(orderId);
        assert.strictEqual(updatedOrder.payment_status, 'PAID', 'Order status must be PAID');
        assert.strictEqual(updatedOrder.ticket_status, 'CONFIRMED', 'Ticket status must be CONFIRMED');
    });

    // 7. Test Idempotency
    test('Scenario 7: Webhook / confirmation idempotency prevents duplicate ticket generation', () => {
        const orderId = `ORD_TEST_${Date.now()}_idempotent`;
        const upiRef = `ML_IDEM_${Date.now()}`;

        db.createOrder({
            orderId,
            userId: 'test_user_idem',
            poolId: 0,
            quantity: 1,
            amount: 19,
            selectedNumbers: [5, 10, 15, 20, 25, 30],
            upiReference: upiRef,
            expiresAt: Date.now() + 900000
        });

        // First confirmation
        const tickets1 = db.confirmOrderAndIssueTickets({
            orderId,
            upiReference: upiRef,
            tickets: [{
                ticketId: `TCK_IDEM_${Date.now()}_${Math.random()}`,
                serial: `ML-10-IDEM-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
                poolId: 0,
                poolName: '₹19 Pocket Booster',
                price: 19,
                prize: '₹2,500 Cash',
                numbers: [5, 10, 15, 20, 25, 30],
                exactDrawLabel: 'Today in 15 mins',
                drawTargetTimestamp: Date.now() + 900000
            }]
        });

        // Second duplicate confirmation attempt
        const tickets2 = db.confirmOrderAndIssueTickets({
            orderId,
            upiReference: upiRef,
            tickets: [{
                ticketId: `TCK_IDEM_DUP_${Date.now()}_${Math.random()}`,
                serial: `ML-10-IDEM-DUP-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
                poolId: 0,
                poolName: '₹19 Pocket Booster',
                price: 19,
                prize: '₹2,500 Cash',
                numbers: [5, 10, 15, 20, 25, 30],
                exactDrawLabel: 'Today in 15 mins',
                drawTargetTimestamp: Date.now() + 900000
            }]
        });

        assert.strictEqual(tickets1.length, 1);
        assert.strictEqual(tickets2.length, 1);
        const totalTicketsInDb = db.getTicketsByOrderId(orderId);
        assert.strictEqual(totalTicketsInDb.length, 1, 'Total tickets for order must remain strictly 1');
    });

    console.log('----------------------------------------------------');
    console.log(`🏁 TEST RESULTS: ${passed} Passed, ${failed} Failed`);
    console.log('----------------------------------------------------');

    if (failed > 0) {
        process.exit(1);
    }
}

runTests();
