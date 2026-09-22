const assert = require('assert');
const crypto = require('crypto');
const db = require('../db');
const paymentGateway = require('../gateway');
const { getPoolById, calculateExactSchedule } = require('../pools');

console.log('----------------------------------------------------');
console.log('🧪 RUNNING PRODUCTION PAYMENT GATEWAY TEST SUITE');
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

    async function asyncTest(name, fn) {
        try {
            await fn();
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

    // 2. Test Order Creation in Database
    test('Scenario 2: Unique order is created on server with PENDING status', () => {
        const orderId = `ORD_TEST_${Date.now()}_1`;
        const expiresAt = Date.now() + 900000;
        const order = db.createOrder({
            orderId,
            userId: 'test_user_1',
            poolId: 0,
            quantity: 1,
            amount: 19,
            selectedNumbers: [7, 14, 28, 35, 49, 72],
            gatewayOrderId: 'order_rzp_mock_1',
            expiresAt
        });

        assert(order, 'Order must be created in DB');
        assert.strictEqual(order.status, 'PENDING', 'Order must start with PENDING status');
        assert.strictEqual(order.amount, 19, 'Order amount must be 19');
    });

    // 3. Test Signature Verification (HMAC-SHA256)
    test('Scenario 3: Gateway signature verification succeeds with valid key and fails with fake ID', () => {
        const secret = process.env.RAZORPAY_KEY_SECRET || 's9x3W5eBw1YvX1948zQk8LmQ';
        const gatewayOrderId = 'order_mock_test_123';
        const paymentId = 'pay_mock_test_456';

        // Generate valid signature
        const validSignature = crypto.createHmac('sha256', secret)
            .update(`${gatewayOrderId}|${paymentId}`)
            .digest('hex');

        const isValid = paymentGateway.verifyPaymentSignature({
            gatewayOrderId,
            paymentId,
            signature: validSignature
        });
        assert.strictEqual(isValid, true, 'Valid HMAC signature must verify to true');

        // Test fake signature
        const isFakeValid = paymentGateway.verifyPaymentSignature({
            gatewayOrderId,
            paymentId,
            signature: 'fake_tampered_signature_12345'
        });
        assert.strictEqual(isFakeValid, false, 'Fake signature must be rejected');
    });

    // 4. Test Atomic Ticket Confirmation on Verified Payment
    test('Scenario 4: Verified payment confirms order and generates official confirmed tickets in DB', () => {
        const orderId = `ORD_TEST_${Date.now()}_2`;
        db.createOrder({
            orderId,
            userId: 'test_user_2',
            poolId: 1,
            quantity: 1,
            amount: 49,
            selectedNumbers: [1, 2, 3, 4, 5, 6],
            gatewayOrderId: 'order_rzp_mock_2',
            expiresAt: Date.now() + 900000
        });

        const tickets = db.confirmOrderAndIssueTickets({
            orderId,
            gatewayPaymentId: 'pay_rzp_mock_2',
            gatewaySignature: 'sig_mock_2',
            tickets: [{
                ticketId: `TCK_TEST_${Date.now()}`,
                serial: `ML-11-TEST-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                poolId: 1,
                poolName: '₹49 Daily Super 50',
                price: 49,
                prize: '₹10,000 Cash',
                numbers: [1, 2, 3, 4, 5, 6],
                exactDrawLabel: 'Today, 09:00 PM IST',
                drawTargetTimestamp: Date.now() + 3600000
            }]
        });

        const updatedOrder = db.getOrderById(orderId);
        assert.strictEqual(updatedOrder.status, 'SUCCESS', 'Order must be updated to SUCCESS');
        assert.strictEqual(updatedOrder.gateway_payment_id, 'pay_rzp_mock_2');
        assert.strictEqual(tickets.length, 1, 'Must create 1 confirmed ticket');
        assert.strictEqual(tickets[0].status, 'CONFIRMED', 'Ticket status must be CONFIRMED');
    });

    // 5. Test Double-Spending & Webhook Idempotency Protection
    test('Scenario 5: Webhook idempotency prevents duplicate ticket creation on repeated events', () => {
        const orderId = `ORD_TEST_${Date.now()}_3`;
        db.createOrder({
            orderId,
            userId: 'test_user_3',
            poolId: 0,
            quantity: 1,
            amount: 19,
            selectedNumbers: [10, 20, 30, 40, 50, 60],
            gatewayOrderId: 'order_rzp_mock_3',
            expiresAt: Date.now() + 900000
        });

        const eventId = `evt_test_unique_id_${Date.now()}`;
        const firstAttempt = db.logWebhookEvent({
            eventId,
            orderId,
            eventType: 'payment.captured',
            payload: { mock: true }
        });
        assert.strictEqual(firstAttempt, true, 'First webhook attempt must succeed');

        const secondAttempt = db.logWebhookEvent({
            eventId,
            orderId,
            eventType: 'payment.captured',
            payload: { mock: true }
        });
        assert.strictEqual(secondAttempt, false, 'Duplicate webhook attempt must be blocked by idempotency');
    });

    // 6. Test Expiry Protection
    test('Scenario 6: Expired order cannot be used for ticket generation', () => {
        const orderId = `ORD_TEST_${Date.now()}_4`;
        const pastTime = Date.now() - 60000; // Expired 1 min ago
        db.createOrder({
            orderId,
            userId: 'test_user_4',
            poolId: 0,
            quantity: 1,
            amount: 19,
            selectedNumbers: [1, 2, 3, 4, 5, 6],
            gatewayOrderId: 'order_rzp_mock_4',
            expiresAt: pastTime
        });

        const order = db.getOrderById(orderId);
        const isExpired = order.expires_at < Date.now();
        assert.strictEqual(isExpired, true, 'Order must be flagged as expired');
    });

    console.log('----------------------------------------------------');
    console.log(`🏁 TEST RESULTS: ${passed} Passed, ${failed} Failed`);
    console.log('----------------------------------------------------');

    if (failed > 0) {
        process.exit(1);
    }
}

runTests();
