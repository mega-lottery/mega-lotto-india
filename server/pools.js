// Server-side authoritative lottery pools definition

const LOTTERY_POOLS = [
    {
        id: 0,
        name: "₹19 Pocket Booster",
        price: 19,
        prize: "₹2,500 Cash",
        prizeVal: 2500,
        slotsTotal: 50,
        drawFreq: "Every 15 Mins / On Full",
        drawIntervalSecs: 900,
        badge: "🔥 Quick Win",
        tier: "micro"
    },
    {
        id: 1,
        name: "₹10 Super Fast 10",
        price: 10,
        prize: "₹1,000 Cash",
        prizeVal: 1000,
        slotsTotal: 30,
        drawFreq: "Every 10 Mins / On Full",
        drawIntervalSecs: 600,
        badge: "⚡ Instant Win",
        tier: "micro"
    },
    {
        id: 2,
        name: "₹29 Mini Dhamaka",
        price: 29,
        prize: "₹5,000 Cash",
        prizeVal: 5000,
        slotsTotal: 75,
        drawFreq: "Every 30 Mins",
        drawIntervalSecs: 1800,
        badge: "💥 Hot Deal",
        tier: "micro"
    },
    {
        id: 3,
        name: "₹49 Daily Super 50",
        price: 49,
        prize: "₹10,000 Cash",
        prizeVal: 10000,
        slotsTotal: 150,
        drawFreq: "Daily 9:00 PM IST",
        drawIntervalSecs: 3600,
        badge: "⚡ Daily Rush",
        tier: "micro"
    },
    {
        id: 4,
        name: "₹99 Silver Bumper",
        price: 99,
        prize: "₹25,000 Cash + Gold Coin",
        prizeVal: 25000,
        slotsTotal: 250,
        drawFreq: "Daily 10:00 PM IST",
        drawIntervalSecs: 7200,
        badge: "⭐ Popular",
        tier: "micro"
    },
    {
        id: 5,
        name: "₹149 Golden Fortune",
        price: 149,
        prize: "₹50,000 Cash",
        prizeVal: 50000,
        slotsTotal: 350,
        drawFreq: "Daily 10:30 PM IST",
        drawIntervalSecs: 10800,
        badge: "🌟 High Win",
        tier: "bumper"
    },
    {
        id: 6,
        name: "₹199 Gold Rush Bumper",
        price: 199,
        prize: "₹1,00,000 Cash",
        prizeVal: 100000,
        slotsTotal: 500,
        drawFreq: "Mon / Wed / Fri 8:00 PM",
        drawIntervalSecs: 14400,
        badge: "🏆 High Return",
        tier: "bumper"
    },
    {
        id: 7,
        name: "₹299 Platinum Star Bumper",
        price: 299,
        prize: "₹2,00,000 Cash",
        prizeVal: 200000,
        slotsTotal: 750,
        drawFreq: "Tue / Thu / Sat 8:30 PM",
        drawIntervalSecs: 21600,
        badge: "✨ Platinum Tier",
        tier: "bumper"
    },
    {
        id: 8,
        name: "₹499 Diamond Express",
        price: 499,
        prize: "₹5,00,000 Cash",
        prizeVal: 500000,
        slotsTotal: 1000,
        drawFreq: "Weekly Sunday 8:00 PM",
        drawIntervalSecs: 28800,
        badge: "💎 VIP Tier",
        tier: "bumper"
    },
    {
        id: 9,
        name: "₹749 Royal Crown Jackpot",
        price: 749,
        prize: "₹10,00,000 Cash",
        prizeVal: 1000000,
        slotsTotal: 1500,
        drawFreq: "Weekly Sunday 9:00 PM",
        drawIntervalSecs: 43200,
        badge: "👑 Royal Tier",
        tier: "bumper"
    },
    {
        id: 10,
        name: "₹999 Saturday Mega Jackpot",
        price: 999,
        prize: "₹25,00,000 Cash",
        prizeVal: 2500000,
        slotsTotal: 2500,
        drawFreq: "Every Saturday 8:00 PM",
        drawIntervalSecs: 86400,
        badge: "💰 Mega Jackpot",
        tier: "bumper"
    },
    {
        id: 11,
        name: "₹1,499 Super Crorepati Bumper",
        price: 1499,
        prize: "₹50,00,000 Cash",
        prizeVal: 5000000,
        slotsTotal: 3500,
        drawFreq: "Monthly Mega Draw",
        drawIntervalSecs: 172800,
        badge: "🌟 Crorepati Club",
        tier: "bumper"
    }
];

function getPoolById(id) {
    return LOTTERY_POOLS.find(p => p.id === parseInt(id, 10)) || null;
}

function calculateExactSchedule(pool) {
    const now = new Date();
    let target = new Date();
    let exactLabel = "";

    if (pool.id === 0) { // ₹19 Pocket Booster: 15 Mins
        const mins = now.getMinutes();
        const nextSlotMin = (Math.floor(mins / 15) + 1) * 15;
        target.setMinutes(nextSlotMin, 0, 0);
        const timeStr = target.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
        exactLabel = `Today at ${timeStr} (15-Min Slot)`;
    } else if (pool.id === 1) { // ₹10 Super Fast 10: 10 Mins
        const mins = now.getMinutes();
        const nextSlotMin = (Math.floor(mins / 10) + 1) * 10;
        target.setMinutes(nextSlotMin, 0, 0);
        const timeStr = target.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
        exactLabel = `Today at ${timeStr} (10-Min Slot)`;
    } else if (pool.id === 2) { // ₹29 Mini Dhamaka: 30 Mins
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
            exactLabel = `Upcoming, 08:00 PM IST`;
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

function generateRandomCombination() {
    const set = new Set();
    while (set.size < 6) {
        set.add(Math.floor(Math.random() * 99) + 1);
    }
    return Array.from(set).sort((a, b) => a - b);
}

module.exports = {
    LOTTERY_POOLS,
    getPoolById,
    calculateExactSchedule,
    generateRandomCombination
};
