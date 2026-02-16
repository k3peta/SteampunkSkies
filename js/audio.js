/* ============================================
   Audio System - Web Audio API SFX Synthesis
   Premium steampunk sound effects
   ============================================ */
const Audio = {
    ctx: null,
    masterGain: null,
    muted: false,

    init() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.35;
            this.masterGain.connect(this.ctx.destination);
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    },

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    playTone(freq, duration, type = 'square', vol = 0.3) {
        if (!this.ctx || this.muted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + duration);
    },

    // Tone with frequency sweep (for impact sounds)
    playSweep(startFreq, endFreq, duration, type = 'sawtooth', vol = 0.3) {
        if (!this.ctx || this.muted) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(startFreq, t);
        osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 20), t + duration);
        gain.gain.setValueAtTime(vol, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + duration);
    },

    playNoise(duration, vol = 0.2) {
        if (!this.ctx || this.muted) return;
        const bufferSize = Math.floor(this.ctx.sampleRate * duration);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        source.connect(gain);
        gain.connect(this.masterGain);
        source.start();
    },

    // Filtered noise burst (for metallic/impact sounds)
    playFilteredNoise(duration, freq, vol = 0.2, type = 'bandpass') {
        if (!this.ctx || this.muted) return;
        const t = this.ctx.currentTime;
        const bufferSize = Math.floor(this.ctx.sampleRate * duration);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = type;
        filter.frequency.setValueAtTime(freq, t);
        filter.Q.setValueAtTime(5, t);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        source.start();
    },

    // ============ GAME SFX ============

    // Player shooting - steam-powered cannon burst
    shoot() {
        this.playTone(880, 0.04, 'square', 0.12);
        this.playTone(660, 0.03, 'square', 0.08);
        this.playFilteredNoise(0.06, 3000, 0.1, 'highpass');
    },

    // Enemy shooting - lower, more menacing
    enemyShoot() {
        this.playTone(330, 0.05, 'sine', 0.04);
        this.playTone(165, 0.04, 'sine', 0.03);
    },

    // Enemy hit (bullet impact) - metallic clang
    hit() {
        this.playFilteredNoise(0.06, 2500, 0.12, 'bandpass');
        this.playSweep(800, 200, 0.08, 'sawtooth', 0.08);
    },

    // Enemy destroyed - multi-layered explosion
    explode() {
        const t = this.ctx.currentTime;
        // Low rumble
        this.playSweep(200, 40, 0.35, 'sawtooth', 0.2);
        // Mid crunch
        this.playNoise(0.2, 0.25);
        this.playFilteredNoise(0.15, 800, 0.15, 'bandpass');
        // High debris scatter
        this.playFilteredNoise(0.25, 4000, 0.08, 'highpass');
        // Metal fracture
        this.playTone(120, 0.15, 'square', 0.1);
    },

    // Large enemy / balloon explosion - bigger, deeper
    bigExplode() {
        this.playSweep(150, 25, 0.5, 'sawtooth', 0.25);
        this.playNoise(0.4, 0.3);
        this.playFilteredNoise(0.3, 500, 0.2, 'lowpass');
        this.playFilteredNoise(0.35, 5000, 0.1, 'highpass');
        this.playTone(80, 0.3, 'square', 0.15);
        setTimeout(() => {
            this.playSweep(100, 30, 0.3, 'sine', 0.12);
            this.playNoise(0.2, 0.15);
        }, 80);
    },

    // Player destroyed - dramatic, reverberating death
    playerHit() {
        // Initial blast
        this.playNoise(0.5, 0.45);
        this.playSweep(400, 30, 0.6, 'sawtooth', 0.35);
        // Metal shearing
        this.playFilteredNoise(0.3, 1200, 0.25, 'bandpass');
        // Low death rumble
        this.playTone(60, 0.7, 'sine', 0.25);
        this.playTone(80, 0.5, 'square', 0.2);
        // Debris aftermath
        setTimeout(() => {
            this.playNoise(0.3, 0.15);
            this.playSweep(300, 50, 0.4, 'sawtooth', 0.12);
            this.playFilteredNoise(0.4, 3000, 0.08, 'highpass');
        }, 100);
        // Final low thud
        setTimeout(() => {
            this.playSweep(80, 20, 0.4, 'sine', 0.15);
        }, 250);
    },

    // Bomb activation - massive multi-phase explosion
    bomb() {
        // Phase 1: Initial detonation crack
        this.playNoise(0.15, 0.5);
        this.playSweep(2000, 100, 0.2, 'sawtooth', 0.3);
        this.playFilteredNoise(0.1, 6000, 0.2, 'highpass');

        // Phase 2: Shockwave expansion (delayed)
        setTimeout(() => {
            this.playSweep(120, 20, 0.8, 'sawtooth', 0.35);
            this.playNoise(0.6, 0.4);
            this.playTone(40, 0.8, 'sine', 0.25);
            this.playFilteredNoise(0.5, 300, 0.3, 'lowpass');
        }, 60);

        // Phase 3: Sustained rumble
        setTimeout(() => {
            this.playNoise(0.5, 0.2);
            this.playSweep(80, 25, 0.6, 'sine', 0.2);
            this.playFilteredNoise(0.6, 200, 0.15, 'lowpass');
        }, 200);

        // Phase 4: Debris settling
        setTimeout(() => {
            this.playFilteredNoise(0.4, 4000, 0.08, 'highpass');
            this.playNoise(0.3, 0.1);
        }, 500);
    },

    // Bomb ongoing rumble (called each frame during bomb)
    bombRumble() {
        if (!this.ctx || this.muted) return;
        if (Math.random() < 0.15) {
            this.playTone(30 + Math.random() * 40, 0.1, 'sine', 0.06);
        }
    },

    powerUp() {
        this.playTone(523, 0.1, 'sine', 0.2);
        setTimeout(() => this.playTone(659, 0.1, 'sine', 0.2), 100);
        setTimeout(() => this.playTone(784, 0.15, 'sine', 0.2), 200);
    },

    bossWarning() {
        if (!this.ctx || this.muted) return;
        // Air-raid siren: sweeping frequency up and down
        for (let cycle = 0; cycle < 3; cycle++) {
            setTimeout(() => {
                if (!this.ctx || this.muted) return;
                const t = this.ctx.currentTime;
                // Rising siren
                const osc1 = this.ctx.createOscillator();
                const gain1 = this.ctx.createGain();
                osc1.type = 'sawtooth';
                osc1.frequency.setValueAtTime(400, t);
                osc1.frequency.linearRampToValueAtTime(900, t + 0.8);
                osc1.frequency.linearRampToValueAtTime(400, t + 1.6);
                gain1.gain.setValueAtTime(0.18, t);
                gain1.gain.setValueAtTime(0.22, t + 0.8);
                gain1.gain.exponentialRampToValueAtTime(0.001, t + 1.7);
                osc1.connect(gain1);
                gain1.connect(this.masterGain);
                osc1.start(t);
                osc1.stop(t + 1.7);

                // Harmonic layer (octave up, quieter)
                const osc2 = this.ctx.createOscillator();
                const gain2 = this.ctx.createGain();
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(800, t);
                osc2.frequency.linearRampToValueAtTime(1800, t + 0.8);
                osc2.frequency.linearRampToValueAtTime(800, t + 1.6);
                gain2.gain.setValueAtTime(0.06, t);
                gain2.gain.exponentialRampToValueAtTime(0.001, t + 1.7);
                osc2.connect(gain2);
                gain2.connect(this.masterGain);
                osc2.start(t);
                osc2.stop(t + 1.7);
            }, cycle * 1400);
        }
        // Backed by filtered noise hiss
        this.playFilteredNoise(4.0, 1200, 0.06, 'bandpass');
    },

    // Boss crashing rumble (called each frame during crash)
    bossCrashRumble() {
        if (!this.ctx || this.muted) return;
        if (Math.random() < 0.2) {
            this.playTone(40 + Math.random() * 30, 0.15, 'sawtooth', 0.08);
            this.playFilteredNoise(0.1, 300 + Math.random() * 200, 0.05, 'lowpass');
        }
    },

    // Boss ground impact
    bossImpact() {
        this.playNoise(0.8, 0.5);
        this.playSweep(200, 15, 1.0, 'sawtooth', 0.4);
        this.playTone(25, 1.2, 'sine', 0.3);
        this.playFilteredNoise(0.6, 200, 0.35, 'lowpass');
        setTimeout(() => {
            this.playNoise(0.5, 0.3);
            this.playSweep(100, 20, 0.8, 'sine', 0.2);
        }, 150);
        setTimeout(() => {
            this.playFilteredNoise(0.4, 4000, 0.1, 'highpass');
        }, 400);
    },

    stageClear() {
        const notes = [523, 659, 784, 1047];
        notes.forEach((n, i) => {
            setTimeout(() => this.playTone(n, 0.3, 'sine', 0.2), i * 150);
        });
    },

    menuSelect() {
        this.playTone(660, 0.08, 'sine', 0.15);
    },

    menuConfirm() {
        this.playTone(880, 0.1, 'sine', 0.2);
        setTimeout(() => this.playTone(1100, 0.15, 'sine', 0.2), 80);
    },

    // Barrier break sound
    barrierBreak() {
        this.playSweep(1500, 300, 0.15, 'sine', 0.2);
        this.playFilteredNoise(0.1, 3000, 0.15, 'highpass');
        this.playTone(600, 0.1, 'square', 0.1);
    }
};
