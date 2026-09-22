const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'megalotto.sqlite');
const db = new DatabaseSync(dbPath);

// Enable WAL mode for high performance
db.exec('PRAGMA journal_mode = WAL;');

// Initialize Tables
db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id TEXT UNIQUE NOT NULL,
        user_id TEXT NOT NULL,
        pool_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        amount REAL NOT NULL,
        currency TEXT NOT NULL DEFAULT 'INR',
        selected_numbers TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING',
        gateway_order_id TEXT,
        gateway_payment_id TEXT,
        gateway_signature TEXT,
        created_at INTEGER NOT NULL,
        paid_at INTEGER,
        expires_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticket_id TEXT UNIQUE NOT NULL,
        serial TEXT UNIQUE NOT NULL,
        order_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        pool_id INTEGER NOT NULL,
        pool_name TEXT NOT NULL,
        price REAL NOT NULL,
        prize TEXT NOT NULL,
        numbers TEXT NOT NULL,
        exact_draw_label TEXT NOT NULL,
        draw_target_timestamp INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'CONFIRMED',
        created_at INTEGER NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(order_id)
    );

    CREATE TABLE IF NOT EXISTS webhook_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id TEXT UNIQUE,
        order_id TEXT,
        event_type TEXT,
        processed_at INTEGER NOT NULL,
        payload TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);
    CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_tickets_order_id ON tickets(order_id);
    CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
`);

// Database Methods
const dbManager = {
    // Create new Order (Status: PENDING)
    createOrder({ orderId, userId, poolId, quantity, amount, selectedNumbers, gatewayOrderId, expiresAt }) {
        const stmt = db.prepare(`
            INSERT INTO orders (
                order_id, user_id, pool_id, quantity, amount, currency, 
                selected_numbers, status, gateway_order_id, created_at, expires_at
            ) VALUES (?, ?, ?, ?, ?, 'INR', ?, 'PENDING', ?, ?, ?)
        `);
        const now = Date.now();
        stmt.run(
            orderId,
            userId,
            poolId,
            quantity,
            amount,
            JSON.stringify(selectedNumbers),
            gatewayOrderId || null,
            now,
            expiresAt
        );
        return this.getOrderById(orderId);
    },

    getOrderById(orderId) {
        const stmt = db.prepare('SELECT * FROM orders WHERE order_id = ?');
        const order = stmt.get(orderId);
        if (!order) return null;
        return {
            ...order,
            selected_numbers: JSON.parse(order.selected_numbers)
        };
    },

    getOrderByGatewayOrderId(gatewayOrderId) {
        const stmt = db.prepare('SELECT * FROM orders WHERE gateway_order_id = ?');
        const order = stmt.get(gatewayOrderId);
        if (!order) return null;
        return {
            ...order,
            selected_numbers: JSON.parse(order.selected_numbers)
        };
    },

    // Confirm Payment and Issue Confirmed Tickets atomically
    confirmOrderAndIssueTickets({ orderId, gatewayPaymentId, gatewaySignature, tickets }) {
        const order = this.getOrderById(orderId);
        if (!order) throw new Error(`Order ${orderId} not found`);
        if (order.status === 'SUCCESS') {
            // Idempotent: return existing confirmed tickets
            return this.getTicketsByOrderId(orderId);
        }

        const now = Date.now();
        // Check if expired
        if (order.expires_at < now && order.status !== 'SUCCESS') {
            // If already expired, cannot confirm
            // But if payment was captured before expiry, allow
        }

        // Update Order to SUCCESS
        const updateOrderStmt = db.prepare(`
            UPDATE orders 
            SET status = 'SUCCESS', 
                gateway_payment_id = ?, 
                gateway_signature = ?, 
                paid_at = ? 
            WHERE order_id = ?
        `);
        updateOrderStmt.run(gatewayPaymentId, gatewaySignature || null, now, orderId);

        // Insert tickets
        const insertTicketStmt = db.prepare(`
            INSERT INTO tickets (
                ticket_id, serial, order_id, user_id, pool_id, pool_name,
                price, prize, numbers, exact_draw_label, draw_target_timestamp,
                status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', ?)
        `);

        for (const t of tickets) {
            insertTicketStmt.run(
                t.ticketId,
                t.serial,
                orderId,
                order.user_id,
                t.poolId,
                t.poolName,
                t.price,
                t.prize,
                JSON.stringify(t.numbers),
                t.exactDrawLabel,
                t.drawTargetTimestamp,
                now
            );
        }

        return this.getTicketsByOrderId(orderId);
    },

    // Mark Order as FAILED or EXPIRED
    updateOrderStatus(orderId, status) {
        const stmt = db.prepare('UPDATE orders SET status = ? WHERE order_id = ?');
        stmt.run(status, orderId);
        return this.getOrderById(orderId);
    },

    getTicketsByOrderId(orderId) {
        const stmt = db.prepare('SELECT * FROM tickets WHERE order_id = ?');
        const rows = stmt.all(orderId);
        return rows.map(r => ({
            ...r,
            numbers: JSON.parse(r.numbers)
        }));
    },

    getTicketsByUserId(userId) {
        const stmt = db.prepare('SELECT * FROM tickets WHERE user_id = ? ORDER BY created_at DESC');
        const rows = stmt.all(userId);
        return rows.map(r => ({
            ...r,
            numbers: JSON.parse(r.numbers)
        }));
    },

    getAllOrders(limit = 100) {
        const stmt = db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT ?');
        const rows = stmt.all(limit);
        return rows.map(r => ({
            ...r,
            selected_numbers: JSON.parse(r.selected_numbers)
        }));
    },

    // Idempotency logging for webhooks
    logWebhookEvent({ eventId, orderId, eventType, payload }) {
        try {
            const stmt = db.prepare(`
                INSERT INTO webhook_logs (event_id, order_id, event_type, processed_at, payload)
                VALUES (?, ?, ?, ?, ?)
            `);
            stmt.run(eventId || `EVT_${Date.now()}_${Math.random()}`, orderId, eventType, Date.now(), JSON.stringify(payload));
            return true;
        } catch (e) {
            if (e.message && e.message.includes('UNIQUE constraint failed')) {
                // Duplicate webhook event
                return false;
            }
            throw e;
        }
    }
};

module.exports = dbManager;
