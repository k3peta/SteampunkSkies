/* ============================================
   BGM System - Eurobeat Style (HEAVY ver.)
   155 BPM, louder drums, distortion, fills
   Track 0-6=stages, 7=boss, 8=title, 9=midboss
   ============================================ */
const BGM = {
    ctx: null,
    masterGain: null,
    compressor: null,
    playing: false,
    bpm: 158,
    stepDuration: 0,
    currentStep: 0,
    nextStepTime: 0,
    timerId: null,
    currentTrack: -1,
    nodes: [],
    cleanTimer: 0,
    totalSteps: 0,

    noteFreq(note) { return 440 * Math.pow(2, (note - 69) / 12); },

    init() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            // Compressor for punch
            this.compressor = this.ctx.createDynamicsCompressor();
            this.compressor.threshold.value = -15;
            this.compressor.knee.value = 10;
            this.compressor.ratio.value = 6;
            this.compressor.attack.value = 0.003;
            this.compressor.release.value = 0.1;
            this.compressor.connect(this.ctx.destination);
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.28;
            this.masterGain.connect(this.compressor);
            this.stepDuration = 60 / this.bpm / 4;
        } catch (e) { console.warn('BGM unavailable'); }
    },

    pause() {
        if (!this.playing) return;
        this.playing = false;
        if (this.timerId) { clearInterval(this.timerId); this.timerId = null; }
        if (this.masterGain) this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
    },

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
        if (!this.playing && this.currentTrack !== -1) {
            this.playing = true;
            this.nextStepTime = this.ctx.currentTime + 0.05;
            this.timerId = setInterval(() => this.scheduler(), 20);
            if (this.masterGain) this.masterGain.gain.setValueAtTime(0.28, this.ctx.currentTime);
        }
    },

    stop() {
        this.playing = false;
        if (this.timerId) { clearInterval(this.timerId); this.timerId = null; }
        this.nodes.forEach(n => { try { n.stop(); } catch (e) { } });
        this.nodes = [];
        this.currentTrack = -1;
        if (this.masterGain) {
            this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
            this.masterGain.gain.setValueAtTime(0.28, this.ctx.currentTime);
        }
    },

    play(trackIndex) {
        if (!this.ctx) return;
        if (this.currentTrack === trackIndex && this.playing) return;
        this.stop(); this.resume();
        this.currentTrack = trackIndex;
        this.playing = true;
        this.currentStep = 0;
        this.totalSteps = 0;
        this.nextStepTime = this.ctx.currentTime + 0.05;
        this.timerId = setInterval(() => this.scheduler(), 20);
    },

    scheduler() {
        if (!this.playing || !this.ctx) return;
        while (this.nextStepTime < this.ctx.currentTime + 0.12) {
            this.playStep(this.currentStep, this.nextStepTime);
            this.nextStepTime += this.stepDuration;
            this.currentStep = (this.currentStep + 1) % 64;
            this.totalSteps++;
        }
        this.cleanTimer++;
        if (this.cleanTimer % 50 === 0) this.cleanNodes();
    },

    // Intensity phases based on elapsed time
    // Phase 0: Intro (first ~40s) - minimal, bass+pad+light kick
    // Phase 1: Buildup (~40-80s) - add lead, hi-hats, snare
    // Phase 2: Full (~80-140s) - add arp, stabs, fills, ghost kicks
    // Phase 3: Climax (140s+) - everything, double-time hats, crashes
    getIntensity() {
        // Boss/midboss tracks always play at full intensity
        if (this.currentTrack >= 7) return 3;
        // ~158 BPM, 4 steps per beat = 632 steps per minute
        // Phase transitions at roughly 40s, 80s, 140s
        const s = this.totalSteps;
        if (s < 420) return 0;       // ~40s
        if (s < 840) return 1;       // ~80s
        if (s < 1470) return 2;      // ~140s
        return 3;
    },

    playStep(step, time) {
        const song = this.getSong(this.currentTrack);
        const bar = Math.floor(step / 16);
        const beat = step % 16;
        const intensity = this.getIntensity();

        // === DRUMS (intensity-scaled) ===
        // Kick: always present but lighter in phase 0
        if (beat % 4 === 0) this.playKick(time, intensity === 0 ? 0.5 : 1.0);
        // Ghost kicks: phase 2+
        if (intensity >= 2 && (beat === 6 || beat === 14)) this.playKick(time, 0.4);
        // Snare: phase 1+
        if (intensity >= 1 && (beat === 4 || beat === 12)) this.playSnare(time, intensity >= 2 ? 1.0 : 0.6);
        // Fill on bar 3: phase 2+
        if (intensity >= 2 && bar % 4 === 3 && beat >= 12) this.playSnare(time, 0.5);
        // Hi-hat: phase 1+ (phase 3 = double-time)
        if (intensity >= 1) {
            if (intensity >= 3) {
                // Double-time - every step
                this.playHiHat(time, 0.04);
            } else {
                this.playHiHat(time, beat % 2 === 0 ? 0.06 : 0.03);
            }
        } else {
            // Phase 0: very sparse hi-hat (every 4 beats)
            if (beat % 4 === 0) this.playHiHat(time, 0.03);
        }
        // Open hat: phase 1+
        if (intensity >= 1 && beat % 4 === 2) this.playOpenHat(time);
        // Crash on bar start: phase 2+ (every 4 bars), phase 3 (every 2 bars)
        if (beat === 0) {
            if (intensity >= 3 && bar % 2 === 0) this.playCrash(time);
            else if (intensity >= 2 && bar % 4 === 0) this.playCrash(time);
        }

        // === BASS (always present) ===
        const bassNote = song.bass[step % song.bass.length];
        if (bassNote > 0) this.playBass(this.noteFreq(bassNote), time, this.stepDuration * 1.8);

        // === SUB-BASS: phase 3 only ===
        if (intensity >= 3 && bassNote > 0 && beat % 4 === 0) {
            this.playSubBass(this.noteFreq(bassNote) / 2, time, this.stepDuration * 3);
        }

        // === LEAD: phase 1+ ===
        if (intensity >= 1) {
            const leadNote = song.lead[step % song.lead.length];
            if (leadNote > 0) this.playLead(this.noteFreq(leadNote), time, this.stepDuration * 1.5, song.leadType || 'sawtooth');
        }

        // === PAD (chord): always present ===
        if (beat === 0) {
            const chord = song.chords[bar % song.chords.length];
            if (chord) chord.forEach(n => this.playPad(this.noteFreq(n), time, this.stepDuration * 14));
        }

        // === ARPEGGIO: phase 2+ ===
        if (intensity >= 2 && song.arp && song.arp.length > 0) {
            const arpNote = song.arp[step % song.arp.length];
            if (arpNote > 0) this.playArp(this.noteFreq(arpNote), time, this.stepDuration * 0.7);
        }

        // === SYNTH STABS: phase 2+ ===
        if (intensity >= 2 && song.stabs) {
            const stabNote = song.stabs[step % song.stabs.length];
            if (stabNote > 0) this.playStab(this.noteFreq(stabNote), time);
        }

        // === ORGAN: phase 1+ ===
        if (intensity >= 1 && song.organ) {
            const organNote = song.organ[step % song.organ.length];
            if (organNote > 0) this.playOrgan(this.noteFreq(organNote), time, this.stepDuration * 3);
        }
    },

    // ===== INSTRUMENTS =====
    playKick(time, vol) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(160, time);
        osc.frequency.exponentialRampToValueAtTime(28, time + 0.12);
        gain.gain.setValueAtTime(0.75 * vol, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
        // Click layer
        const click = this.ctx.createOscillator();
        const cGain = this.ctx.createGain();
        click.type = 'square'; click.frequency.value = 800;
        cGain.gain.setValueAtTime(0.12 * vol, time);
        cGain.gain.exponentialRampToValueAtTime(0.001, time + 0.015);
        click.connect(cGain); cGain.connect(this.masterGain);
        click.start(time); click.stop(time + 0.02);
        osc.connect(gain); gain.connect(this.masterGain);
        osc.start(time); osc.stop(time + 0.18);
        this.nodes.push(osc, click);
    },

    playSnare(time, vol) {
        const bufSz = this.ctx.sampleRate * 0.1;
        const buf = this.ctx.createBuffer(1, bufSz, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufSz; i++) d[i] = Math.random() * 2 - 1;
        const src = this.ctx.createBufferSource(); src.buffer = buf;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.45 * vol, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
        const f = this.ctx.createBiquadFilter();
        f.type = 'highpass'; f.frequency.value = 900;
        src.connect(f); f.connect(g); g.connect(this.masterGain);
        src.start(time); src.stop(time + 0.1);
        // Body
        const osc = this.ctx.createOscillator();
        const g2 = this.ctx.createGain();
        osc.type = 'triangle'; osc.frequency.value = 220;
        g2.gain.setValueAtTime(0.25 * vol, time);
        g2.gain.exponentialRampToValueAtTime(0.001, time + 0.06);
        osc.connect(g2); g2.connect(this.masterGain);
        osc.start(time); osc.stop(time + 0.06);
        this.nodes.push(src, osc);
    },

    playHiHat(time, dur) {
        const bufSz = this.ctx.sampleRate * dur;
        const buf = this.ctx.createBuffer(1, bufSz, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufSz; i++) d[i] = Math.random() * 2 - 1;
        const src = this.ctx.createBufferSource(); src.buffer = buf;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.14, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + dur);
        const f = this.ctx.createBiquadFilter();
        f.type = 'highpass'; f.frequency.value = 7000;
        src.connect(f); f.connect(g); g.connect(this.masterGain);
        src.start(time); src.stop(time + dur);
        this.nodes.push(src);
    },

    playOpenHat(time) {
        const dur = 0.12;
        const bufSz = this.ctx.sampleRate * dur;
        const buf = this.ctx.createBuffer(1, bufSz, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufSz; i++) d[i] = Math.random() * 2 - 1;
        const src = this.ctx.createBufferSource(); src.buffer = buf;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.1, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + dur);
        const f = this.ctx.createBiquadFilter();
        f.type = 'bandpass'; f.frequency.value = 8000; f.Q.value = 2;
        src.connect(f); f.connect(g); g.connect(this.masterGain);
        src.start(time); src.stop(time + dur);
        this.nodes.push(src);
    },

    playCrash(time) {
        const dur = 0.5;
        const bufSz = this.ctx.sampleRate * dur;
        const buf = this.ctx.createBuffer(1, bufSz, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufSz; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / bufSz);
        const src = this.ctx.createBufferSource(); src.buffer = buf;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.2, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + dur);
        const f = this.ctx.createBiquadFilter();
        f.type = 'highpass'; f.frequency.value = 3000;
        src.connect(f); f.connect(g); g.connect(this.masterGain);
        src.start(time); src.stop(time + dur);
        this.nodes.push(src);
    },

    playBass(freq, time, dur) {
        const osc = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'square'; osc2.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);
        osc2.frequency.setValueAtTime(freq * 1.005, time);
        g.gain.setValueAtTime(0.25, time);
        g.gain.setValueAtTime(0.25, time + dur * 0.6);
        g.gain.exponentialRampToValueAtTime(0.001, time + dur);
        const f = this.ctx.createBiquadFilter();
        f.type = 'lowpass'; f.frequency.value = 800;
        osc.connect(f); osc2.connect(f); f.connect(g); g.connect(this.masterGain);
        osc.start(time); osc.stop(time + dur);
        osc2.start(time); osc2.stop(time + dur);
        this.nodes.push(osc, osc2);
    },

    playSubBass(freq, time, dur) {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        g.gain.setValueAtTime(0.2, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + dur);
        osc.connect(g); g.connect(this.masterGain);
        osc.start(time); osc.stop(time + dur);
        this.nodes.push(osc);
    },

    playLead(freq, time, dur, type = 'sawtooth') {
        const osc = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const osc3 = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = type; osc2.type = type; osc3.type = type;
        osc.frequency.setValueAtTime(freq, time);
        osc2.frequency.setValueAtTime(freq * 1.004, time);
        osc3.frequency.setValueAtTime(freq * 0.996, time);
        g.gain.setValueAtTime(0.14, time);
        g.gain.setValueAtTime(0.14, time + dur * 0.5);
        g.gain.exponentialRampToValueAtTime(0.001, time + dur);
        const f = this.ctx.createBiquadFilter();
        f.type = 'lowpass'; f.frequency.value = 4000; f.Q.value = 2;
        osc.connect(f); osc2.connect(f); osc3.connect(f);
        f.connect(g); g.connect(this.masterGain);
        osc.start(time); osc.stop(time + dur);
        osc2.start(time); osc2.stop(time + dur);
        osc3.start(time); osc3.stop(time + dur);
        this.nodes.push(osc, osc2, osc3);
    },

    playPad(freq, time, dur) {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        g.gain.setValueAtTime(0, time);
        g.gain.linearRampToValueAtTime(0.05, time + 0.08);
        g.gain.setValueAtTime(0.05, time + dur * 0.7);
        g.gain.linearRampToValueAtTime(0, time + dur);
        osc.connect(g); g.connect(this.masterGain);
        osc.start(time); osc.stop(time + dur + 0.01);
        this.nodes.push(osc);
    },

    playArp(freq, time, dur) {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, time);
        g.gain.setValueAtTime(0.08, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + dur);
        const f = this.ctx.createBiquadFilter();
        f.type = 'lowpass'; f.frequency.value = 5000;
        osc.connect(f); f.connect(g); g.connect(this.masterGain);
        osc.start(time); osc.stop(time + dur);
        this.nodes.push(osc);
    },

    playStab(freq, time) {
        const osc = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sawtooth'; osc2.type = 'square';
        osc.frequency.setValueAtTime(freq, time);
        osc2.frequency.setValueAtTime(freq * 2.01, time);
        g.gain.setValueAtTime(0.15, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + 0.06);
        osc.connect(g); osc2.connect(g); g.connect(this.masterGain);
        osc.start(time); osc.stop(time + 0.07);
        osc2.start(time); osc2.stop(time + 0.07);
        this.nodes.push(osc, osc2);
    },

    playOrgan(freq, time, dur) {
        const harmonics = [1, 2, 3, 4, 6, 8];
        const vols = [0.08, 0.06, 0.03, 0.02, 0.015, 0.01];
        harmonics.forEach((h, i) => {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq * h, time);
            g.gain.setValueAtTime(0, time);
            g.gain.linearRampToValueAtTime(vols[i], time + 0.04);
            g.gain.setValueAtTime(vols[i], time + dur * 0.7);
            g.gain.linearRampToValueAtTime(0, time + dur);
            osc.connect(g); g.connect(this.masterGain);
            osc.start(time); osc.stop(time + dur + 0.01);
            this.nodes.push(osc);
        });
    },

    cleanNodes() {
        if (this.nodes.length > 300) this.nodes = this.nodes.slice(-100);
    },

    /* ============ SONG DEFINITIONS ============ */
    getSong(idx) {
        const songs = [
            this.songStage1(), this.songStage2(), this.songStage3(), this.songStage4(),
            this.songStage5(), this.songStage6(), this.songStage7(), this.songBoss(),
            this.songTitle(), this.songMidBoss(),
            this.songBoss1(), this.songBoss2(), this.songBoss3(), this.songBoss4(),
            this.songBoss5(), this.songBoss6(), this.songBoss7()
        ];
        return songs[idx % songs.length] || songs[0];
    },

    songStage1() { // A minor
        const r = 45;
        return {
            bass: [r, r, 0, r, r + 7, 0, r + 5, 0, r, r, 0, r, r + 3, 0, r + 5, 0,
                r, r, 0, r, r + 7, 0, r + 5, 0, r + 3, r + 3, 0, r + 3, r + 5, 0, r + 7, 0,
                r, r, 0, r, r + 7, 0, r + 5, 0, r, r, 0, r, r + 3, 0, r + 5, 0,
                r + 3, r + 3, 0, r + 3, r + 5, 0, r + 5, 0, r + 7, r + 7, 0, r, r, 0, 0, 0],
            lead: [69, 0, 72, 0, 76, 0, 72, 0, 69, 0, 67, 0, 69, 0, 0, 0,
                65, 0, 69, 0, 72, 0, 76, 0, 77, 0, 76, 0, 72, 0, 0, 0,
                69, 0, 72, 0, 76, 0, 77, 0, 79, 0, 77, 0, 76, 0, 72, 0,
                69, 0, 67, 0, 65, 0, 67, 0, 69, 0, 72, 0, 0, 0, 0, 0],
            chords: [[57, 60, 64, 69], [53, 57, 60, 65], [55, 59, 62, 67], [52, 55, 60, 64]],
            arp: [81, 76, 72, 69, 81, 76, 72, 69, 77, 72, 69, 65, 79, 74, 71, 67],
            stabs: [0, 0, 0, 0, 69, 0, 0, 0, 0, 0, 0, 0, 72, 0, 0, 0,
                0, 0, 0, 0, 69, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 69, 0, 0, 0, 0, 0, 0, 0, 72, 0, 0, 0,
                0, 0, 0, 0, 76, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            leadType: 'sawtooth'
        };
    },

    songStage2() { // D minor, dark
        const r = 38;
        return {
            bass: [r, r, 0, r, r, 0, r + 7, 0, r + 5, r + 5, 0, r + 5, r + 3, 0, r, 0,
                r, r, 0, r, r + 5, 0, r + 3, 0, r + 7, r + 7, 0, r + 7, r + 5, 0, 0, 0,
                r, r, 0, r, r, 0, r + 7, 0, r + 5, r + 5, 0, r + 5, r + 3, 0, r, 0,
                r + 3, 0, r + 5, 0, r + 7, 0, r + 5, 0, r + 3, 0, r, 0, r, 0, 0, 0],
            lead: [74, 0, 77, 0, 74, 0, 72, 0, 70, 0, 72, 0, 74, 0, 0, 0,
                69, 0, 70, 0, 72, 0, 74, 0, 77, 0, 74, 0, 72, 0, 0, 0,
                74, 0, 77, 0, 79, 0, 77, 0, 74, 0, 72, 0, 70, 0, 0, 0,
                72, 0, 70, 0, 69, 0, 70, 0, 72, 0, 74, 0, 0, 0, 0, 0],
            chords: [[62, 65, 69, 74], [60, 65, 69, 72], [58, 62, 65, 70], [60, 64, 67, 72]],
            arp: [86, 81, 77, 74, 84, 81, 77, 72, 82, 77, 74, 70, 84, 79, 76, 72],
            leadType: 'sawtooth'
        };
    },

    songStage3() { // E minor, driving
        const r = 40;
        return {
            bass: [r, r, 0, r, r + 7, 0, r + 5, 0, r, r, 0, r, r + 3, 0, r + 5, 0,
                r + 5, r + 5, 0, r + 5, r + 7, 0, r + 5, 0, r + 3, r + 3, 0, r + 3, r, 0, 0, 0,
                r, r, 0, r, r + 7, 0, r + 5, 0, r, r, 0, r, r + 3, 0, r + 5, 0,
                r + 7, r + 7, 0, r + 7, r + 5, 0, r + 3, 0, r, r, 0, r, r, 0, 0, 0],
            lead: [76, 0, 79, 0, 83, 0, 79, 0, 76, 0, 74, 0, 76, 0, 0, 0,
                71, 0, 74, 0, 76, 0, 79, 0, 83, 0, 79, 0, 76, 0, 0, 0,
                76, 0, 79, 0, 83, 0, 84, 0, 86, 0, 84, 0, 83, 0, 79, 0,
                76, 0, 74, 0, 71, 0, 74, 0, 76, 0, 0, 0, 0, 0, 0, 0],
            chords: [[64, 67, 71, 76], [62, 67, 71, 74], [60, 64, 67, 72], [59, 62, 67, 71]],
            arp: [88, 83, 79, 76, 86, 83, 79, 74, 84, 79, 76, 72, 83, 79, 74, 71],
            leadType: 'sawtooth'
        };
    },

    songStage4() { // G minor, clockwork
        const r = 43;
        return {
            bass: [r, r, 0, r, r, 0, r + 7, 0, r + 5, r + 5, 0, r + 5, r + 3, 0, r, 0,
                r, r, 0, r, r + 5, 0, r + 3, 0, r + 7, r + 7, 0, r + 7, r + 5, 0, 0, 0,
                r, r, 0, r, r, 0, r + 7, 0, r + 5, r + 5, 0, r + 5, r + 3, 0, r, 0,
                r + 3, 0, r + 5, 0, r + 7, 0, r + 5, 0, r + 3, 0, r, 0, r, 0, 0, 0],
            lead: [79, 0, 82, 0, 79, 0, 77, 0, 74, 0, 77, 0, 79, 0, 0, 0,
                74, 0, 77, 0, 79, 0, 82, 0, 86, 0, 82, 0, 79, 0, 0, 0,
                79, 0, 82, 0, 86, 0, 87, 0, 89, 0, 87, 0, 86, 0, 82, 0,
                79, 0, 77, 0, 74, 0, 77, 0, 79, 0, 0, 0, 0, 0, 0, 0],
            chords: [[67, 70, 74, 79], [65, 70, 74, 77], [63, 67, 70, 75], [65, 69, 72, 77]],
            arp: [],
            stabs: [0, 0, 0, 0, 79, 0, 0, 0, 0, 0, 79, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 82, 0, 0, 0, 0, 0, 82, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 79, 0, 0, 0, 0, 0, 79, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 86, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            leadType: 'square'
        };
    },

    songStage5() { // C minor, heavy
        const r = 36;
        return {
            bass: [r, r, 0, r, 0, r, r, 0, r + 7, r + 7, 0, r + 5, r, 0, r, 0,
                r + 3, r + 3, 0, r + 3, 0, r + 3, r + 3, 0, r + 5, 0, r + 7, 0, r + 5, 0, 0, 0,
                r, r, 0, r, 0, r, r, 0, r + 7, r + 7, 0, r + 5, r, 0, r, 0,
                r + 3, 0, r + 5, 0, r + 7, 0, r + 5, 0, r + 3, r, 0, 0, r, 0, 0, 0],
            lead: [72, 0, 75, 0, 79, 0, 75, 0, 72, 0, 70, 0, 72, 0, 0, 0,
                67, 0, 70, 0, 72, 0, 75, 0, 79, 0, 75, 0, 72, 0, 0, 0,
                72, 0, 75, 0, 79, 0, 80, 0, 82, 0, 80, 0, 79, 0, 75, 0,
                72, 0, 70, 0, 67, 0, 70, 0, 72, 0, 0, 0, 0, 0, 0, 0],
            chords: [[60, 63, 67, 72], [58, 63, 67, 70], [56, 60, 63, 68], [58, 62, 65, 70]],
            arp: [84, 79, 75, 72, 82, 79, 75, 70, 80, 75, 72, 68, 82, 77, 74, 70],
            leadType: 'sawtooth'
        };
    },

    songStage6() { // F major, soaring
        const r = 41;
        return {
            bass: [r, r, 0, r, r + 7, 0, r + 4, 0, r, r, 0, r, r + 5, 0, r + 7, 0,
                r + 5, r + 5, 0, r + 5, r + 7, 0, r + 4, 0, r + 2, r + 2, 0, r + 2, r + 4, 0, r + 5, 0,
                r, r, 0, r, r + 7, 0, r + 4, 0, r, r, 0, r, r + 5, 0, r + 7, 0,
                r + 5, 0, r + 4, 0, r + 2, 0, r + 4, 0, r + 5, 0, r + 7, 0, r, 0, 0, 0],
            lead: [77, 0, 81, 0, 84, 0, 81, 0, 77, 0, 76, 0, 77, 0, 0, 0,
                72, 0, 76, 0, 77, 0, 81, 0, 84, 0, 81, 0, 77, 0, 0, 0,
                77, 0, 81, 0, 84, 0, 88, 0, 89, 0, 88, 0, 84, 0, 81, 0,
                77, 0, 76, 0, 72, 0, 76, 0, 77, 0, 0, 0, 0, 0, 0, 0],
            chords: [[65, 69, 72, 77], [64, 67, 72, 76], [62, 65, 69, 74], [64, 67, 72, 76]],
            arp: [89, 84, 81, 77, 88, 84, 81, 76, 86, 81, 77, 74, 88, 84, 79, 76],
            leadType: 'sawtooth'
        };
    },

    songStage7() { // B minor, final
        const r = 35;
        return {
            bass: [r, r, r, 0, r + 7, 0, r + 5, 0, r, r, r, 0, r + 3, 0, r + 5, 0,
                r + 5, r + 5, r + 5, 0, r + 7, 0, r + 5, 0, r + 3, r + 3, r + 3, 0, r, 0, 0, 0,
                r, r, r, 0, r + 7, 0, r + 5, 0, r, r, r, 0, r + 3, 0, r + 5, 0,
                r + 7, 0, r + 5, 0, r + 3, 0, r, 0, r, r, 0, 0, r, 0, 0, 0],
            lead: [71, 0, 74, 0, 78, 0, 74, 0, 71, 0, 69, 0, 71, 0, 0, 0,
                66, 0, 69, 0, 71, 0, 74, 0, 78, 0, 74, 0, 71, 0, 0, 0,
                71, 0, 74, 0, 78, 0, 83, 0, 85, 0, 83, 0, 78, 0, 74, 0,
                71, 0, 69, 0, 66, 0, 69, 0, 71, 0, 0, 0, 0, 0, 0, 0],
            chords: [[59, 62, 66, 71], [57, 62, 66, 69], [55, 59, 62, 67], [57, 61, 64, 69]],
            arp: [83, 78, 74, 71, 81, 78, 74, 69, 79, 74, 71, 67, 81, 78, 74, 69],
            stabs: [0, 0, 0, 0, 71, 0, 0, 0, 0, 0, 71, 0, 74, 0, 0, 0,
                0, 0, 0, 0, 78, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 71, 0, 0, 0, 0, 0, 71, 0, 74, 0, 0, 0,
                0, 0, 0, 0, 83, 0, 78, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            leadType: 'sawtooth'
        };
    },

    songBoss() { // A minor, intense
        const r = 33;
        return {
            bass: [r, r, 0, r, r, 0, r, 0, r + 7, r + 7, 0, r + 7, r + 5, 0, r, 0,
                r + 3, r + 3, 0, r + 3, r + 5, 0, r + 3, 0, r + 7, r + 7, 0, r + 7, r + 5, 0, r, 0,
                r, r, 0, r, r, 0, r, 0, r + 7, r + 7, 0, r + 7, r + 5, 0, r, 0,
                r + 3, 0, r + 5, 0, r + 7, 0, r + 5, 0, r + 3, 0, r, r, r, 0, 0, 0],
            lead: [69, 0, 72, 0, 76, 72, 69, 0, 72, 0, 76, 0, 81, 76, 72, 0,
                69, 0, 72, 0, 76, 72, 69, 0, 67, 0, 65, 0, 64, 65, 67, 0,
                69, 0, 72, 0, 76, 72, 69, 0, 72, 0, 76, 0, 81, 76, 72, 0,
                76, 0, 74, 0, 72, 0, 69, 0, 67, 0, 69, 0, 0, 0, 0, 0],
            chords: [[57, 60, 64, 69], [53, 57, 60, 65], [55, 59, 62, 67], [52, 56, 59, 64]],
            arp: [81, 76, 72, 69, 77, 72, 69, 65, 79, 74, 71, 67, 76, 72, 69, 64],
            stabs: [69, 0, 0, 0, 0, 0, 72, 0, 0, 0, 0, 0, 76, 0, 0, 0,
                69, 0, 0, 0, 0, 0, 72, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                69, 0, 0, 0, 0, 0, 72, 0, 0, 0, 0, 0, 76, 0, 0, 0,
                81, 0, 0, 0, 0, 0, 76, 0, 0, 0, 72, 0, 0, 0, 0, 0],
            leadType: 'sawtooth'
        };
    },

    songTitle() { // C major, heroic
        const r = 36;
        return {
            bass: [r, r, 0, r, r + 7, 0, r + 4, 0, r + 5, r + 5, 0, r + 5, r + 7, 0, r, 0,
                r + 5, r + 5, 0, r + 5, r + 4, 0, r + 7, 0, r, r, 0, r, r + 7, 0, 0, 0,
                r, r, 0, r, r + 7, 0, r + 4, 0, r + 5, r + 5, 0, r + 5, r + 7, 0, r, 0,
                r + 5, 0, r + 4, 0, r + 2, 0, r + 4, 0, r + 5, 0, r + 7, 0, r, 0, 0, 0],
            lead: [72, 0, 76, 0, 79, 0, 76, 0, 72, 0, 71, 0, 72, 0, 0, 0,
                67, 0, 72, 0, 76, 0, 79, 0, 84, 0, 79, 0, 76, 0, 0, 0,
                72, 0, 76, 0, 79, 0, 84, 0, 88, 0, 84, 0, 79, 0, 76, 0,
                72, 0, 71, 0, 67, 0, 72, 0, 76, 0, 0, 0, 0, 0, 0, 0],
            chords: [[60, 64, 67, 72], [57, 60, 64, 69], [65, 69, 72, 77], [55, 59, 62, 67]],
            arp: [84, 79, 76, 72, 81, 76, 72, 69, 89, 84, 79, 77, 79, 74, 71, 67],
            leadType: 'sawtooth'
        };
    },

    songMidBoss() { // E minor, aggressive
        const r = 40;
        return {
            bass: [r, r, 0, r, r, 0, r + 7, 0, r, r, 0, r, r + 5, 0, r + 3, 0,
                r + 3, r + 3, 0, r + 3, r + 5, 0, r + 7, 0, r + 5, r + 5, 0, r + 5, r + 3, 0, r, 0,
                r, r, 0, r, r, 0, r + 7, 0, r, r, 0, r, r + 5, 0, r + 3, 0,
                r + 7, 0, r + 5, 0, r + 3, 0, r, 0, r, r, 0, r, r, 0, 0, 0],
            lead: [76, 79, 0, 83, 79, 0, 76, 0, 74, 76, 0, 79, 76, 0, 74, 0,
                71, 74, 0, 76, 79, 0, 76, 0, 74, 0, 71, 0, 69, 71, 74, 0,
                76, 79, 0, 83, 79, 0, 76, 0, 74, 76, 0, 79, 76, 0, 74, 0,
                79, 0, 76, 0, 74, 0, 71, 0, 69, 0, 71, 0, 0, 0, 0, 0],
            chords: [[64, 67, 71, 76], [62, 64, 67, 71], [60, 64, 67, 72], [59, 62, 67, 71]],
            arp: [88, 83, 79, 76, 86, 83, 79, 74, 84, 79, 76, 72, 83, 79, 74, 71],
            stabs: [76, 0, 0, 0, 0, 0, 79, 0, 0, 0, 0, 0, 83, 0, 0, 0,
                76, 0, 0, 0, 0, 0, 79, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                76, 0, 0, 0, 0, 0, 79, 0, 0, 0, 0, 0, 83, 0, 0, 0,
                88, 0, 83, 0, 0, 0, 79, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            leadType: 'sawtooth'
        };
    },

    // ========= PER-BOSS BGM (10-16) =========
    songBoss1() { // Rock, A minor
        const r = 33;
        return {
            bass: [r, r, 0, r, r, 0, r + 7, 0, r, r, 0, r + 5, r, 0, r + 7, 0,
                r + 3, r + 3, 0, r + 3, r + 5, 0, r + 7, 0, r + 5, r + 5, 0, r + 3, r, 0, 0, 0,
                r, r, 0, r, r, 0, r + 7, 0, r, r, 0, r + 5, r, 0, r + 7, 0,
                r + 5, 0, r + 3, 0, r, 0, r + 7, 0, r, r, 0, r, r, 0, 0, 0],
            lead: [69, 72, 0, 76, 72, 69, 0, 0, 72, 0, 76, 0, 81, 76, 72, 0,
                69, 72, 0, 76, 72, 69, 0, 0, 67, 0, 65, 0, 64, 65, 67, 0,
                69, 72, 0, 76, 72, 69, 0, 0, 72, 0, 76, 0, 81, 76, 72, 0,
                76, 0, 74, 0, 72, 0, 69, 0, 67, 0, 69, 0, 0, 0, 0, 0],
            chords: [[57, 60, 64, 69], [53, 57, 60, 65], [55, 59, 62, 67], [52, 56, 59, 64]],
            arp: [],
            stabs: [69, 0, 0, 0, 0, 0, 72, 0, 0, 0, 0, 0, 76, 0, 0, 0,
                69, 0, 0, 0, 0, 0, 72, 0, 0, 0, 76, 0, 0, 0, 0, 0,
                69, 0, 0, 0, 0, 0, 72, 0, 0, 0, 0, 0, 76, 0, 0, 0,
                81, 0, 76, 0, 0, 0, 72, 0, 0, 0, 69, 0, 0, 0, 0, 0],
            leadType: 'sawtooth'
        };
    },
    songBoss2() { // Dark eurobeat, D minor
        const r = 38;
        return {
            bass: [r, r, 0, r, r, 0, r, 0, r + 7, r + 7, 0, r + 7, r + 5, 0, r, 0,
                r + 3, r + 3, 0, r + 3, r + 5, 0, r + 3, 0, r + 7, r + 7, 0, r + 7, r + 5, 0, r, 0,
                r, r, 0, r, r, 0, r, 0, r + 7, r + 7, 0, r + 7, r + 5, 0, r, 0,
                r + 3, 0, r + 5, 0, r + 7, 0, r + 5, 0, r + 3, 0, r, r, r, 0, 0, 0],
            lead: [74, 77, 0, 81, 77, 74, 0, 0, 77, 0, 81, 0, 86, 81, 77, 0,
                74, 0, 72, 0, 70, 0, 72, 0, 74, 0, 77, 0, 81, 77, 74, 0,
                74, 77, 0, 81, 77, 74, 0, 0, 77, 0, 81, 0, 86, 81, 77, 0,
                81, 0, 79, 0, 77, 0, 74, 0, 72, 0, 74, 0, 0, 0, 0, 0],
            chords: [[62, 65, 69, 74], [60, 65, 69, 72], [58, 62, 65, 70], [60, 64, 67, 72]],
            arp: [86, 81, 77, 74, 84, 81, 77, 72, 82, 77, 74, 70, 84, 79, 76, 72],
            leadType: 'sawtooth'
        };
    },
    songBoss3() { // Heavy, E minor
        const r = 40;
        return {
            bass: [r, r, r, 0, r + 7, 0, r + 5, 0, r, r, r, 0, r + 5, 0, r + 3, 0,
                r + 3, r + 3, r + 3, 0, r + 5, 0, r + 7, 0, r + 5, r + 5, 0, r + 3, r, 0, 0, 0,
                r, r, r, 0, r + 7, 0, r + 5, 0, r, r, r, 0, r + 5, 0, r + 3, 0,
                r + 7, 0, r + 5, 0, r + 3, 0, r, 0, r, r, r, 0, r, 0, 0, 0],
            lead: [76, 79, 83, 0, 79, 76, 0, 0, 79, 83, 0, 88, 83, 79, 76, 0,
                71, 74, 76, 0, 79, 76, 74, 0, 71, 0, 74, 0, 76, 79, 0, 0,
                76, 79, 83, 0, 79, 76, 0, 0, 79, 83, 0, 88, 83, 79, 76, 0,
                83, 0, 79, 0, 76, 0, 74, 0, 71, 0, 76, 0, 0, 0, 0, 0],
            chords: [[64, 67, 71, 76], [62, 67, 71, 74], [60, 64, 67, 72], [59, 62, 67, 71]],
            arp: [88, 83, 79, 76, 86, 83, 79, 74, 84, 79, 76, 72, 83, 79, 74, 71],
            stabs: [76, 0, 0, 0, 0, 0, 79, 0, 0, 0, 83, 0, 0, 0, 0, 0,
                76, 0, 0, 0, 0, 0, 79, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                76, 0, 0, 0, 0, 0, 79, 0, 0, 0, 83, 0, 88, 0, 0, 0,
                83, 0, 79, 0, 0, 0, 76, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            leadType: 'sawtooth'
        };
    },
    songBoss4() { // Industrial, G minor
        const r = 31;
        return {
            bass: [r, r, 0, r, r, 0, r, 0, r + 7, r + 7, 0, r, r + 5, 0, r, 0,
                r, r, 0, r, r + 3, 0, r + 5, 0, r + 7, r + 7, 0, r, r, 0, 0, 0,
                r, r, 0, r, r, 0, r, 0, r + 7, r + 7, 0, r, r + 5, 0, r, 0,
                r + 3, 0, r + 5, 0, r + 7, 0, r + 5, 0, r + 3, 0, r, r, r, 0, 0, 0],
            lead: [67, 0, 70, 0, 74, 70, 67, 0, 70, 0, 74, 0, 79, 74, 70, 0,
                67, 0, 70, 0, 74, 70, 67, 0, 65, 0, 63, 0, 62, 63, 65, 0,
                67, 0, 70, 0, 74, 70, 67, 0, 70, 0, 74, 0, 79, 74, 70, 0,
                74, 0, 72, 0, 70, 0, 67, 0, 65, 0, 67, 0, 0, 0, 0, 0],
            chords: [[55, 58, 62, 67], [53, 58, 62, 65], [51, 55, 58, 63], [53, 57, 60, 65]],
            arp: [],
            stabs: [67, 0, 0, 0, 70, 0, 0, 0, 74, 0, 0, 0, 79, 0, 0, 0,
                67, 0, 0, 0, 70, 0, 0, 0, 74, 0, 0, 0, 0, 0, 0, 0,
                67, 0, 0, 0, 70, 0, 0, 0, 74, 0, 0, 0, 79, 0, 0, 0,
                74, 0, 70, 0, 0, 0, 67, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            leadType: 'square'
        };
    },
    songBoss5() { // Speed metal, C minor
        const r = 36;
        return {
            bass: [r, r, r, r, r + 7, 0, r + 5, 0, r, r, r, r, r + 3, 0, r + 5, 0,
                r + 3, r + 3, r + 3, 0, r + 5, 0, r + 7, 0, r + 5, r + 5, 0, r + 3, r, 0, 0, 0,
                r, r, r, r, r + 7, 0, r + 5, 0, r, r, r, r, r + 3, 0, r + 5, 0,
                r + 7, 0, r + 5, 0, r + 3, 0, r, 0, r, r, r, 0, r, 0, 0, 0],
            lead: [72, 75, 79, 0, 75, 72, 0, 0, 75, 79, 0, 84, 79, 75, 72, 0,
                67, 70, 72, 0, 75, 72, 70, 0, 67, 0, 70, 0, 72, 75, 0, 0,
                72, 75, 79, 0, 75, 72, 0, 0, 75, 79, 0, 84, 79, 75, 72, 0,
                79, 0, 75, 0, 72, 0, 70, 0, 67, 0, 72, 0, 0, 0, 0, 0],
            chords: [[60, 63, 67, 72], [58, 63, 67, 70], [56, 60, 63, 68], [58, 62, 65, 70]],
            arp: [84, 79, 75, 72, 82, 79, 75, 70, 80, 75, 72, 68, 82, 77, 74, 70],
            leadType: 'sawtooth'
        };
    },
    songBoss6() { // Symphonic, F minor
        const r = 29;
        return {
            bass: [r, r, 0, r, r + 7, 0, r + 5, 0, r, r, 0, r, r + 3, 0, r + 5, 0,
                r + 5, r + 5, 0, r + 5, r + 7, 0, r + 5, 0, r + 3, r + 3, 0, r + 3, r, 0, 0, 0,
                r, r, 0, r, r + 7, 0, r + 5, 0, r, r, 0, r, r + 3, 0, r + 5, 0,
                r + 7, 0, r + 5, 0, r + 3, 0, r, 0, r, r, 0, 0, r, 0, 0, 0],
            lead: [65, 0, 68, 0, 72, 0, 68, 0, 65, 0, 63, 0, 65, 0, 0, 0,
                60, 0, 63, 0, 65, 0, 68, 0, 72, 0, 68, 0, 65, 0, 0, 0,
                65, 0, 68, 0, 72, 0, 77, 0, 80, 0, 77, 0, 72, 0, 68, 0,
                65, 0, 63, 0, 60, 0, 63, 0, 65, 0, 0, 0, 0, 0, 0, 0],
            chords: [[53, 56, 60, 65], [51, 56, 60, 63], [49, 53, 56, 61], [51, 55, 58, 63]],
            arp: [77, 72, 68, 65, 75, 72, 68, 63, 73, 68, 65, 61, 75, 70, 67, 63],
            leadType: 'sawtooth'
        };
    },
    songBoss7() { // SOLEMN RELIGIOUS - Organ, B minor
        const r = 35;
        return {
            bass: [r, 0, 0, 0, r, 0, 0, 0, r + 7, 0, 0, 0, r + 5, 0, 0, 0,
                r + 3, 0, 0, 0, r + 3, 0, 0, 0, r + 5, 0, 0, 0, r + 7, 0, 0, 0,
                r, 0, 0, 0, r, 0, 0, 0, r + 7, 0, 0, 0, r + 5, 0, 0, 0,
                r + 3, 0, 0, 0, r + 5, 0, 0, 0, r + 7, 0, 0, 0, r, 0, 0, 0],
            lead: [71, 0, 0, 0, 74, 0, 0, 0, 78, 0, 0, 0, 74, 0, 0, 0,
                71, 0, 0, 0, 69, 0, 0, 0, 71, 0, 0, 0, 0, 0, 0, 0,
                66, 0, 0, 0, 69, 0, 0, 0, 71, 0, 0, 0, 74, 0, 0, 0,
                78, 0, 0, 0, 74, 0, 0, 0, 71, 0, 0, 0, 0, 0, 0, 0],
            chords: [[59, 62, 66, 71], [57, 62, 66, 69], [55, 59, 62, 66], [57, 61, 64, 69]],
            arp: [],
            organ: [59, 0, 62, 0, 66, 0, 71, 0, 57, 0, 62, 0, 66, 0, 69, 0,
                55, 0, 59, 0, 62, 0, 66, 0, 57, 0, 61, 0, 64, 0, 69, 0,
                59, 0, 62, 0, 66, 0, 71, 0, 57, 0, 62, 0, 66, 0, 69, 0,
                55, 0, 59, 0, 62, 0, 66, 0, 57, 0, 61, 0, 64, 0, 69, 0],
            leadType: 'sine'
        };
    }
};
