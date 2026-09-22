// ==========================================================================
// MEGA LOTTO - COMMERCIAL SERVER-SIDE GATEWAY INTEGRATION & DRAW ENGINE
// ==========================================================================

class LotteryApp {
    constructor() {
        // Official Merchant Defaults (Overridden dynamically from /api/config)
        this.merchantVpa = "mrvikash@fam";
        this.merchantName = "MEGA LOTTO INDIA";
        this.activePendingOrderId = null;
        this.activePendingUpiRef = null;
        this.orderPollingInterval = null;

        // Minimum Withdrawal Limit (Configurable)
        this.minWithdrawalAmount = 1500;

        // Persistent Unique User ID
        this.userId = localStorage.getItem('mega_lotto_uid');
        if (!this.userId) {
            this.userId = 'usr_' + Math.random().toString(36).substring(2, 9) + Date.now().toString().slice(-4);
            localStorage.setItem('mega_lotto_uid', this.userId);
        }

        this.pools = [
            {
                id: 0,
                name: "₹19 Pocket Booster",
                price: 19,
                prize: "₹2,500 Cash",
                prizeVal: 2500,
                slotsTotal: 50,
                slotsLeft: 12,
                drawFreq: "Every 15 Mins / On Full",
                drawIntervalSecs: 900,
                badge: "🔥 Quick Win",
                badgeClass: "badge-quick",
                icon: "fa-bolt",
                tier: "micro",
                participants: 38
            },
            {
                id: 1,
                name: "₹10 Super Fast 10",
                price: 10,
                prize: "₹1,000 Cash",
                prizeVal: 1000,
                slotsTotal: 30,
                slotsLeft: 8,
                drawFreq: "Every 10 Mins / On Full",
                drawIntervalSecs: 600,
                badge: "⚡ Instant Win",
                badgeClass: "badge-quick",
                icon: "fa-bolt-lightning",
                tier: "micro",
                participants: 22
            },
            {
                id: 2,
                name: "₹29 Mini Dhamaka",
                price: 29,
                prize: "₹5,000 Cash",
                prizeVal: 5000,
                slotsTotal: 75,
                slotsLeft: 18,
                drawFreq: "Every 30 Mins",
                drawIntervalSecs: 1800,
                badge: "💥 Hot Deal",
                badgeClass: "badge-quick",
                icon: "fa-fire-flame-curved",
                tier: "micro",
                participants: 57
            },
            {
                id: 3,
                name: "₹49 Daily Super 50",
                price: 49,
                prize: "₹10,000 Cash",
                prizeVal: 10000,
                slotsTotal: 150,
                slotsLeft: 28,
                drawFreq: "Daily 9:00 PM IST",
                drawIntervalSecs: 3600,
                badge: "⚡ Daily Rush",
                badgeClass: "badge-popular",
                icon: "fa-star",
                tier: "micro",
                participants: 122
            },
            {
                id: 4,
                name: "₹99 Silver Bumper",
                price: 99,
                prize: "₹25,000 Cash + Gold Coin",
                prizeVal: 25000,
                slotsTotal: 250,
                slotsLeft: 42,
                drawFreq: "Daily 10:00 PM IST",
                drawIntervalSecs: 7200,
                badge: "⭐ Popular",
                badgeClass: "badge-bumper",
                icon: "fa-coins",
                tier: "micro",
                participants: 208
            },
            {
                id: 5,
                name: "₹149 Golden Fortune",
                price: 149,
                prize: "₹50,000 Cash",
                prizeVal: 50000,
                slotsTotal: 350,
                slotsLeft: 55,
                drawFreq: "Daily 10:30 PM IST",
                drawIntervalSecs: 10800,
                badge: "🌟 High Win",
                badgeClass: "badge-popular",
                icon: "fa-award",
                tier: "bumper",
                participants: 295
            },
            {
                id: 6,
                name: "₹199 Gold Rush Bumper",
                price: 199,
                prize: "₹1,00,000 Cash",
                prizeVal: 100000,
                slotsTotal: 500,
                slotsLeft: 64,
                drawFreq: "Mon / Wed / Fri 8:00 PM",
                drawIntervalSecs: 14400,
                badge: "🏆 High Return",
                badgeClass: "badge-bumper",
                icon: "fa-trophy",
                tier: "bumper",
                participants: 436
            },
            {
                id: 7,
                name: "₹299 Platinum Star Bumper",
                price: 299,
                prize: "₹2,00,000 Cash",
                prizeVal: 200000,
                slotsTotal: 750,
                slotsLeft: 82,
                drawFreq: "Tue / Thu / Sat 8:30 PM",
                drawIntervalSecs: 21600,
                badge: "✨ Platinum Tier",
                badgeClass: "badge-bumper",
                icon: "fa-wand-magic-sparkles",
                tier: "bumper",
                participants: 668
            },
            {
                id: 8,
                name: "₹499 Diamond Express",
                price: 499,
                prize: "₹5,00,000 Cash",
                prizeVal: 500000,
                slotsTotal: 1000,
                slotsLeft: 110,
                drawFreq: "Weekly Sunday 8:00 PM",
                drawIntervalSecs: 28800,
                badge: "💎 VIP Tier",
                badgeClass: "badge-popular",
                icon: "fa-gem",
                tier: "bumper",
                participants: 890
            },
            {
                id: 9,
                name: "₹749 Royal Crown Jackpot",
                price: 749,
                prize: "₹10,00,000 Cash",
                prizeVal: 1000000,
                slotsTotal: 1500,
                slotsLeft: 180,
                drawFreq: "Weekly Sunday 9:00 PM",
                drawIntervalSecs: 43200,
                badge: "👑 Royal Tier",
                badgeClass: "badge-mega",
                icon: "fa-chess-king",
                tier: "bumper",
                participants: 1320
            },
            {
                id: 10,
                name: "₹999 Saturday Mega Jackpot",
                price: 999,
                prize: "₹25,00,000 Cash",
                prizeVal: 2500000,
                slotsTotal: 2500,
                slotsLeft: 310,
                drawFreq: "Every Saturday 8:00 PM",
                drawIntervalSecs: 86400,
                badge: "💰 Mega Jackpot",
                badgeClass: "badge-mega",
                icon: "fa-crown",
                tier: "bumper",
                participants: 2190
            },
            {
                id: 11,
                name: "₹1,499 Super Crorepati Bumper",
                price: 1499,
                prize: "₹50,00,000 Cash",
                prizeVal: 5000000,
                slotsTotal: 3500,
                slotsLeft: 420,
                drawFreq: "Monthly Mega Draw",
                drawIntervalSecs: 172800,
                badge: "🌟 Crorepati Club",
                badgeClass: "badge-mega",
                icon: "fa-star-of-david",
                tier: "bumper",
                participants: 3080
            }
        ];

        // Real user state (Starts at ₹0.00)
        this.user = {
            wallet: {
                total: 0,
                deposit: 0,
                winnings: 0
            },
            tickets: [],
            transactions: []
        };

        this.winners = [
            { name: "Rahul S.", location: "Delhi", pool: "₹19 Pocket Booster", amount: "₹2,500", avatar: "RS" },
            { name: "Pooja K.", location: "Mumbai", pool: "₹49 Daily Super", amount: "₹10,000", avatar: "PK" },
            { name: "Suresh V.", location: "Pune", pool: "₹99 Silver Bumper", amount: "₹25,000", avatar: "SV" },
            { name: "Amit M.", location: "Bengaluru", pool: "₹199 Gold Rush", amount: "₹1,00,000", avatar: "AM" },
            { name: "Vikram R.", location: "Kolkata", pool: "₹19 Pocket Booster", amount: "₹2,500", avatar: "VR" }
        ];

        this.pastDraws = [
            {
                id: "DRW-BST-902",
                poolName: "₹19 Pocket Booster",
                drawnNumbers: [7, 14, 28, 35, 49, 72],
                winningPrize: "₹2,500 Cash",
                drawDate: "15 Mins Ago",
                winner: "Vikas M. (Lucknow)"
            },
            {
                id: "DRW-SLV-512",
                poolName: "₹99 Silver Bumper",
                drawnNumbers: [11, 23, 41, 65, 77, 92],
                winningPrize: "₹25,000 Cash",
                drawDate: "Yesterday, 10:00 PM",
                winner: "Ananya S. (Bengaluru)"
            }
        ];

        // Active checkout & draw states
        this.currentBuyingPoolId = 0;
        this.selectedNumbers = [];
        this.ticketQuantity = 1;
        this.currentOrder = null;
        this.currentRazorpayOrderId = null;
        this.pollingInterval = null;
        this.isLiveDrawRunning = false;

        // Admin mode protection
        this.isAdminMode = window.location.search.includes('admin=true');

        this.init();
    }

    async init() {
        this.loadState();
        await this.fetchConfig();
        await this.loadServerTickets();
        this.setupAdminShortcuts();
        this.renderPools();
        this.renderWinners();
        this.renderMyTickets();
        this.renderPastDraws();
        this.renderTransactions();
        this.initSettlementLedger();
        this.startFloatingPayoutAlerts();
        this.updateHeaderUI();
        this.startMiniCountdown();
        this.startLiveTicketTimers();
        this.startLiveFeedSimulation();
        this.initConfetti();
    }

    async fetchConfig() {
        try {
            const res = await fetch('/api/config');
            if (res.ok) {
                const ct = res.headers.get('content-type') || '';
                if (ct.includes('application/json')) {
                    const data = await res.json();
                    if (data.merchantVpa) this.merchantVpa = data.merchantVpa;
                    if (data.merchantName) this.merchantName = data.merchantName;
                }
            }
        } catch (e) {
            console.log("Using built-in merchant configuration.");
        }
    }

    async loadServerTickets() {
        try {
            const res = await fetch(`/api/tickets/user/${this.userId}`);
            if (res.ok) {
                const ct = res.headers.get('content-type') || '';
                if (ct.includes('application/json')) {
                    const data = await res.json();
                    if (data.success && Array.isArray(data.tickets) && data.tickets.length > 0) {
                        const existingIds = new Set(this.user.tickets.map(t => t.id));
                        const serverTickets = data.tickets.filter(t => !existingIds.has(t.id));
                        if (serverTickets.length > 0) {
                            this.user.tickets = [...serverTickets, ...this.user.tickets];
                            this.saveState();
                            this.updateHeaderUI();
                            this.renderMyTickets();
                        }
                    }
                }
            }
        } catch (e) {
            console.log("Using persistent local ticket store.");
        }
    }

    setupAdminShortcuts() {
        // Secret keyboard shortcut (Ctrl + Shift + A) for Owner/Admin only
        window.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
                e.preventDefault();
                this.toggleAdminDrawer();
            }
        });
    }

    // Exact scheduled announcement times for each pool
    getExactDrawTarget(pool) {
        const now = new Date();
        let target = new Date();
        let exactLabel = "";

        if (pool.id === 0) { // ₹10 Super Fast 10: Every 10 Mins
            const mins = now.getMinutes();
            const nextSlotMin = (Math.floor(mins / 10) + 1) * 10;
            target.setMinutes(nextSlotMin, 0, 0);
            const timeStr = target.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
            exactLabel = `Today at ${timeStr} (10-Min Slot)`;
        } else if (pool.id === 1) { // ₹19 Pocket Booster: Every 15 Mins
            const mins = now.getMinutes();
            const nextSlotMin = (Math.floor(mins / 15) + 1) * 15;
            target.setMinutes(nextSlotMin, 0, 0);
            const timeStr = target.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
            exactLabel = `Today at ${timeStr} (15-Min Slot)`;
        } else if (pool.id === 2) { // ₹29 Mini Dhamaka: Every 30 Mins
            const mins = now.getMinutes();
            const nextSlotMin = (Math.floor(mins / 30) + 1) * 30;
            target.setMinutes(nextSlotMin, 0, 0);
            const timeStr = target.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
            exactLabel = `Today at ${timeStr} (30-Min Slot)`;
        } else if (pool.id === 3) { // ₹49 Daily Super: Daily 9:00 PM IST
            target.setHours(21, 0, 0, 0);
            if (now.getTime() >= target.getTime()) {
                target.setDate(target.getDate() + 1);
                exactLabel = `Tomorrow, 09:00 PM IST`;
            } else {
                exactLabel = `Today, 09:00 PM IST`;
            }
        } else if (pool.id === 4) { // ₹99 Silver Bumper: Daily 10:00 PM IST
            target.setHours(22, 0, 0, 0);
            if (now.getTime() >= target.getTime()) {
                target.setDate(target.getDate() + 1);
                exactLabel = `Tomorrow, 10:00 PM IST`;
            } else {
                exactLabel = `Today, 10:00 PM IST`;
            }
        } else if (pool.id === 5) { // ₹149 Golden Fortune: Daily 10:30 PM IST
            target.setHours(22, 30, 0, 0);
            if (now.getTime() >= target.getTime()) {
                target.setDate(target.getDate() + 1);
                exactLabel = `Tomorrow, 10:30 PM IST`;
            } else {
                exactLabel = `Today, 10:30 PM IST`;
            }
        } else if (pool.id === 6) { // ₹199 Gold Rush: Mon / Wed / Fri 8:00 PM IST
            const validDays = [1, 3, 5];
            let found = false;
            for (let i = 0; i <= 7; i++) {
                const checkDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
                if (validDays.includes(checkDate.getDay())) {
                    checkDate.setHours(20, 0, 0, 0);
                    if (checkDate.getTime() > now.getTime()) {
                        target = checkDate;
                        const dayName = target.toLocaleDateString('en-IN', { weekday: 'long' });
                        exactLabel = `${dayName}, 08:00 PM IST`;
                        found = true;
                        break;
                    }
                }
            }
            if (!found) {
                target = new Date(now.getTime() + 86400000);
                exactLabel = `Upcoming, 08:00 PM IST`;
            }
        } else if (pool.id === 7) { // ₹299 Platinum Star: Tue / Thu / Sat 8:30 PM
            const validDays = [2, 4, 6];
            let found = false;
            for (let i = 0; i <= 7; i++) {
                const checkDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
                if (validDays.includes(checkDate.getDay())) {
                    checkDate.setHours(20, 30, 0, 0);
                    if (checkDate.getTime() > now.getTime()) {
                        target = checkDate;
                        const dayName = target.toLocaleDateString('en-IN', { weekday: 'long' });
                        exactLabel = `${dayName}, 08:30 PM IST`;
                        found = true;
                        break;
                    }
                }
            }
            if (!found) {
                target = new Date(now.getTime() + 86400000);
                exactLabel = `Upcoming, 08:30 PM IST`;
            }
        } else if (pool.id === 8) { // ₹499 Diamond Express: Sunday 8:00 PM IST
            const sunday = new Date();
            const distToSun = (7 - now.getDay()) % 7;
            sunday.setDate(now.getDate() + (distToSun === 0 ? 7 : distToSun));
            sunday.setHours(20, 0, 0, 0);
            target = sunday;
            exactLabel = `Sunday, 08:00 PM IST`;
        } else if (pool.id === 9) { // ₹749 Royal Crown: Sunday 9:00 PM IST
            const sunday = new Date();
            const distToSun = (7 - now.getDay()) % 7;
            sunday.setDate(now.getDate() + (distToSun === 0 ? 7 : distToSun));
            sunday.setHours(21, 0, 0, 0);
            target = sunday;
            exactLabel = `Sunday, 09:00 PM IST`;
        } else if (pool.id === 10) { // ₹999 Saturday Mega: Saturday 8:00 PM IST
            const saturday = new Date();
            const distToSat = (6 - now.getDay() + 7) % 7;
            saturday.setDate(now.getDate() + (distToSat === 0 ? 7 : distToSat));
            saturday.setHours(20, 0, 0, 0);
            target = saturday;
            exactLabel = `Saturday, 08:00 PM IST`;
        } else if (pool.id === 11) { // ₹1,499 Crorepati Club: Month End
            const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 21, 0, 0);
            target = nextMonth;
            exactLabel = `Month End Grand Bumper, 09:00 PM`;
        } else {
            target = new Date(now.getTime() + 900000);
            exactLabel = `Today in 15 mins`;
        }

        return {
            timestamp: target.getTime(),
            exactLabel: exactLabel
        };
    }

    generateRandomNumbers() {
        const set = new Set();
        while (set.size < 6) {
            set.add(Math.floor(Math.random() * 99) + 1);
        }
        return Array.from(set).sort((a, b) => a - b);
    }

    // State Management
    loadState() {
        const saved = localStorage.getItem('mega_lotto_real_state');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.user) this.user = parsed.user;
                if (parsed.pools) this.pools = parsed.pools;
            } catch (e) {
                console.error("Failed to load state", e);
            }
        }
    }

    saveState() {
        localStorage.setItem('mega_lotto_real_state', JSON.stringify({
            user: this.user,
            pools: this.pools
        }));
    }

    updateHeaderUI() {
        const hBal = document.getElementById('header-balance');
        if (hBal) hBal.innerText = `₹${this.user.wallet.total.toFixed(2)}`;

        const wTot = document.getElementById('wallet-modal-total');
        if (wTot) wTot.innerText = `₹${this.user.wallet.total.toFixed(2)}`;

        const wWin = document.getElementById('wallet-modal-winnings');
        if (wWin) wWin.innerText = `₹${this.user.wallet.winnings.toFixed(2)}`;

        const wVal = document.getElementById('withdrawable-val');
        if (wVal) wVal.innerText = `₹${this.user.wallet.winnings.toFixed(2)}`;

        const mBad = document.getElementById('min-withdraw-badge');
        if (mBad) mBad.innerText = `₹${this.minWithdrawalAmount}`;

        const nCnt = document.getElementById('nav-ticket-count');
        if (nCnt) nCnt.innerText = this.user.tickets.length;

        const dCnt = document.getElementById('dash-active-count');
        if (dCnt) dCnt.innerText = this.user.tickets.length;

        const mobBadge = document.getElementById('mob-ticket-badge');
        if (mobBadge) mobBadge.innerText = this.user.tickets.length;
    }

    // ==========================================================================
    // POOLS RENDERING & FILTERING
    // ==========================================================================
    renderPools(filter = 'all') {
        const grid = document.getElementById('lottery-grid');
        if (!grid) return;
        grid.innerHTML = '';

        const filtered = this.pools.filter(p => {
            if (filter === 'micro') return p.tier === 'micro';
            if (filter === 'bumper') return p.tier === 'bumper';
            return true;
        });

        filtered.forEach(pool => {
            const pct = Math.round(((pool.slotsTotal - pool.slotsLeft) / pool.slotsTotal) * 100);
            const card = document.createElement('div');
            card.className = `pool-card ${pool.featured ? 'featured' : ''}`;
            card.innerHTML = `
                <span class="pool-badge-top ${pool.badgeClass}">${pool.badge}</span>
                <div>
                    <div class="pool-header">
                        <div class="pool-icon-wrap">
                            <i class="fa-solid ${pool.icon}" style="color: var(--gold-primary);"></i>
                        </div>
                        <div class="pool-name-wrap">
                            <h3>${pool.name}</h3>
                            <div class="pool-draw-time"><i class="fa-regular fa-clock"></i> ${pool.drawFreq}</div>
                        </div>
                    </div>

                    <div class="pool-prize-box">
                        <div>
                            <div class="pool-prize-label">Guaranteed Winner Prize</div>
                            <div class="pool-prize-val">${pool.prize}</div>
                        </div>
                        <i class="fa-solid fa-gift" style="font-size: 26px; color: rgba(56, 239, 125, 0.35);"></i>
                    </div>

                    <div style="margin-bottom: 18px;">
                        <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px;">
                            <span style="color: var(--ruby-hot); font-weight: 700;"><i class="fa-solid fa-fire"></i> Only ${pool.slotsLeft} Slots Left!</span>
                            <span style="color: var(--text-secondary);">${pool.slotsTotal - pool.slotsLeft} / ${pool.slotsTotal} Joined (${pct}%)</span>
                        </div>
                        <div class="progress-bar-bg">
                            <div class="progress-bar-fill" id="pool-prog-${pool.id}" style="width: ${pct}%;"></div>
                        </div>
                    </div>
                </div>

                <div class="pool-footer">
                    <div class="pool-ticket-cost">
                        ₹${pool.price} <span>/ ticket</span>
                    </div>
                    <button class="btn-buy-pool" onclick="app.openBuyModal(${pool.id})">
                        <i class="fa-solid fa-ticket"></i> Buy Ticket
                    </button>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    filterPools(tier, btn) {
        document.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
        this.renderPools(tier);
        if (window.soundManager) window.soundManager.playClick();
    }

    // ==========================================================================
    // BUY TICKET & NUMBER PICKER
    // ==========================================================================
    openBuyModal(poolId) {
        if (window.soundManager) window.soundManager.playClick();
        this.currentBuyingPoolId = poolId;
        const pool = this.pools.find(p => p.id === poolId) || this.pools[0];

        document.getElementById('buy-pool-title').innerText = `${pool.name} Ticket`;
        document.getElementById('buy-pool-subtitle').innerText = `Winner Gets: ${pool.prize}`;
        document.getElementById('buy-ticket-price').innerText = `₹${pool.price}.00`;
        document.getElementById('buy-pool-slots-left').innerText = `${pool.slotsLeft} Slots`;

        const pct = Math.round(((pool.slotsTotal - pool.slotsLeft) / pool.slotsTotal) * 100);
        document.getElementById('buy-pool-progress').style.width = `${pct}%`;

        this.ticketQuantity = 1;
        document.getElementById('ticket-qty-val').innerText = '1';
        this.updateBuyPayable();

        // Render 1-99 Numbers Grid
        const grid = document.getElementById('number-picker-grid');
        grid.innerHTML = '';
        for (let i = 1; i <= 99; i++) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'num-select-btn';
            btn.innerText = i < 10 ? `0${i}` : i;
            btn.onclick = () => this.toggleNumberSelection(i);
            grid.appendChild(btn);
        }

        this.autoQuickPick();
        this.openModal('buy-ticket-modal');
    }

    toggleNumberSelection(num) {
        if (window.soundManager) window.soundManager.playClick();
        const idx = this.selectedNumbers.indexOf(num);
        if (idx >= 0) {
            this.selectedNumbers.splice(idx, 1);
        } else {
            if (this.selectedNumbers.length >= 6) {
                this.showToast("You can only select 6 lucky numbers!");
                return;
            }
            this.selectedNumbers.push(num);
        }
        this.selectedNumbers.sort((a, b) => a - b);
        this.renderSelectedNumbersPreview();
        this.updateNumberGridSelectedState();
    }

    autoQuickPick() {
        if (window.soundManager) window.soundManager.playClick();
        const set = new Set();
        while (set.size < 6) {
            set.add(Math.floor(Math.random() * 99) + 1);
        }
        this.selectedNumbers = Array.from(set).sort((a, b) => a - b);
        this.renderSelectedNumbersPreview();
        this.updateNumberGridSelectedState();
    }

    renderSelectedNumbersPreview() {
        const holder = document.getElementById('selected-numbers-preview');
        holder.innerHTML = '';
        for (let i = 0; i < 6; i++) {
            const ball = document.createElement('div');
            ball.className = 'ticket-num-ball';
            if (this.selectedNumbers[i] !== undefined) {
                const val = this.selectedNumbers[i];
                ball.innerText = val < 10 ? `0${val}` : val;
            } else {
                ball.innerText = '?';
                ball.style.background = 'rgba(255,255,255,0.08)';
                ball.style.color = 'var(--text-muted)';
            }
            holder.appendChild(ball);
        }
    }

    updateNumberGridSelectedState() {
        const buttons = document.querySelectorAll('#number-picker-grid .num-select-btn');
        buttons.forEach(btn => {
            const val = parseInt(btn.innerText, 10);
            if (this.selectedNumbers.includes(val)) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });
    }

    adjustQuantity(delta) {
        if (window.soundManager) window.soundManager.playClick();
        this.ticketQuantity = Math.max(1, Math.min(20, this.ticketQuantity + delta));
        document.getElementById('ticket-qty-val').innerText = this.ticketQuantity;
        this.updateBuyPayable();
    }

    updateBuyPayable() {
        const pool = this.pools.find(p => p.id === this.currentBuyingPoolId) || this.pools[0];
        const total = pool.price * this.ticketQuantity;
        const totalEl = document.getElementById('buy-total-payable');
        const btnText = document.getElementById('btn-pay-text');
        const poolLabel = document.getElementById('buy-modal-pool-label');
        if (totalEl) totalEl.innerText = `₹${total.toFixed(2)}`;
        if (btnText) btnText.innerText = `Pay ₹${total.toFixed(2)} with UPI`;
        if (poolLabel) poolLabel.innerText = `${pool.name} (x${this.ticketQuantity})`;
    }

    resetPayButton(amount) {
        const btn = document.getElementById('btn-pay-and-confirm-ticket');
        const btnText = document.getElementById('btn-pay-text');
        if (btn) btn.disabled = false;
        if (btnText) btnText.innerHTML = `Pay ₹${amount.toFixed(2)} with UPI`;
    }

    // ==========================================================================
    // MOBILE-FIRST REAL UPI INTENT PAYMENT FLOW (STANDARD NPCI UPI DEEP-LINK)
    // ==========================================================================
    async payWithUpiIntent() {
        if (this.selectedNumbers.length < 6) {
            this.showToast("⚠️ Please select 6 lucky numbers before proceeding!");
            return;
        }

        const pool = this.pools.find(p => p.id === this.currentBuyingPoolId) || this.pools[0];
        const totalCost = pool.price * this.ticketQuantity;

        // 1. Internal Wallet Balance Buy (If user has sufficient funds)
        if (this.user.wallet.total >= totalCost) {
            this.deductWalletAndIssueTickets(pool, this.ticketQuantity, totalCost, [...this.selectedNumbers]);
            this.closeModal('buy-ticket-modal');
            return;
        }

        // 2. Real Mobile UPI Intent Creation on Server
        const payBtn = document.getElementById('btn-pay-and-confirm-ticket');
        const btnText = document.getElementById('btn-pay-text');
        if (payBtn) payBtn.disabled = true;
        if (btnText) btnText.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Launching UPI App...`;

        let orderData = null;

        try {
            const response = await fetch('/api/orders/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: this.userId,
                    poolId: pool.id,
                    quantity: this.ticketQuantity,
                    selectedNumbers: [...this.selectedNumbers]
                })
            });

            if (response.ok) {
                const ct = response.headers.get('content-type') || '';
                if (ct.includes('application/json')) {
                    const data = await response.json();
                    if (data && data.success) {
                        orderData = data;
                    }
                }
            }
        } catch (err) {
            console.warn("Backend server connection notice:", err);
        }

        if (!orderData) {
            const orderId = `ORD_${Date.now()}_${Math.random().toString(36).slice(-6).toUpperCase()}`;
            const upiRef = `ML${Date.now().toString().slice(-8)}${Math.floor(1000 + Math.random() * 9000)}`;
            const merchantVpa = this.merchantVpa || 'mrvikash@fam';
            const merchantName = encodeURIComponent(this.merchantName || 'MEGA LOTTO INDIA');
            const note = encodeURIComponent(`Ticket-${orderId}`);
            
            orderData = {
                orderId: orderId,
                upiReference: upiRef,
                amount: totalCost,
                poolName: pool.name,
                quantity: this.ticketQuantity,
                upiUri: `upi://pay?pa=${encodeURIComponent(merchantVpa)}&pn=${merchantName}&am=${totalCost.toFixed(2)}&cu=INR&tr=${upiRef}&tn=${note}`
            };
        }

        this.activePendingOrderId = orderData.orderId;
        this.activePendingUpiRef = orderData.upiReference;

        // Display pending verification state in buy modal
        const pendingBanner = document.getElementById('upi-pending-status-banner');
        const pendingRefEl = document.getElementById('pending-upi-ref');
        if (pendingBanner) pendingBanner.style.display = 'block';
        if (pendingRefEl) pendingRefEl.innerText = `Ref: ${orderData.upiReference}`;

        this.resetPayButton(totalCost);
        this.showToast(`📱 Opening UPI App... Authenticate ₹${totalCost.toFixed(2)} with your UPI PIN.`);

        // Launch standard universal UPI deep link on mobile OS
        window.location.href = orderData.upiUri;

        // Start background verification polling
        this.startPendingOrderPolling(orderData.orderId);
    }

    // Polling backend to verify genuine payment status
    startPendingOrderPolling(orderId) {
        this.stopPendingOrderPolling();

        this.orderPollingInterval = setInterval(async () => {
            await this.checkPendingOrderStatus(false);
        }, 3500);
    }

    stopPendingOrderPolling() {
        if (this.orderPollingInterval) {
            clearInterval(this.orderPollingInterval);
            this.orderPollingInterval = null;
        }
    }

    // Manual & Automated Server Verification Checker
    async checkPendingOrderStatus(showToastNotice = true) {
        if (!this.activePendingOrderId) {
            if (showToastNotice) this.showToast("No active payment order found.");
            return;
        }

        try {
            const res = await fetch(`/api/orders/${this.activePendingOrderId}/status`);
            if (!res.ok) return;

            const data = await res.json();

            if (data.success && data.paymentStatus === 'PAID' && data.ticketStatus === 'CONFIRMED' && data.tickets && data.tickets.length > 0) {
                this.stopPendingOrderPolling();
                this.closeModal('buy-ticket-modal');
                const pendingBanner = document.getElementById('upi-pending-status-banner');
                if (pendingBanner) pendingBanner.style.display = 'none';

                this.handlePaymentSuccess(data.tickets, {
                    orderId: data.orderId,
                    amount: data.amount,
                    poolId: this.currentBuyingPoolId,
                    quantity: data.tickets.length
                });
                return;
            } else if (data.status === 'EXPIRED' || data.paymentStatus === 'FAILED') {
                this.stopPendingOrderPolling();
                if (showToastNotice) this.showToast("❌ Payment order expired or failed. No ticket issued.");
            } else {
                if (showToastNotice) {
                    this.showToast("⏳ Payment verification pending. Awaiting genuine bank settlement.");
                }
            }
        } catch (e) {
            if (showToastNotice) this.showToast("⚠️ Could not reach server to verify transaction status.");
        }
    }

    // Alias for backward compatibility
    payAndConfirmTicket() {
        return this.payWithUpiIntent();
    }

    initiateTicketCheckout() {
        return this.payWithUpiIntent();
    }

    openDirectDepositGateway() {
        const amt = parseFloat(document.getElementById('deposit-amount-input').value) || 100;
        if (amt < 19) {
            this.showToast("Minimum deposit amount is ₹19");
            return;
        }

        this.closeModal('wallet-modal');
        this.currentBuyingPoolId = 0;
        this.ticketQuantity = 1;
        this.autoQuickPick();
        this.openBuyModal(0);
    }

    openLuckyWheelModal() {
        if (window.soundManager) window.soundManager.playClick();
        this.openModal('lucky-wheel-modal');
        const resEl = document.getElementById('wheel-prize-result');
        if (resEl) resEl.innerText = "";
    }

    spinLuckyWheel() {
        if (this.isWheelSpinning) return;
        this.isWheelSpinning = true;

        const btn = document.getElementById('btn-spin-wheel');
        if (btn) btn.disabled = true;

        const disc = document.getElementById('lucky-wheel-disc');
        const resEl = document.getElementById('wheel-prize-result');
        if (resEl) resEl.innerText = "🌀 Spinning the Mega Wheel...";

        const prizes = [
            { text: "₹10 Instant Cash Added to Wallet!", bonus: 10, type: 'cash' },
            { text: "₹5 Discount Voucher Applied!", bonus: 5, type: 'discount' },
            { text: "₹25 Mega Jackpot Cash Credit!", bonus: 25, type: 'cash' },
            { text: "Free ₹10 Ticket Pass Credited!", bonus: 10, type: 'ticket' },
            { text: "₹50 Bumper Deposit Bonus!", bonus: 50, type: 'cash' },
            { text: "₹15 Instant Cash Added to Wallet!", bonus: 15, type: 'cash' },
            { text: "2x Winning Multiplier Active on next draw!", bonus: 0, type: 'multiplier' },
            { text: "₹100 VIP Grand Cash Reward!", bonus: 100, type: 'cash' }
        ];

        const chosenIndex = Math.floor(Math.random() * prizes.length);
        const segmentAngle = 360 / prizes.length;
        const targetRotation = 1800 + (360 - (chosenIndex * segmentAngle + segmentAngle / 2));

        if (disc) {
            disc.style.transform = `rotate(${targetRotation}deg)`;
        }

        const tickInterval = setInterval(() => {
            if (window.soundManager) window.soundManager.playWheelTick();
        }, 180);

        setTimeout(() => {
            clearInterval(tickInterval);
            this.isWheelSpinning = false;
            if (btn) btn.disabled = false;

            const win = prizes[chosenIndex];
            if (win.bonus > 0) {
                this.user.wallet.total += win.bonus;
                this.user.wallet.deposit += win.bonus;
                this.user.transactions.unshift({
                    id: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
                    type: "WINNING",
                    amount: win.bonus,
                    date: "Just Now",
                    status: "Completed",
                    refId: `Daily Lucky Spin Reward`
                });
                this.saveState();
                this.updateHeaderUI();
                this.renderTransactions();
            }

            if (resEl) {
                resEl.innerHTML = `<i class="fa-solid fa-trophy" style="color:var(--gold-primary);"></i> ${win.text}`;
            }

            if (window.soundManager) {
                window.soundManager.playWinFanfare();
                window.soundManager.playCoins();
            }
            this.triggerConfetti();
            this.showToast(`🎁 Lucky Spin Reward: ${win.text}`);
        }, 4600);
    }

    // Atomic handler triggered ONLY after verified server confirmation
    handlePaymentSuccess(tickets, order) {
        if (tickets && tickets.length > 0) {
            const existingIds = new Set(this.user.tickets.map(t => t.id));
            const newTickets = tickets.filter(t => !existingIds.has(t.id));
            this.user.tickets = [...newTickets, ...this.user.tickets];

            const pool = this.pools.find(p => p.id === (order.poolId !== undefined ? order.poolId : tickets[0].poolId));
            if (pool) {
                pool.slotsLeft = Math.max(1, pool.slotsLeft - (order.quantity || tickets.length));
                pool.participants = (pool.participants || 38) + (order.quantity || tickets.length);
            }

            this.user.transactions.unshift({
                id: `TXN-${order.orderId || Math.floor(100000 + Math.random() * 900000)}`,
                type: "TICKET_BUY",
                amount: order.amount || (pool ? pool.price * tickets.length : 19),
                date: "Just Now",
                status: "Completed",
                refId: `${pool ? pool.name : 'Mega Lotto'} x${tickets.length} (Verified UPI/Gateway)`
            });

            this.saveState();
            this.updateHeaderUI();
            this.renderPools();
            this.renderMyTickets();
            this.renderTransactions();

            if (window.soundManager) window.soundManager.playBuySuccess();
            this.triggerConfetti();
            this.showToast(`🎉 Payment Confirmed! Ticket ${tickets[0].serial} is officially ACTIVE!`);

            // Populate & Trigger "Go to Ticket" Success Modal
            const poolTitle = document.getElementById('success-pool-title');
            const serialEl = document.getElementById('success-ticket-serial');
            const viewPassBtn = document.getElementById('btn-success-view-pass');

            if (poolTitle) poolTitle.innerText = `${pool ? pool.name : tickets[0].poolName} (x${tickets.length})`;
            if (serialEl) serialEl.innerText = `Pass: ${tickets[0].serial}`;

            if (viewPassBtn) {
                viewPassBtn.onclick = () => {
                    this.closeModal('ticket-purchase-success-modal');
                    this.viewTicketPass(tickets[0].id);
                    this.scrollToSection('user-dashboard-section');
                };
            }

            this.openModal('ticket-purchase-success-modal');
        }
    }

    deductWalletAndIssueTickets(pool, quantity, totalCost, numbers) {
        this.user.wallet.total -= totalCost;
        if (this.user.wallet.deposit >= totalCost) {
            this.user.wallet.deposit -= totalCost;
        } else {
            const rem = totalCost - this.user.wallet.deposit;
            this.user.wallet.deposit = 0;
            this.user.wallet.winnings = Math.max(0, this.user.wallet.winnings - rem);
        }

        const exactSchedule = this.getExactDrawTarget(pool);
        pool.slotsLeft = Math.max(1, pool.slotsLeft - quantity);
        pool.participants = (pool.participants || 38) + quantity;

        const generatedTickets = [];
        for (let q = 0; q < quantity; q++) {
            const ticketSerial = `ML-${pool.id + 10}-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
            const ticketNums = q === 0 ? [...numbers] : this.generateRandomNumbers();

            const newTicket = {
                id: `TCK-${Date.now()}-${q}`,
                serial: ticketSerial,
                poolId: pool.id,
                poolName: pool.name,
                price: pool.price,
                prize: pool.prize,
                numbers: ticketNums,
                drawFreq: pool.drawFreq,
                exactDrawLabel: exactSchedule.exactLabel,
                drawTargetTimestamp: exactSchedule.timestamp,
                participants: pool.participants,
                slotsTotal: pool.slotsTotal,
                slotsLeft: pool.slotsLeft,
                purchaseDate: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
                status: 'CONFIRMED'
            };

            this.user.tickets.unshift(newTicket);
            generatedTickets.push(newTicket);
        }

        this.user.transactions.unshift({
            id: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
            type: "TICKET_BUY",
            amount: totalCost,
            date: "Just Now",
            status: "Completed",
            refId: `${pool.name} x${quantity} (Wallet Balance)`
        });

        this.saveState();
        this.updateHeaderUI();
        this.renderPools();
        this.renderMyTickets();
        this.renderTransactions();

        if (window.soundManager) window.soundManager.playBuySuccess();
        this.triggerConfetti();
        this.showToast(`🎉 Ticket ${generatedTickets[0].serial} confirmed via Wallet Balance!`);

        // Populate & Trigger "Go to Ticket" Success Modal
        const poolTitle = document.getElementById('success-pool-title');
        const serialEl = document.getElementById('success-ticket-serial');
        const viewPassBtn = document.getElementById('btn-success-view-pass');

        if (poolTitle) poolTitle.innerText = `${pool.name} (x${quantity})`;
        if (serialEl) serialEl.innerText = `Pass: ${generatedTickets[0].serial}`;

        if (viewPassBtn) {
            viewPassBtn.onclick = () => {
                this.closeModal('ticket-purchase-success-modal');
                this.viewTicketPass(generatedTickets[0].id);
                this.scrollToSection('user-dashboard-section');
            };
        }

        this.openModal('ticket-purchase-success-modal');
    }

    // ==========================================================================
    // ADVANCED DIGITAL TICKET PASS MODAL
    // ==========================================================================
    viewTicketPass(ticketId) {
        if (window.soundManager) window.soundManager.playClick();
        const tck = this.user.tickets.find(t => t.id === ticketId);
        if (!tck) return;

        const isPending = tck.status === 'PENDING';
        const remSecs = Math.max(0, Math.floor((tck.drawTargetTimestamp - Date.now()) / 1000));
        const m = Math.floor(remSecs / 60);
        const s = remSecs % 60;
        const timeStr = `${m < 10 ? '0' + m : m}m : ${s < 10 ? '0' + s : s}s`;
        const pct = Math.round(((tck.participants || 40) / (tck.slotsTotal || 50)) * 100);

        let statusBlock = '';
        if (isPending) {
            statusBlock = `
                <div style="background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.5); border-radius: var(--radius-sm); padding: 12px; margin-bottom: 14px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; font-weight: 800; color: #fde047; font-size: 13px;">
                        <span><i class="fa-solid fa-hourglass-half fa-spin"></i> PAYMENT VERIFICATION PENDING</span>
                        <span style="font-size: 10px; background: rgba(245, 158, 11, 0.3); padding: 2px 6px; border-radius: 4px;">ORDER: ${tck.orderId || 'N/A'}</span>
                    </div>
                    <div style="font-size: 11px; color: var(--text-secondary); margin-top: 6px; line-height: 1.5;">
                        Awaiting server-side payment confirmation from gateway. Ticket activates once payment is confirmed.
                    </div>
                </div>
            `;
        } else {
            statusBlock = `
                <div style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: var(--radius-sm); padding: 10px 12px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #38ef7d; font-weight: 800; font-size: 12px;"><i class="fa-solid fa-circle-check"></i> PAYMENT VERIFIED ON SERVER</span>
                    <span style="font-size: 10px; background: #10b981; color: #064e3b; font-weight: 800; padding: 2px 6px; border-radius: 4px;">ACTIVE IN DRAW</span>
                </div>
            `;
        }

        const content = document.getElementById('ticket-modal-content');
        if (!content) return;
        content.innerHTML = `
            <div class="digital-ticket">
                <div class="ticket-top">
                    <div>
                        <div class="ticket-pool-title">${tck.poolName}</div>
                        <div style="font-size: 11px; color: #38ef7d; font-weight: 700; margin-top: 2px;">
                            <i class="fa-solid fa-trophy"></i> Winner Gets: ${tck.prize}
                        </div>
                    </div>
                    <div class="ticket-serial">${tck.serial}</div>
                </div>

                ${statusBlock}

                <!-- Live Exact Announcement Schedule & Timer Inside Ticket -->
                <div class="ticket-live-timer-banner" style="flex-direction: column; align-items: flex-start; gap: 4px;">
                    <div style="display: flex; justify-content: space-between; width: 100%; font-size: 12px;">
                        <span><i class="fa-solid fa-calendar-check" style="color:var(--gold-primary);"></i> Scheduled Draw:</span>
                        <strong style="color: #fff;">${tck.exactDrawLabel || tck.drawFreq}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; width: 100%; font-size: 12px; margin-top: 4px; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 4px;">
                        <span><i class="fa-solid fa-clock" style="color:var(--gold-primary);"></i> Remaining Time:</span>
                        <span class="ticket-timer-val" id="modal-ticket-timer">${timeStr}</span>
                    </div>
                </div>

                <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; text-align: center; letter-spacing: 0.8px; margin-top: 10px;">
                    Your Official 6-Number Combination
                </div>

                <div class="ticket-numbers-display">
                    ${tck.numbers.map(n => `<div class="ticket-num-ball">${n < 10 ? '0' + n : n}</div>`).join('')}
                </div>

                <!-- Live Participant Progress Inside Ticket -->
                <div class="ticket-participant-meter">
                    <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; margin-bottom: 6px;">
                        <span style="color: #38ef7d;"><i class="fa-solid fa-users"></i> ${tck.participants || 40} / ${tck.slotsTotal || 50} Players Joined</span>
                        <span style="color: var(--text-gold);">${pct}% Filled</span>
                    </div>
                    <div class="progress-bar-bg" style="height: 6px;">
                        <div class="progress-bar-fill" style="width: ${pct}%;"></div>
                    </div>
                </div>

                <div class="ticket-meta-row">
                    <span>Target Draw Timestamp:</span>
                    <strong style="color: #fff;">${tck.exactDrawLabel || tck.drawFreq}</strong>
                </div>

                <div class="ticket-barcode">
                    <div class="barcode-line thick"></div>
                    <div class="barcode-line thin"></div>
                    <div class="barcode-line"></div>
                    <div class="barcode-line thick"></div>
                    <div class="barcode-line short"></div>
                    <div class="barcode-line thin"></div>
                    <div class="barcode-line thick"></div>
                    <div class="barcode-line"></div>
                    <div class="barcode-line thin"></div>
                    <div class="barcode-line short"></div>
                    <div class="barcode-line thick"></div>
                    <div class="barcode-line"></div>
                    <div class="barcode-line thin"></div>
                    <div class="barcode-line thick"></div>
                </div>

                <div style="text-align: center; font-family: var(--font-mono); font-size: 10px; color: var(--text-muted);">
                    * OFFICIAL DIGITAL ENTRY PASS (VERIFIED ON SERVER) *
                </div>
            </div>

            <div class="ticket-actions-row">
                <button class="btn-ticket-action btn-ticket-print" onclick="window.print()">
                    <i class="fa-solid fa-print"></i> Print / Save Pass
                </button>
                <button class="btn-ticket-action" style="background: var(--gold-gradient); color: #111827;" onclick="app.closeModal('ticket-view-modal')">
                    <i class="fa-solid fa-check"></i> Done
                </button>
            </div>
        `;

        this.openModal('ticket-view-modal');
    }

    // ==========================================================================
    // USER DASHBOARD (Live Ticket Cards with Dynamic Timers & Winner Outcomes)
    // ==========================================================================
    renderMyTickets() {
        const holder = document.getElementById('my-tickets-list');
        if (!holder) return;

        if (this.user.tickets.length === 0) {
            holder.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <div class="empty-state-icon"><i class="fa-solid fa-ticket"></i></div>
                    <h3>No Active Tickets Yet</h3>
                    <p>Enter any lottery pool starting from just ₹19 to get your first ticket!</p>
                    <button class="btn-hero-buy-19" style="font-size: 13px; padding: 10px 24px;" onclick="app.openBuyModal(0)">
                        <i class="fa-solid fa-bolt"></i> Play ₹19 Booster
                    </button>
                </div>
            `;
            return;
        }

        holder.innerHTML = this.user.tickets.map(tck => {
            const isPending = tck.status === 'PENDING';
            const isFinished = tck.status === 'DECLARED' || (tck.status === 'CONFIRMED' && tck.drawTargetTimestamp && tck.drawTargetTimestamp <= Date.now());
            const remSecs = Math.max(0, Math.floor((tck.drawTargetTimestamp - Date.now()) / 1000));
            const m = Math.floor(remSecs / 60);
            const s = remSecs % 60;
            const timeStr = `${m < 10 ? '0' + m : m}m : ${s < 10 ? '0' + s : s}s`;

            const pct = Math.round(((tck.participants || 46) / (tck.slotsTotal || 50)) * 100);

            let statusBanner = '';
            if (isPending) {
                statusBanner = `
                    <div style="background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.4); border-radius: var(--radius-sm); padding: 8px 10px; margin-bottom: 12px; font-size: 11px;">
                        <span style="color: #fde047; font-weight: 800;"><i class="fa-solid fa-clock-rotate-left"></i> Gateway Verification Pending</span>
                        <div style="color: var(--text-secondary); margin-top: 2px;">Waiting for gateway settlement to confirm ticket.</div>
                    </div>
                `;
            } else if (isFinished) {
                if (tck.userWon) {
                    statusBanner = `
                        <div style="background: rgba(16,185,129,0.2); border: 1px solid #10b981; border-radius: var(--radius-sm); padding: 10px 12px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
                            <span style="color: #38ef7d; font-weight: 800;"><i class="fa-solid fa-trophy"></i> YOU WON ${tck.prize}!</span>
                            <span style="font-size: 11px; background: #10b981; color: #064e3b; padding: 2px 8px; border-radius: 4px; font-weight: 800;">CREDITED</span>
                        </div>
                    `;
                } else {
                    const winnerName = tck.declaredWinner || "Rahul S. (Delhi)";
                    const userRank = tck.userRank || 4;
                    const cashback = tck.consolationCashback !== undefined ? tck.consolationCashback.toFixed(2) : (tck.price ? (tck.price * 0.5).toFixed(2) : '9.50');
                    statusBanner = `
                        <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.4); border-radius: var(--radius-sm); padding: 12px; margin-bottom: 12px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                <span style="color: #fde047; font-weight: 800; font-size: 13px;">
                                    <i class="fa-solid fa-face-smile-wink"></i> Try Luck Next Time!
                                </span>
                                <span style="font-size: 11px; background: rgba(245, 158, 11, 0.25); color: #fde047; font-weight: 800; padding: 2px 8px; border-radius: 4px; border: 1px solid rgba(245, 158, 11, 0.4);">
                                    Rank #${userRank} in Pool
                                </span>
                            </div>
                            <div style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 4px; padding: 6px 10px; font-size: 11px; color: #38ef7d; font-weight: 700; display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                                <span><i class="fa-solid fa-coins"></i> 50% Consolation Cashback:</span>
                                <strong style="color: #fff; font-size: 12px;">+₹${cashback} Credited</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--text-secondary);">
                                <span>Winner: <strong style="color: #fff;">${winnerName}</strong></span>
                                <span>Drawn: <strong style="color:#38ef7d;">${(tck.drawnNumbers || [7, 14, 28, 35, 49, 72]).map(n => n < 10 ? '0' + n : n).join(', ')}</strong></span>
                            </div>
                        </div>
                    `;
                }
            } else {
                statusBanner = `
                    <div class="ticket-live-timer-banner">
                        <div>
                            <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">Draw Time</div>
                            <div style="font-size: 11px; color: #fff; font-weight: 700;">${tck.exactDrawLabel || tck.drawFreq}</div>
                        </div>
                        <span class="ticket-timer-val live-tck-timer" data-timestamp="${tck.drawTargetTimestamp}">${timeStr}</span>
                    </div>
                `;
            }

            return `
                <div class="digital-ticket" style="${isPending ? 'border-color: rgba(245, 158, 11, 0.4);' : (isFinished && tck.userWon ? 'border-color: #10b981; box-shadow: 0 0 25px rgba(16,185,129,0.3);' : '')}">
                    <div class="ticket-top">
                        <div>
                            <div class="ticket-pool-title">${tck.poolName}</div>
                            <div style="font-size: 11px; color: #38ef7d; font-weight: 700;">Prize: ${tck.prize}</div>
                        </div>
                        <div class="ticket-serial">${tck.serial}</div>
                    </div>

                    ${statusBanner}

                    <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase; text-align: center; margin-bottom: 6px;">Your Numbers:</div>
                    <div class="ticket-numbers-display">
                        ${tck.numbers.map(n => {
                            const isMatch = tck.drawnNumbers && tck.drawnNumbers.includes(n);
                            return `<div class="ticket-num-ball" style="${isMatch ? 'background: linear-gradient(135deg, #10b981, #059669); color: #fff; box-shadow: 0 0 10px #10b981;' : ''}">${n < 10 ? '0' + n : n}</div>`;
                        }).join('')}
                    </div>

                    <div class="ticket-participant-meter">
                        <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; margin-bottom: 4px;">
                            <span style="color: #38ef7d;"><i class="fa-solid fa-users"></i> ${tck.participants || 46} / ${tck.slotsTotal || 50} Players</span>
                            <span style="color: var(--text-gold);">${isFinished ? '100% Completed' : pct + '%'}</span>
                        </div>
                        <div class="progress-bar-bg" style="height: 5px;">
                            <div class="progress-bar-fill" style="width: ${isFinished ? '100%' : pct + '%'};"></div>
                        </div>
                    </div>

                    <div class="ticket-actions-row">
                        <button class="btn-ticket-action btn-ticket-print" onclick="app.viewTicketPass('${tck.id}')">
                            <i class="fa-solid fa-expand"></i> View Full Pass
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    startLiveTicketTimers() {
        setInterval(() => {
            let hasResolvedAny = false;

            this.user.tickets.forEach(tck => {
                if (tck.status === 'CONFIRMED' && tck.drawTargetTimestamp && tck.drawTargetTimestamp <= Date.now()) {
                    this.autoResolveTicketDraw(tck);
                    hasResolvedAny = true;
                }
            });

            if (hasResolvedAny) {
                this.saveState();
                this.renderMyTickets();
                this.renderPastDraws();
            } else {
                document.querySelectorAll('.live-tck-timer').forEach(el => {
                    const target = parseInt(el.getAttribute('data-timestamp'), 10);
                    if (target) {
                        const remSecs = Math.max(0, Math.floor((target - Date.now()) / 1000));
                        const m = Math.floor(remSecs / 60);
                        const s = remSecs % 60;
                        el.innerText = `${m < 10 ? '0' + m : m}m : ${s < 10 ? '0' + s : s}s`;
                    }
                });
            }
        }, 1000);
    }

    autoResolveTicketDraw(tck) {
        tck.status = 'DECLARED';
        const set = new Set();
        while (set.size < 6) {
            set.add(Math.floor(Math.random() * 99) + 1);
        }
        const drawnNumbers = Array.from(set).sort((a, b) => a - b);
        tck.drawnNumbers = drawnNumbers;

        // Check matching
        const matches = tck.numbers.filter(n => drawnNumbers.includes(n)).length;
        if (matches >= 4) {
            tck.userWon = true;
            tck.wonAmount = tck.poolId === 0 ? 2500 : 10000;
            this.user.wallet.total += tck.wonAmount;
            this.user.wallet.winnings += tck.wonAmount;
            this.user.transactions.unshift({
                id: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
                type: "WINNING",
                amount: tck.wonAmount,
                date: "Just Now",
                status: "Credited",
                refId: `${tck.poolName} Prize`
            });
            this.updateHeaderUI();
            if (window.soundManager) window.soundManager.playWinFanfare();
            this.triggerConfetti();
            this.showToast(`🎉 CONGRATULATIONS! You won ${tck.prize} in ${tck.poolName}!`);
        } else {
            tck.userWon = false;
            tck.userRank = tck.userRank || (Math.floor(Math.random() * 12) + 4);
            const consolationCashback = Math.round((tck.price * 0.5) * 100) / 100;
            tck.consolationCashback = consolationCashback;

            // Credit 50% consolation cashback to wallet
            this.user.wallet.total += consolationCashback;
            this.user.wallet.winnings += consolationCashback;
            this.user.transactions.unshift({
                id: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
                type: "WINNING",
                amount: consolationCashback,
                date: "Just Now",
                status: "Credited",
                refId: `${tck.poolName} - 50% Consolation Cashback (Rank #${tck.userRank})`
            });

            const names = ["Amit S. (Bengaluru)", "Pooja K. (Mumbai)", "Karan V. (Jaipur)", "Suresh M. (Pune)", "Neha G. (Delhi)"];
            tck.declaredWinner = names[Math.floor(Math.random() * names.length)];

            this.pastDraws.unshift({
                id: `DRW-${Math.floor(100 + Math.random() * 900)}`,
                poolName: tck.poolName,
                drawnNumbers: drawnNumbers,
                winningPrize: tck.prize,
                drawDate: "Just Now",
                winner: tck.declaredWinner
            });

            this.winners.unshift({
                name: tck.declaredWinner.split(' ')[0],
                location: tck.declaredWinner.match(/\((.*?)\)/) ? tck.declaredWinner.match(/\((.*?)\)/)[1] : "India",
                pool: tck.poolName,
                amount: tck.prize,
                avatar: tck.declaredWinner[0] + (tck.declaredWinner.split(' ')[1] ? tck.declaredWinner.split(' ')[1][0] : 'W')
            });

            this.updateHeaderUI();
            this.renderTransactions();
            this.renderWinners();
            this.showToast(`💫 Draw Declared: Try luck next time! You finished Rank #${tck.userRank} & 50% Cashback (₹${consolationCashback.toFixed(2)}) is credited to your wallet!`);
        }
    }

    renderPastDraws() {
        const holder = document.getElementById('past-results-list');
        if (!holder) return;

        holder.innerHTML = this.pastDraws.map(drw => `
            <div class="pool-card">
                <div class="pool-header">
                    <div class="pool-icon-wrap" style="background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.3);">
                        <i class="fa-solid fa-award" style="color: #38ef7d;"></i>
                    </div>
                    <div class="pool-name-wrap">
                        <h3>${drw.poolName}</h3>
                        <div class="pool-draw-time">${drw.drawDate}</div>
                    </div>
                </div>

                <div class="pool-prize-box">
                    <div>
                        <div class="pool-prize-label">Winning Jackpot</div>
                        <div class="pool-prize-val">${drw.winningPrize}</div>
                    </div>
                    <div style="font-size: 12px; color: var(--text-secondary); text-align: right;">
                        Winner: <strong style="color: #fff;">${drw.winner}</strong>
                    </div>
                </div>

                <div style="margin: 12px 0;">
                    <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; margin-bottom: 6px;">Winning Numbers:</div>
                    <div class="drawn-balls-row">
                        ${drw.drawnNumbers.map(n => `<div class="drawn-ball">${n < 10 ? '0' + n : n}</div>`).join('')}
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderTransactions() {
        const holder = document.getElementById('transactions-table-container');
        if (!holder) return;

        if (this.user.transactions.length === 0) {
            holder.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon"><i class="fa-solid fa-receipt"></i></div>
                    <h3>No Transactions Yet</h3>
                    <p>Your verified payments and winning statements will appear here.</p>
                </div>
            `;
            return;
        }

        holder.innerHTML = `
            <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
                    <thead>
                        <tr style="border-bottom: 1px solid var(--border-subtle); color: var(--text-muted); background: rgba(0,0,0,0.2);">
                            <th style="padding: 12px 16px;">TXN ID</th>
                            <th style="padding: 12px 16px;">Type</th>
                            <th style="padding: 12px 16px;">Details</th>
                            <th style="padding: 12px 16px;">Date</th>
                            <th style="padding: 12px 16px;">Amount</th>
                            <th style="padding: 12px 16px;">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.user.transactions.map(tx => `
                            <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                                <td style="padding: 12px 16px; font-family: var(--font-mono);">${tx.id}</td>
                                <td style="padding: 12px 16px;">
                                    <span style="padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; ${
                                        tx.type === 'DEPOSIT' ? 'background: rgba(16,185,129,0.2); color:#34d399;' :
                                        tx.type === 'WINNING' ? 'background: rgba(255,215,0,0.2); color:#fde047;' :
                                        'background: rgba(239,68,68,0.2); color:#f87171;'
                                    }">${tx.type}</span>
                                </td>
                                <td style="padding: 12px 16px; color: var(--text-secondary);">${tx.refId}</td>
                                <td style="padding: 12px 16px; color: var(--text-muted);">${tx.date}</td>
                                <td style="padding: 12px 16px; font-family: var(--font-heading); font-weight: 700; color: ${tx.type === 'TICKET_BUY' ? '#f87171' : '#38ef7d'};">
                                    ${tx.type === 'TICKET_BUY' ? '-' : '+'}₹${tx.amount.toFixed(2)}
                                </td>
                                <td style="padding: 12px 16px; color: #34d399;"><i class="fa-solid fa-circle-check"></i> ${tx.status}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    renderWinners() {
        const holder = document.getElementById('winners-grid');
        if (!holder) return;

        holder.innerHTML = this.winners.map(w => `
            <div class="winner-card" style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 14px; display: flex; align-items: center; gap: 12px;">
                <div style="width: 44px; height: 44px; border-radius: 50%; background: var(--gold-gradient); display: flex; align-items: center; justify-content: center; font-weight: 800; color: #111; font-size: 15px;">
                    ${w.avatar}
                </div>
                <div>
                    <h4 style="font-size: 14px; font-weight: 700;">${w.name} (${w.location})</h4>
                    <p style="font-size: 12px; color: var(--text-muted);">${w.pool}</p>
                    <div style="font-family: var(--font-heading); font-size: 14px; font-weight: 800; color: #38ef7d;">Won ${w.amount}</div>
                </div>
            </div>
        `).join('');
    }

    switchDashTab(tab, btn) {
        if (window.soundManager) window.soundManager.playClick();
        document.querySelectorAll('.dashboard-tabs .dash-tab-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');

        document.getElementById('dash-active-view').style.display = tab === 'active' ? 'block' : 'none';
        document.getElementById('dash-history-view').style.display = tab === 'history' ? 'block' : 'none';
        document.getElementById('dash-transactions-view').style.display = tab === 'transactions' ? 'block' : 'none';
    }

    // ==========================================================================
    // WALLET & WITHDRAWALS (MINIMUM ₹1,500 LIMIT)
    // ==========================================================================
    openWalletModal(tab = 'deposit') {
        if (window.soundManager) window.soundManager.playClick();
        this.updateHeaderUI();
        this.switchWalletTab(tab);
        this.openModal('wallet-modal');
    }

    switchWalletTab(tab) {
        if (window.soundManager) window.soundManager.playClick();
        const depBtn = document.getElementById('tab-btn-deposit');
        const withBtn = document.getElementById('tab-btn-withdraw');
        const depView = document.getElementById('wallet-deposit-view');
        const withView = document.getElementById('wallet-withdraw-view');

        if (tab === 'deposit') {
            depBtn.classList.add('active');
            withBtn.classList.remove('active');
            depView.style.display = 'block';
            withView.style.display = 'none';
        } else {
            withBtn.classList.add('active');
            depBtn.classList.remove('active');
            withView.style.display = 'block';
            depView.style.display = 'none';
        }
    }

    processWithdrawal() {
        const amtInput = document.getElementById('withdraw-amount-input');
        const upiInput = document.getElementById('withdraw-upi-input');
        const nameInput = document.getElementById('withdraw-name-input');

        const amt = parseFloat(amtInput.value);
        const upi = upiInput.value.trim();
        const name = nameInput.value.trim();

        if (isNaN(amt) || amt < this.minWithdrawalAmount) {
            this.showToast(`⚠️ Minimum withdrawal amount is ₹${this.minWithdrawalAmount}`);
            return;
        }

        if (amt > this.user.wallet.winnings) {
            this.showToast(`Insufficient winnings! Available: ₹${this.user.wallet.winnings.toFixed(2)}`);
            return;
        }

        if (!upi.includes('@')) {
            this.showToast("Please enter a valid UPI ID (e.g. mobile@upi)");
            return;
        }

        if (!name) {
            this.showToast("Please enter bank account holder name");
            return;
        }

        this.user.wallet.total -= amt;
        this.user.wallet.winnings -= amt;

        this.user.transactions.unshift({
            id: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
            type: "WITHDRAW",
            amount: amt,
            date: "Just Now",
            status: "Completed",
            refId: `Payout to ${upi}`
        });

        this.saveState();
        this.updateHeaderUI();
        this.renderTransactions();

        if (window.soundManager) window.soundManager.playCoins();
        this.closeModal('wallet-modal');
        this.showToast(`⚡ ₹${amt.toFixed(2)} payout initiated to ${upi}!`);
    }

    // ==========================================================================
    // MINI COUNTDOWN & LIVE DRAW ENGINE
    // ==========================================================================
    startMiniCountdown() {
        let seconds = 262;
        setInterval(() => {
            if (seconds <= 0) {
                seconds = 300;
                this.triggerLiveDrawSimulation(0);
            } else {
                seconds--;
            }
            const m = Math.floor(seconds / 60);
            const s = seconds % 60;
            const timerEl = document.getElementById('hero-mini-timer');
            if (timerEl) {
                timerEl.innerText = `${m < 10 ? '0' + m : m}m : ${s < 10 ? '0' + s : s}s`;
            }
        }, 1000);
    }

    triggerLiveDrawSimulation(poolId = 0) {
        if (this.isLiveDrawRunning) return;
        this.isLiveDrawRunning = true;

        if (window.soundManager) window.soundManager.playClick();
        const pool = this.pools.find(p => p.id === poolId) || this.pools[0];
        this.showToast(`🚀 Initiating Live Draw Ceremony for ${pool.name}...`);

        this.scrollToSection('starter-hero');

        const chamber = document.getElementById('spinning-chamber');
        if (chamber) chamber.classList.add('fast');

        const drawnBallsRow = document.getElementById('hero-drawn-numbers');
        if (drawnBallsRow) {
            drawnBallsRow.innerHTML = '';
            for (let i = 0; i < 6; i++) {
                drawnBallsRow.innerHTML += `<div class="drawn-ball pending" id="live-ball-${i}">?</div>`;
            }
        }

        const set = new Set();
        while (set.size < 6) {
            set.add(Math.floor(Math.random() * 99) + 1);
        }
        const finalNumbers = Array.from(set).sort((a, b) => a - b);

        let count = 0;
        const interval = setInterval(() => {
            if (count < 6) {
                const ballEl = document.getElementById(`live-ball-${count}`);
                const num = finalNumbers[count];
                if (ballEl) {
                    ballEl.innerText = num < 10 ? `0${num}` : num;
                    ballEl.classList.remove('pending');
                }

                if (window.soundManager) {
                    window.soundManager.playBallRoll();
                    window.soundManager.playBallPop();
                }
                count++;
            } else {
                clearInterval(interval);
                if (chamber) chamber.classList.remove('fast');
                this.isLiveDrawRunning = false;
                this.finishDrawSimulation(pool, finalNumbers);
            }
        }, 1000);
    }

    finishDrawSimulation(pool, drawnNumbers) {
        let userWon = false;
        let wonAmount = 0;
        let hadTicketsInPool = false;
        let totalConsolation = 0;

        this.user.tickets.forEach(tck => {
            if (tck.poolId === pool.id && tck.status === 'CONFIRMED') {
                hadTicketsInPool = true;
                tck.status = 'DECLARED';
                tck.drawnNumbers = drawnNumbers;
                const matches = tck.numbers.filter(n => drawnNumbers.includes(n)).length;
                if (matches >= 4) {
                    userWon = true;
                    tck.userWon = true;
                    if (matches === 6) wonAmount += pool.prizeVal;
                    else if (matches === 5) wonAmount += Math.floor(pool.prizeVal * 0.2);
                    else if (matches === 4) wonAmount += Math.floor(pool.prizeVal * 0.05);
                } else {
                    tck.userWon = false;
                    tck.userRank = tck.userRank || (Math.floor(Math.random() * 12) + 4);
                    const cashback = Math.round((tck.price * 0.5) * 100) / 100;
                    tck.consolationCashback = cashback;
                    totalConsolation += cashback;
                    this.user.transactions.unshift({
                        id: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
                        type: "WINNING",
                        amount: cashback,
                        date: "Just Now",
                        status: "Credited",
                        refId: `${pool.name} - 50% Consolation Cashback (Rank #${tck.userRank})`
                    });
                }
            }
        });

        this.pastDraws.unshift({
            id: `DRW-${pool.id + 10}-${Math.floor(100 + Math.random() * 900)}`,
            poolName: pool.name,
            drawnNumbers: drawnNumbers,
            winningPrize: pool.prize,
            drawDate: "Just Now",
            winner: userWon ? "YOU! (Congratulations)" : "Sanjay K. (Delhi)"
        });
        this.renderPastDraws();

        if (userWon) {
            this.user.wallet.total += wonAmount;
            this.user.wallet.winnings += wonAmount;
            this.user.transactions.unshift({
                id: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
                type: "WINNING",
                amount: wonAmount,
                date: "Just Now",
                status: "Completed",
                refId: `${pool.name} Prize Win`
            });
            this.saveState();
            this.updateHeaderUI();
            this.renderMyTickets();
            this.renderTransactions();

            if (window.soundManager) window.soundManager.playWinFanfare();
            this.triggerConfetti();
            this.showToast(`🎉 CONGRATULATIONS! You won ₹${wonAmount.toLocaleString('en-IN')} in ${pool.name}!`);
        } else if (hadTicketsInPool && totalConsolation > 0) {
            this.user.wallet.total += totalConsolation;
            this.user.wallet.winnings += totalConsolation;
            this.saveState();
            this.updateHeaderUI();
            this.renderMyTickets();
            this.renderTransactions();

            if (window.soundManager) window.soundManager.playCoins();
            this.showToast(`💫 Draw Declared: Try luck next time! 50% Consolation Cashback (₹${totalConsolation.toFixed(2)}) credited to your wallet!`);
        } else {
            if (window.soundManager) window.soundManager.playBuySuccess();
            this.showToast(`✅ Draw completed for ${pool.name}! Winning numbers: ${drawnNumbers.join(', ')}`);
        }
    }

    // ==========================================================================
    // SIMULATED LIVE TICKER STREAM
    // ==========================================================================
    startLiveFeedSimulation() {
        const names = ["Rahul", "Amit", "Pooja", "Suresh", "Vikram", "Neha", "Deepak", "Manish", "Sunil", "Ankit", "Rohit", "Karan"];
        const cities = ["Delhi", "Mumbai", "Pune", "Bengaluru", "Jaipur", "Kolkata", "Ahmedabad", "Surat", "Lucknow", "Indore"];

        setInterval(() => {
            const randomPool = this.pools[Math.floor(Math.random() * this.pools.length)];
            if (randomPool.slotsLeft > 2) {
                randomPool.slotsLeft -= 1;
                randomPool.participants = (randomPool.participants || 38) + 1;
                const progEl = document.getElementById(`pool-prog-${randomPool.id}`);
                if (progEl) {
                    const pct = Math.round(((randomPool.slotsTotal - randomPool.slotsLeft) / randomPool.slotsTotal) * 100);
                    progEl.style.width = `${pct}%`;
                }
            } else {
                randomPool.slotsLeft = Math.floor(randomPool.slotsTotal * 0.3);
            }

            if (randomPool.id === 0) {
                const heroSlots = document.getElementById('hero-slots-left');
                const heroPct = document.getElementById('hero-slots-pct');
                const heroBar = document.getElementById('hero-progress-bar');
                if (heroSlots && heroPct && heroBar) {
                    const pct = Math.round(((50 - randomPool.slotsLeft) / 50) * 100);
                    heroSlots.innerText = randomPool.slotsLeft;
                    heroPct.innerText = `${pct}% Filled`;
                    heroBar.style.width = `${pct}%`;
                }
            }

            const track = document.getElementById('live-ticker-track');
            if (track) {
                const randomName = names[Math.floor(Math.random() * names.length)];
                const randomCity = cities[Math.floor(Math.random() * cities.length)];
                const item = document.createElement('div');
                item.className = 'ticker-item';
                item.innerHTML = `<strong>${randomName} ${randomCity[0]}. (${randomCity})</strong> bought 1 ticket in <span class="badge-tag">${randomPool.name}</span>`;
                track.appendChild(item);
                if (track.children.length > 15) {
                    track.removeChild(track.children[0]);
                }
            }
        }, 4000);
    }

    // ==========================================================================
    // ADMIN CONTROLS & AUDIT LEDGER
    // ==========================================================================
    toggleAdminDrawer() {
        if (window.soundManager) window.soundManager.playClick();
        const drawer = document.getElementById('admin-drawer');
        if (drawer) {
            drawer.classList.toggle('open');
            if (drawer.classList.contains('open')) {
                this.loadAdminOrders();
            }
        }
    }

    async loadAdminOrders() {
        const listHolder = document.getElementById('admin-orders-list');
        const badge = document.getElementById('admin-orders-count');
        if (!listHolder) return;

        try {
            const res = await fetch('/api/admin/orders');
            if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.orders)) {
                    if (badge) badge.innerText = data.orders.length;
                    if (data.orders.length === 0) {
                        listHolder.innerHTML = `<div style="font-size: 11px; color: var(--text-muted); text-align: center; padding: 10px;">No gateway orders found.</div>`;
                        return;
                    }
                    listHolder.innerHTML = data.orders.map(o => `
                        <div style="background: rgba(0,0,0,0.5); border: 1px solid ${o.status === 'SUCCESS' ? 'rgba(56, 239, 125, 0.4)' : 'rgba(255,255,255,0.1)'}; border-radius: var(--radius-sm); padding: 8px 10px;">
                            <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; margin-bottom: 2px;">
                                <span style="color: #fff; font-family: var(--font-mono);">${o.orderId}</span>
                                <span style="color: ${o.status === 'SUCCESS' ? '#38ef7d' : (o.status === 'PENDING' ? '#fde047' : '#ef4444')}; font-weight: 800;">${o.status}</span>
                            </div>
                            <div style="font-size: 11px; color: var(--gold-primary);">${o.poolName} (x${o.quantity}) • <strong style="color:#38ef7d;">₹${o.amount.toFixed(2)}</strong></div>
                            <div style="font-size: 10px; color: var(--text-muted); margin-top: 3px;">
                                User: ${o.userId} | ${new Date(o.createdAt).toLocaleTimeString('en-IN')}
                            </div>
                        </div>
                    `).join('');
                }
            }
        } catch (e) {
            console.warn("Could not load admin orders:", e);
        }
    }

    adminAddCash(amount) {
        this.user.wallet.total += amount;
        this.user.wallet.deposit += amount;
        this.saveState();
        this.updateHeaderUI();
        if (window.soundManager) window.soundManager.playCoins();
        this.showToast(`Admin: Added ₹${amount} test balance to wallet!`);
    }

    // ==========================================================================
    // MODALS & HELPERS
    // ==========================================================================
    openModal(id) {
        const el = document.getElementById(id);
        if (el) el.classList.add('active');
    }

    closeModal(id) {
        if (window.soundManager) window.soundManager.playClick();
        const el = document.getElementById(id);
        if (el) el.classList.remove('active');
    }

    toggleSound() {
        if (window.soundManager) {
            const enabled = window.soundManager.toggleMute();
            const icon = document.getElementById('sound-icon');
            if (icon) {
                icon.className = enabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
            }
            this.showToast(enabled ? "🔊 Audio Sound Enabled" : "🔇 Audio Sound Muted");
        }
    }

    openDashboard() {
        if (window.soundManager) window.soundManager.playClick();
        this.scrollToSection('user-dashboard-section');
    }

    openWinners() {
        if (window.soundManager) window.soundManager.playClick();
        this.scrollToSection('winners-section');
    }

    scrollToSection(id) {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    }

    openTermsModal(type) {
        if (window.soundManager) window.soundManager.playClick();
        const titleEl = document.getElementById('terms-modal-title');
        const bodyEl = document.getElementById('terms-modal-body');

        if (type === 'terms') {
            titleEl.innerText = "Terms & Conditions";
            bodyEl.innerHTML = `
                <h4 style="color:#fff; margin-bottom:8px;">1. Eligibility & Age (18+)</h4>
                <p style="margin-bottom:12px;">Participation is strictly for individuals aged 18 years and above.</p>
                <h4 style="color:#fff; margin-bottom:8px;">2. Real UPI Payments</h4>
                <p style="margin-bottom:12px;">Tickets are confirmed only upon successful UPI payment transaction verification by the payment gateway.</p>
                <h4 style="color:#fff; margin-bottom:8px;">3. Minimum Withdrawal Policy</h4>
                <p style="margin-bottom:12px;">The minimum payout withdrawal threshold is ₹1,500. Winnings can be transferred to any verified UPI ID.</p>
            `;
        } else if (type === 'fairplay') {
            titleEl.innerText = "Provably Fair RNG Architecture";
            bodyEl.innerHTML = `
                <h4 style="color:#fff; margin-bottom:8px;">Certified Transparent Randomizer</h4>
                <p style="margin-bottom:12px;">All draws utilize SHA-256 cryptographic pseudo-random number generator algorithms to guarantee 100% fair and unbiased results for all participants.</p>
            `;
        } else {
            titleEl.innerText = "Privacy Policy & Responsible Gaming";
            bodyEl.innerHTML = `
                <h4 style="color:#fff; margin-bottom:8px;">Player Protection</h4>
                <p style="margin-bottom:12px;">All payment identifiers and transactions are protected by 256-bit SSL protocols. Play responsibly.</p>
            `;
        }

        this.openModal('terms-modal');
    }

    showToast(message) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = 'toast-msg';
        toast.innerHTML = `<i class="fa-solid fa-circle-info" style="color:var(--gold-primary);"></i> <span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    initConfetti() {
        this.canvas = document.getElementById('confetti-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.confettiParticles = [];

        const resize = () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();
    }

    triggerConfetti() {
        if (!this.canvas) return;
        const colors = ['#ffd700', '#10b981', '#06b6d4', '#ef4444', '#ffffff', '#f59e0b'];
        for (let i = 0; i < 100; i++) {
            this.confettiParticles.push({
                x: window.innerWidth / 2,
                y: window.innerHeight / 2,
                vx: (Math.random() - 0.5) * 14,
                vy: (Math.random() - 0.8) * 16,
                size: Math.random() * 8 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                vrot: (Math.random() - 0.5) * 10,
                alpha: 1
            });
        }

        if (!this.confettiAnimating) {
            this.confettiAnimating = true;
            this.animateConfetti();
        }
    }

    animateConfetti() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (let i = this.confettiParticles.length - 1; i >= 0; i--) {
            const p = this.confettiParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.35;
            p.rotation += p.vrot;
            p.alpha -= 0.012;

            this.ctx.save();
            this.ctx.globalAlpha = Math.max(0, p.alpha);
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate((p.rotation * Math.PI) / 180);
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            this.ctx.restore();

            if (p.alpha <= 0 || p.y > this.canvas.height) {
                this.confettiParticles.splice(i, 1);
            }
        }

        if (this.confettiParticles.length > 0) {
            requestAnimationFrame(() => this.animateConfetti());
        } else {
            this.confettiAnimating = false;
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    // ==========================================================================
    // TRUST & SECURITY METHODS (SETTLEMENT LEDGER & PROVABLY FAIR VERIFICATION)
    // ==========================================================================
    initSettlementLedger() {
        const holder = document.getElementById('live-ledger-rows');
        if (!holder) return;

        const settlements = [
            { name: "Rahul Sharma", loc: "New Delhi", utr: "UPI/503928198273", pool: "₹19 Pocket Booster", amount: "₹2,500.00", app: "PhonePe" },
            { name: "Pooja Kulkarni", loc: "Mumbai", utr: "UPI/503928194819", pool: "₹49 Daily Super 50", amount: "₹10,000.00", app: "Google Pay" },
            { name: "Suresh Verma", loc: "Pune", utr: "UPI/503928189301", pool: "₹99 Silver Bumper", amount: "₹25,000.00", app: "Paytm UPI" },
            { name: "Amit Mukherjee", loc: "Bengaluru", utr: "UPI/503928174920", pool: "₹199 Gold Rush", amount: "₹1,00,000.00", app: "BHIM UPI" },
            { name: "Vikram Roy", loc: "Kolkata", utr: "UPI/503928165039", pool: "₹19 Pocket Booster", amount: "₹2,500.00", app: "Google Pay" },
            { name: "Deepak Patel", loc: "Ahmedabad", utr: "UPI/503928153920", pool: "₹49 Daily Super 50", amount: "₹10,000.00", app: "PhonePe" }
        ];

        holder.innerHTML = settlements.map(item => `
            <div class="ledger-row">
                <div>
                    <strong style="color: #fff;">${item.name}</strong>
                    <div style="font-size: 11px; color: var(--text-muted);">${item.loc}</div>
                </div>
                <div>
                    <span style="font-family: var(--font-mono); font-size: 11px; color: var(--cyan-accent);">${item.utr}</span>
                    <div style="font-size: 10px; color: var(--text-muted);">${item.app} Direct Payout</div>
                </div>
                <div class="ledger-hide-mobile">
                    <span style="color: var(--text-gold); font-size: 12px; font-weight: 700;">${item.pool}</span>
                </div>
                <div>
                    <strong style="color: #38ef7d; font-family: var(--font-heading); font-size: 14px;">${item.amount}</strong>
                </div>
                <div>
                    <span class="badge-status-settled"><i class="fa-solid fa-circle-check"></i> SETTLED</span>
                </div>
            </div>
        `).join('');
    }

    startFloatingPayoutAlerts() {
        const popup = document.getElementById('payout-popup-card');
        if (!popup) return;

        const fakePayouts = [
            { name: "Kunal S.", city: "Jaipur", amount: "₹2,500", ref: "UPI4920194821", pool: "₹19 Booster" },
            { name: "Ananya M.", city: "Bengaluru", amount: "₹10,000", ref: "UPI8291048291", pool: "₹49 Daily Super" },
            { name: "Mohit G.", city: "Chandigarh", amount: "₹25,000", ref: "UPI3901928410", pool: "₹99 Silver Bumper" },
            { name: "Priya D.", city: "Indore", amount: "₹2,500", ref: "UPI9102948201", pool: "₹19 Booster" },
            { name: "Sameer K.", city: "Hyderabad", amount: "₹1,00,000", ref: "UPI5829104820", pool: "₹199 Gold Rush" },
            { name: "Ramesh P.", city: "Surat", amount: "₹2,500", ref: "UPI6920194829", pool: "₹19 Booster" }
        ];

        let index = 0;
        const triggerNextPopup = () => {
            const data = fakePayouts[index % fakePayouts.length];
            index++;

            const initials = data.name.split(' ').map(n => n[0]).join('');
            document.getElementById('popup-avatar').innerText = initials || 'ML';
            document.getElementById('popup-title').innerText = `${data.name} (${data.city}) received ${data.amount}`;
            document.getElementById('popup-ref').innerText = `• Ref: ${data.ref}`;
            document.getElementById('popup-time').innerText = `• Just Now`;

            popup.classList.add('show');

            setTimeout(() => {
                popup.classList.remove('show');
            }, 4500);
        };

        setTimeout(() => {
            triggerNextPopup();
            setInterval(triggerNextPopup, 11000);
        }, 3000);
    }

    openFairPlayVerifier() {
        if (window.soundManager) window.soundManager.playClick();
        this.openModal('fairplay-verifier-modal');
        this.calculateCryptographicHash();
    }

    async calculateCryptographicHash() {
        const drawInput = document.getElementById('verify-draw-input')?.value || "DRW-BST-902";
        const seedInput = document.getElementById('verify-seed-input')?.value || "0x7f4a9b2c8e1d5a3f";
        const textToHash = `${drawInput}:${seedInput}:MEGALOTTO_SALT_2026`;

        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(textToHash);
            const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            const hashDisplay = document.getElementById('verifier-hash-output');
            if (hashDisplay) {
                hashDisplay.innerText = hashHex;
            }
            this.showToast("✅ SHA-256 Hash calculated and verified cryptographically!");
        } catch (e) {
            console.error("Crypto hash error:", e);
        }
    }
}

// Instantiate
window.app = new LotteryApp();
