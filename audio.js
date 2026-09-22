// Web Audio API Sound Synthesizer for Mega Jackpot Lottery Platform
class SoundManager {
    constructor() {
        this.ctx = null;
        this.soundEnabled = true;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.soundEnabled = !this.soundEnabled;
        return this.soundEnabled;
    }

    playClick() {
        if (!this.soundEnabled) return;
        this.init();
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.05);
            gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.05);
        } catch (e) { }
    }

    playBuySuccess() {
        if (!this.soundEnabled) return;
        this.init();
        try {
            const now = this.ctx.currentTime;
            [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0, now + i * 0.08);
                gain.gain.linearRampToValueAtTime(0.2, now + i * 0.08 + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.25);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now + i * 0.08);
                osc.stop(now + i * 0.08 + 0.25);
            });
        } catch (e) { }
    }

    playBallRoll() {
        if (!this.soundEnabled) return;
        this.init();
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(120 + Math.random() * 80, now);
            osc.frequency.exponentialRampToValueAtTime(300 + Math.random() * 100, now + 0.1);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.1);
        } catch (e) { }
    }

    playBallPop() {
        if (!this.soundEnabled) return;
        this.init();
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, now);
            osc.frequency.exponentialRampToValueAtTime(440, now + 0.15);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.15);
        } catch (e) { }
    }

    playWinFanfare() {
        if (!this.soundEnabled) return;
        this.init();
        try {
            const now = this.ctx.currentTime;
            const notes = [
                { f: 523.25, d: 0.15, t: 0 },
                { f: 523.25, d: 0.15, t: 0.15 },
                { f: 523.25, d: 0.15, t: 0.30 },
                { f: 659.25, d: 0.3, t: 0.45 },
                { f: 783.99, d: 0.3, t: 0.75 },
                { f: 1046.50, d: 0.6, t: 1.05 }
            ];
            notes.forEach(n => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.value = n.f;
                gain.gain.setValueAtTime(0.25, now + n.t);
                gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now + n.t);
                osc.stop(now + n.t + n.d);
            });
        } catch (e) { }
    }

    playCoins() {
        if (!this.soundEnabled) return;
        this.init();
        try {
            const now = this.ctx.currentTime;
            for (let i = 0; i < 5; i++) {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.value = 1400 + Math.random() * 600;
                gain.gain.setValueAtTime(0.12, now + i * 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.08);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now + i * 0.05);
                osc.stop(now + i * 0.05 + 0.08);
            }
        } catch (e) { }
    }
}

window.soundManager = new SoundManager();
