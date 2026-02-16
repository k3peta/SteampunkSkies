/* ============================================
   Boss Encounters - 7 Steampunk Bosses (Premium)
   ============================================ */
class Boss {
    constructor(config) {
        this.name = config.name; this.subtitle = config.subtitle || '';
        this.x = config.x || 240; this.y = config.y || -80;
        this.targetY = config.targetY || 120;
        this.hp = config.hp || 500; this.maxHp = this.hp;
        this.phase = 0; this.phaseTimer = 0;
        this.width = config.width || 80; this.height = config.height || 60;
        this.radius = config.radius || 35;
        this.active = true; this.entering = true;
        this.age = 0; this.defeated = false;
        this.shootFunc = config.shootFunc;
        this.drawFunc = config.drawFunc;
        this.phaseThresholds = config.phaseThresholds || [0.6, 0.3];
        this.scoreValue = config.score || 50000;
        this.movePattern = config.movePattern || 'sway';
        this.moveSpeed = config.moveSpeed || 1;
        this.drawScale = config.drawScale || 1;
        // Crash animation state
        this.crashing = false;
        this.crashTimer = 0;
        this.crashVy = 0;
        this.crashVx = 0;
        this.crashRotation = 0;
        this.crashExploded = false;
    }
    update(pool, px, py) {
        this.age++;
        // If crashing, do crash animation instead
        if (this.crashing) {
            this.updateCrash();
            return;
        }
        if (this.entering) {
            this.y += (this.targetY - this.y) * 0.03;
            if (Math.abs(this.y - this.targetY) < 2) { this.entering = false; this.y = this.targetY; }
            return;
        }
        const hpR = this.hp / this.maxHp;
        let np = 0;
        for (let i = 0; i < this.phaseThresholds.length; i++) { if (hpR <= this.phaseThresholds[i]) np = i + 1; }
        if (np !== this.phase) { this.phase = np; this.phaseTimer = 0; }
        this.phaseTimer++;
        switch (this.movePattern) {
            case 'sway': this.x = 240 + Math.sin(this.age * 0.015 * this.moveSpeed) * 120; break;
            case 'figure8': this.x = 240 + Math.sin(this.age * 0.012) * 140; this.y = this.targetY + Math.sin(this.age * 0.024) * 40; break;
            case 'rushAndReturn':
                if (this.phaseTimer % 300 < 60) this.y = this.targetY + (this.phaseTimer % 300) * 3;
                else this.y += (this.targetY - this.y) * 0.05; break;
            case 'erratic': this.x += Math.sin(this.age * 0.03) * 2; this.y = this.targetY + Math.sin(this.age * 0.02) * 30; break;
        }
        this.x = Math.max(50, Math.min(430, this.x));
        if (this.shootFunc) this.shootFunc(this, pool, px, py);
        // Smoke & steam emissions
        const smokeRate = hpR < 0.3 ? 3 : hpR < 0.6 ? 6 : 12;
        if (this.age % smokeRate === 0) {
            const sx = this.x + (Math.random() - 0.5) * this.width * 0.8;
            const sy = this.y + (Math.random() - 0.5) * this.height * 0.5;
            Particles.spawn(sx, sy, (Math.random() - 0.5) * 0.8, -1.2 - Math.random() * 0.8,
                35 + Math.random() * 20, 'rgba(80,80,80,0.35)', 4 + Math.random() * 4, 'steam');
        }
        // Extra fire/smoke when damaged
        if (hpR < 0.5 && this.age % 8 === 0) {
            const fx = this.x + (Math.random() - 0.5) * this.width * 0.6;
            const fy = this.y + (Math.random() - 0.5) * this.height * 0.4;
            Particles.spawn(fx, fy, (Math.random() - 0.5) * 1.5, -0.8 - Math.random() * 1.2,
                20 + Math.random() * 15, hpR < 0.25 ? '#FF4400' : '#FF8833',
                3 + Math.random() * 3, 'circle');
        }
        // Thick exhaust plumes from sides
        if (this.age % 10 === 0) {
            for (let side of [-1, 1]) {
                Particles.spawn(
                    this.x + side * this.width * 0.4, this.y - this.height * 0.1,
                    side * 0.3, -0.6 - Math.random() * 0.4,
                    30 + Math.random() * 15, 'rgba(160,160,170,0.25)',
                    5 + Math.random() * 3, 'steam');
            }
        }
    }
    takeDamage(dmg) {
        if (this.entering || this.crashing) return false;
        this.hp -= dmg;
        Particles.sparks(this.x + (Math.random() - 0.5) * this.width, this.y + (Math.random() - 0.5) * this.height, 3);
        if (this.hp <= 0) {
            this.startCrash();
            return true;
        }
        return false;
    }
    startCrash() {
        this.crashing = true;
        this.crashTimer = 0;
        this.crashVy = 0.5;
        this.crashVx = (Math.random() - 0.5) * 1.5;
        this.crashRotation = 0;
        this.active = true;
        Audio.bigExplode();
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                Particles.bigExplosion(
                    this.x + (Math.random() - 0.5) * this.width * 0.8,
                    this.y + (Math.random() - 0.5) * this.height * 0.8
                );
                Audio.explode();
            }, i * 200);
        }
    }
    updateCrash() {
        this.crashTimer++;
        this.crashVy += 0.08;
        this.y += this.crashVy;
        this.x += this.crashVx;
        this.crashRotation += (this.crashVx > 0 ? 0.008 : -0.008);
        this.x = Math.max(30, Math.min(450, this.x));
        // Fire trail
        if (this.crashTimer % 2 === 0) {
            for (let i = 0; i < 3; i++) {
                const ox = (Math.random() - 0.5) * this.width * 0.6;
                Particles.spawn(
                    this.x + ox, this.y - this.height * 0.2,
                    (Math.random() - 0.5) * 1.5, -1 - Math.random() * 2,
                    20 + Math.random() * 15,
                    ['#FF2200', '#FF6600', '#FFAA00', '#FF4400'][Math.floor(Math.random() * 4)],
                    3 + Math.random() * 4, 'circle'
                );
            }
            Particles.spawn(
                this.x + (Math.random() - 0.5) * this.width * 0.4,
                this.y - this.height * 0.1,
                (Math.random() - 0.5) * 0.8, -0.5 - Math.random() * 0.5,
                40 + Math.random() * 20, 'rgba(40,40,40,0.6)',
                6 + Math.random() * 5, 'steam'
            );
        }
        if (this.crashTimer % 4 === 0) {
            Particles.sparks(this.x + (Math.random() - 0.5) * this.width, this.y + (Math.random() - 0.5) * this.height, 4);
        }
        if (this.crashTimer % 12 === 0) {
            Particles.explosion(this.x + (Math.random() - 0.5) * this.width * 0.6, this.y + (Math.random() - 0.5) * this.height * 0.6, 8, ['#FF4400', '#FFAA00', '#FFDD44']);
            Audio.explode();
        }
        Audio.bossCrashRumble();
        if (this.y > 700 && !this.crashExploded) {
            this.crashExploded = true;
            this.groundExplosion();
        }
        if (this.crashTimer > 180 || (this.crashExploded && this.crashTimer > 60)) {
            this.active = false;
            this.defeated = true;
        }
    }
    groundExplosion() {
        const gx = this.x, gy = 680;
        Audio.bossImpact();
        for (let wave = 0; wave < 4; wave++) {
            setTimeout(() => {
                Particles.bigExplosion(gx + (Math.random() - 0.5) * 120, gy - Math.random() * 30);
                Particles.bigExplosion(gx + (Math.random() - 0.5) * 80, gy - Math.random() * 20);
                for (let i = 0; i < 8; i++) {
                    Particles.spawn(gx + (Math.random() - 0.5) * 100, gy, (Math.random() - 0.5) * 3, -3 - Math.random() * 5, 30 + Math.random() * 25, ['#FF2200', '#FF6600', '#FFAA00', '#FFDD44', '#FF4400'][Math.floor(Math.random() * 5)], 4 + Math.random() * 5, 'circle');
                }
                for (let i = 0; i < 5; i++) {
                    const a = -Math.PI * 0.2 - Math.random() * Math.PI * 0.6;
                    const sp = 2 + Math.random() * 4;
                    Particles.spawn(gx + (Math.random() - 0.5) * 60, gy, Math.cos(a) * sp, Math.sin(a) * sp, 40 + Math.random() * 30, '#B87333', 3 + Math.random() * 4, 'gear');
                }
                if (wave < 3) Audio.explode();
            }, wave * 150);
        }
        setTimeout(() => {
            Audio.bigExplode();
            Particles.bigExplosion(gx, gy - 10);
            for (let i = 0; i < 12; i++) {
                Particles.spawn(gx + (Math.random() - 0.5) * 140, gy - Math.random() * 20, (Math.random() - 0.5) * 1.5, -0.3 - Math.random() * 0.8, 50 + Math.random() * 30, 'rgba(60,60,60,0.5)', 8 + Math.random() * 6, 'steam');
            }
        }, 600);
    }
    onDeath() {
        // Legacy - kept for compatibility
    }
    draw(ctx) {
        if (this.crashing) { this.drawCrash(ctx); return; }
        if (this.drawFunc) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.scale(this.drawScale, this.drawScale);
            ctx.translate(-this.x, -this.y);
            this.drawFunc(this, ctx);
            ctx.restore();
        }
        // HP bar
        const bw = 280, bx = 100, by = 10;
        ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(bx - 1, by - 1, bw + 2, 14);
        const r = Math.max(0, this.hp / this.maxHp);
        const hc = r > 0.5 ? '#44DD44' : r > 0.25 ? '#DDDD44' : '#DD4444';
        ctx.fillStyle = hc; ctx.fillRect(bx, by, bw * r, 12);
        ctx.strokeStyle = '#DDB866'; ctx.lineWidth = 1.5; ctx.strokeRect(bx, by, bw, 12);
        ctx.fillStyle = '#FFF'; ctx.font = 'bold 11px Cinzel, serif'; ctx.textAlign = 'center';
        ctx.fillText(this.name + ' 【' + this.subtitle + '】', 240, 36);
    }
    drawCrash(ctx) {
        if (!this.drawFunc) return;
        ctx.save();
        // Screen shake
        if (this.crashTimer < 30 || this.crashExploded) {
            const s = this.crashExploded ? 5 : 2;
            ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
        }
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.crashRotation);
        ctx.scale(this.drawScale, this.drawScale);
        ctx.translate(-this.x, -this.y);
        // Flashing damage
        const flash = this.crashTimer % 6 < 3;
        if (flash) ctx.globalAlpha = 0.7;
        this.drawFunc(this, ctx);
        ctx.restore();
        // Ground fire glow
        if (this.crashExploded) {
            const ga = Math.max(0, 0.3 - (this.crashTimer - 60) * 0.005);
            ctx.globalAlpha = ga;
            ctx.fillStyle = '#FF4400';
            ctx.fillRect(0, 620, 480, 100);
            ctx.globalAlpha = 1;
        }
        ctx.restore();
    }
}

/* ===== Drawing helpers ===== */
function drawGear(ctx, x, y, r, teeth, angle, fill, stroke) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
    ctx.beginPath();
    for (let i = 0; i < teeth; i++) {
        const a1 = (i / teeth) * Math.PI * 2, a2 = ((i + 0.25) / teeth) * Math.PI * 2;
        const a3 = ((i + 0.5) / teeth) * Math.PI * 2, a4 = ((i + 0.75) / teeth) * Math.PI * 2;
        ctx.lineTo(Math.cos(a1) * r * 0.75, Math.sin(a1) * r * 0.75);
        ctx.lineTo(Math.cos(a2) * r, Math.sin(a2) * r);
        ctx.lineTo(Math.cos(a3) * r, Math.sin(a3) * r);
        ctx.lineTo(Math.cos(a4) * r * 0.75, Math.sin(a4) * r * 0.75);
    }
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke(); }
    ctx.beginPath(); ctx.arc(0, 0, r * 0.2, 0, Math.PI * 2);
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
    ctx.restore();
}

function drawRivet(ctx, x, y, r) {
    ctx.fillStyle = '#DDB866'; ctx.beginPath(); ctx.arc(x, y, r || 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.arc(x - 0.5, y - 0.5, (r || 1.5) * 0.4, 0, Math.PI * 2); ctx.fill();
}

function drawPipe(ctx, x1, y1, x2, y2, w, color) {
    ctx.strokeStyle = color || '#888'; ctx.lineWidth = w || 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = (w || 4) * 0.3;
    ctx.beginPath(); ctx.moveTo(x1, y1 - 1); ctx.lineTo(x2, y2 - 1); ctx.stroke();
}

function drawSteamVent(ctx, x, y, age) {
    if (age % 8 < 4) {
        ctx.fillStyle = 'rgba(200,210,220,0.15)';
        const s = 3 + Math.sin(age * 0.2) * 2;
        ctx.beginPath(); ctx.arc(x, y - s * 2, s, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + 2, y - s * 4, s * 0.7, 0, Math.PI * 2); ctx.fill();
    }
}

/* ========== BOSS DEFINITIONS ========== */
function createBoss(stageIndex) {
    return [boss1, boss2, boss3, boss4, boss5, boss6, boss7][stageIndex]();
}

function boss1() { // Iron Zeppelin - 装甲飛行船
    return new Boss({
        name: 'IRON ZEPPELIN', subtitle: '装甲飛行船', hp: 500, width: 190, height: 100, radius: 80,
        score: 30000, movePattern: 'sway', moveSpeed: 0.8, drawScale: 1.8,
        shootFunc: (b, pool, px, py) => {
            if (b.age % 40 === 0) BulletPatterns.aimSpread(pool, b.x, b.y + 25, px, py, 3, 2.5, 0.3, '#FFAA44');
            if (b.age % 80 === 0) BulletPatterns.radial(pool, b.x, b.y, 8, 1.8, '#FF8833', b.age * 0.05);
            if (b.phase >= 1 && b.age % 30 === 0) { BulletPatterns.aimed(pool, b.x - 35, b.y + 25, px, py, 3, '#FF6644'); BulletPatterns.aimed(pool, b.x + 35, b.y + 25, px, py, 3, '#FF6644'); }
            if (b.phase >= 2 && b.age % 20 === 0) BulletPatterns.radial(pool, b.x, b.y, 14, 2, '#FFCC33', b.age * 0.08);
        },
        drawFunc: (b, ctx) => {
            ctx.save(); ctx.translate(b.x, b.y);
            const age = b.age;
            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(4, 4, 52, 24, 0, 0, Math.PI * 2); ctx.fill();
            // Envelope
            const eg = ctx.createRadialGradient(-10, -10, 5, 0, 0, 48);
            eg.addColorStop(0, '#D4A050'); eg.addColorStop(0.4, '#A07030'); eg.addColorStop(0.8, '#6B4518'); eg.addColorStop(1, '#3A2008');
            ctx.fillStyle = eg; ctx.beginPath(); ctx.ellipse(0, -2, 50, 22, 0, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#5A3010'; ctx.lineWidth = 2; ctx.stroke();
            // Armor bands
            ctx.strokeStyle = '#888'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(-20, -22); ctx.lineTo(-20, 18); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, -24); ctx.lineTo(0, 20); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(20, -22); ctx.lineTo(20, 18); ctx.stroke();
            // Rivets along bands
            for (let i = -3; i <= 3; i++) { drawRivet(ctx, -20, i * 6); drawRivet(ctx, 0, i * 7); drawRivet(ctx, 20, i * 6); }
            // Side fins
            ctx.fillStyle = '#8B6914';
            ctx.beginPath(); ctx.moveTo(-48, 0); ctx.lineTo(-56, -8); ctx.lineTo(-56, 8); ctx.closePath(); ctx.fill();
            ctx.beginPath(); ctx.moveTo(48, 0); ctx.lineTo(56, -8); ctx.lineTo(56, 8); ctx.closePath(); ctx.fill();
            // Propellers (spinning)
            const pa = age * 0.4;
            for (let side of [-1, 1]) {
                ctx.save(); ctx.translate(side * 54, 0);
                ctx.fillStyle = '#DDB866'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = '#CCA855'; ctx.lineWidth = 2.5; ctx.globalAlpha = 0.7;
                for (let i = 0; i < 3; i++) { const a = pa * side + (i / 3) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 12, Math.sin(a) * 4); ctx.stroke(); }
                ctx.globalAlpha = 1; ctx.restore();
            }
            // Gondola
            ctx.fillStyle = '#4A2A10'; ctx.fillRect(-30, 18, 60, 16);
            ctx.strokeStyle = '#3A1A08'; ctx.lineWidth = 1; ctx.strokeRect(-30, 18, 60, 16);
            // Rigging
            ctx.strokeStyle = 'rgba(100,70,30,0.5)'; ctx.lineWidth = 0.8;
            for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 12, 16); ctx.lineTo(i * 10, 18); ctx.stroke(); }
            // Gondola windows
            ctx.fillStyle = '#FFD080'; ctx.globalAlpha = 0.6;
            for (let i = -3; i <= 3; i++) ctx.fillRect(i * 8 - 2, 22, 4, 4);
            ctx.globalAlpha = 1;
            // Cannons (4 underslung)
            ctx.fillStyle = '#444';
            ctx.fillRect(-36, 30, 5, 12); ctx.fillRect(-14, 32, 5, 10);
            ctx.fillRect(9, 32, 5, 10); ctx.fillRect(31, 30, 5, 12);
            // Muzzle glow during fire
            if (b.age % 40 < 5) {
                ctx.fillStyle = '#FFA033'; ctx.globalAlpha = 0.7;
                [-33.5, -11.5, 11.5, 33.5].forEach(cx => { ctx.beginPath(); ctx.arc(cx, b.age % 40 < 5 ? 42 : 34, 3, 0, Math.PI * 2); ctx.fill(); });
                ctx.globalAlpha = 1;
            }
            // Steam vents
            drawSteamVent(ctx, -40, -20, age);
            drawSteamVent(ctx, 40, -20, age);
            // Pipes on sides
            drawPipe(ctx, -45, 10, -45, 24, 3, '#777');
            drawPipe(ctx, 45, 10, 45, 24, 3, '#777');
            ctx.restore();
        }
    });
}

function boss2() { // Cathedral Crusader - 教会戦車
    return new Boss({
        name: 'CATHEDRAL CRUSADER', subtitle: '教会戦車', hp: 750, width: 170, height: 165, radius: 75,
        targetY: 140, score: 40000, movePattern: 'rushAndReturn', drawScale: 1.8,
        shootFunc: (b, pool, px, py) => {
            if (b.age % 50 === 0) { BulletPatterns.cross(pool, b.x, b.y, 2.5, '#DDAAFF', b.age * 0.02); BulletPatterns.cross(pool, b.x, b.y, 2.5, '#DDAAFF', b.age * 0.02 + Math.PI / 4); }
            if (b.age % 35 === 0) BulletPatterns.aimed(pool, b.x, b.y + 35, px, py, 3, '#FF88FF');
            if (b.phase >= 1 && b.age % 25 === 0) BulletPatterns.radial(pool, b.x, b.y, 10, 2, '#CC88FF', b.age * 0.06);
            if (b.phase >= 2 && b.age % 15 === 0) BulletPatterns.scatter(pool, b.x, b.y + 25, 3, 2.5, '#FF66FF');
        },
        drawFunc: (b, ctx) => {
            ctx.save(); ctx.translate(b.x, b.y);
            const age = b.age;
            // Caterpillar tracks
            for (let side of [-1, 1]) {
                ctx.fillStyle = '#3a3a3a';
                ctx.fillRect(side * 32 - 10, 28, 22, 20);
                ctx.strokeStyle = '#222'; ctx.lineWidth = 1.5; ctx.strokeRect(side * 32 - 10, 28, 22, 20);
                // Track segments
                ctx.fillStyle = '#555';
                for (let i = 0; i < 5; i++) ctx.fillRect(side * 32 - 8 + i * 4, 30, 2, 16);
                // Wheels
                ctx.fillStyle = '#444';
                ctx.beginPath(); ctx.arc(side * 32 - 4, 34, 4, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(side * 32 + 8, 34, 4, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(side * 32 - 4, 42, 4, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(side * 32 + 8, 42, 4, 0, Math.PI * 2); ctx.fill();
            }
            // Church body
            const wg = ctx.createLinearGradient(0, -20, 0, 30);
            wg.addColorStop(0, '#bbaacb'); wg.addColorStop(0.5, '#9a8aaa'); wg.addColorStop(1, '#7a6a8a');
            ctx.fillStyle = wg; ctx.fillRect(-28, -10, 56, 42);
            ctx.strokeStyle = '#6a5a7a'; ctx.lineWidth = 1.5; ctx.strokeRect(-28, -10, 56, 42);
            // Steeple
            ctx.fillStyle = '#8a7a9a';
            ctx.beginPath(); ctx.moveTo(0, -55); ctx.lineTo(-16, -10); ctx.lineTo(16, -10); ctx.closePath(); ctx.fill();
            ctx.strokeStyle = '#6a5a7a'; ctx.lineWidth = 1; ctx.stroke();
            // Cross (golden, ornate)
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(-2.5, -68, 5, 20); ctx.fillRect(-8, -60, 16, 5);
            // Cross glow
            ctx.globalAlpha = 0.3 + Math.sin(age * 0.05) * 0.15;
            ctx.fillStyle = '#FFEE88'; ctx.beginPath(); ctx.arc(0, -58, 10, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1;
            // Rose window (large, glowing)
            const rwg = ctx.createRadialGradient(0, 8, 2, 0, 8, 14);
            rwg.addColorStop(0, '#FFaaEE'); rwg.addColorStop(0.5, '#DD66CC'); rwg.addColorStop(1, '#883388');
            ctx.fillStyle = rwg; ctx.beginPath(); ctx.arc(0, 8, 12, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#AA77AA'; ctx.lineWidth = 1.5; ctx.stroke();
            // Stained glass pattern in rose window
            for (let i = 0; i < 8; i++) {
                const a = (i / 8) * Math.PI * 2 + age * 0.01;
                const colors = ['#FF6688', '#66AAFF', '#FFCC44', '#88FF88', '#FF88FF', '#88FFFF', '#FFAA66', '#AA88FF'];
                ctx.fillStyle = colors[i]; ctx.globalAlpha = 0.5;
                ctx.beginPath(); ctx.arc(Math.cos(a) * 7, 8 + Math.sin(a) * 7, 2.5, 0, Math.PI * 2); ctx.fill();
            }
            ctx.globalAlpha = 1;
            // Side windows (arched)
            ctx.fillStyle = '#DDAAFF'; ctx.globalAlpha = 0.6;
            for (let side of [-1, 1]) {
                ctx.beginPath(); ctx.moveTo(side * 18, 5); ctx.lineTo(side * 18, 20);
                ctx.lineTo(side * 24, 20); ctx.lineTo(side * 24, 5);
                ctx.arc(side * 21, 5, 3, 0, Math.PI, true); ctx.fill();
            }
            ctx.globalAlpha = 1;
            // Armor plates on lower body
            ctx.fillStyle = '#666';
            ctx.fillRect(-30, 22, 12, 8); ctx.fillRect(18, 22, 12, 8);
            // Rivets
            for (let r = 0; r < 8; r++) drawRivet(ctx, -28 + r * 8, -10);
            for (let r = 0; r < 8; r++) drawRivet(ctx, -28 + r * 8, 32);
            // Pipes and steam
            drawPipe(ctx, -30, 0, -38, 15, 3, '#777');
            drawPipe(ctx, 30, 0, 38, 15, 3, '#777');
            drawSteamVent(ctx, -38, 14, age);
            drawSteamVent(ctx, 38, 14, age);
            // Gears on sides
            drawGear(ctx, -34, 36, 8, 8, age * 0.03, '#8B6914', '#6B4914');
            drawGear(ctx, 34, 36, 8, 8, -age * 0.03, '#8B6914', '#6B4914');
            ctx.restore();
        }
    });
}

function boss3() { // Leviathan - 巨大蒸気船
    return new Boss({
        name: 'LEVIATHAN', subtitle: '巨大蒸気船', hp: 900, width: 270, height: 120, radius: 110,
        targetY: 100, score: 45000, movePattern: 'sway', moveSpeed: 0.5, drawScale: 1.8,
        shootFunc: (b, pool, px, py) => {
            if (b.age % 60 === 0) { BulletPatterns.aimSpread(pool, b.x - 55, b.y + 20, px, py, 3, 2.5, 0.2, '#88CCEE'); BulletPatterns.aimSpread(pool, b.x + 55, b.y + 20, px, py, 3, 2.5, 0.2, '#88CCEE'); }
            if (b.age % 45 === 0) BulletPatterns.radial(pool, b.x, b.y + 30, 6, 2, '#66AADD', b.age * 0.04);
            if (b.phase >= 1 && b.age % 30 === 0) { BulletPatterns.aimed(pool, b.x - 65, b.y, px, py, 3.5, '#AADDFF'); BulletPatterns.aimed(pool, b.x + 65, b.y, px, py, 3.5, '#AADDFF'); }
            if (b.phase >= 2 && b.age % 20 === 0) BulletPatterns.ring(pool, b.x, b.y, 16, 2, '#88EEFF', b.age * 0.03);
        },
        drawFunc: (b, ctx) => {
            ctx.save(); ctx.translate(b.x, b.y);
            const age = b.age;
            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(4, 4, 72, 28, 0, 0, Math.PI * 2); ctx.fill();
            // Hull
            const hg = ctx.createRadialGradient(-15, -8, 5, 0, 0, 70);
            hg.addColorStop(0, '#7a8a9a'); hg.addColorStop(0.5, '#5a6a7a'); hg.addColorStop(1, '#3a4a5a');
            ctx.fillStyle = hg; ctx.beginPath(); ctx.ellipse(0, 0, 70, 26, 0, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#2a3a4a'; ctx.lineWidth = 2; ctx.stroke();
            // Superstructure
            ctx.fillStyle = '#4a5a6a'; ctx.fillRect(-50, -12, 100, 24);
            ctx.strokeStyle = '#3a4a5a'; ctx.lineWidth = 1; ctx.strokeRect(-50, -12, 100, 24);
            // Bridge (island)
            ctx.fillStyle = '#5a6a7a'; ctx.fillRect(-16, -28, 32, 20);
            ctx.fillRect(-20, -20, 40, 4);
            // Smokestacks (3)
            for (let i = -1; i <= 1; i++) {
                ctx.fillStyle = '#444'; ctx.fillRect(i * 14 - 3, -38, 6, 16);
                ctx.fillStyle = '#555'; ctx.fillRect(i * 14 - 4, -26, 8, 3);
                drawSteamVent(ctx, i * 14, -40, age + i * 20);
            }
            // Turrets (fore and aft)
            for (let side of [-1, 1]) {
                ctx.fillStyle = '#666';
                ctx.beginPath(); ctx.arc(side * 45, 0, 10, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#555'; ctx.fillRect(side * 45 - 2, -14 * Math.abs(side), 4, 14);
                ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(side * 45, -14 * Math.abs(side), 3, 0, Math.PI * 2); ctx.fill();
            }
            // Broadside cannons
            ctx.fillStyle = '#444';
            for (let i = -3; i <= 3; i++) { ctx.fillRect(i * 10 - 1.5, 22, 3, 8); ctx.fillRect(i * 10 - 1.5, -28, 3, 6); }
            // Port windows
            ctx.fillStyle = '#AAE0FF'; ctx.globalAlpha = 0.5;
            for (let i = -5; i <= 5; i++) ctx.fillRect(i * 9 - 2, -8, 3, 3);
            ctx.globalAlpha = 1;
            // Pipes
            drawPipe(ctx, -55, -5, -55, 15, 3, '#777');
            drawPipe(ctx, 55, -5, 55, 15, 3, '#777');
            drawPipe(ctx, -30, -20, 30, -20, 2, '#888');
            // Rivets all along hull
            for (let i = -7; i <= 7; i++) { drawRivet(ctx, i * 9, -24, 1); drawRivet(ctx, i * 9, 24, 1); }
            // Anchor chain detail
            ctx.strokeStyle = '#555'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(-68, 10); ctx.lineTo(-68, 20); ctx.stroke();
            ctx.restore();
        }
    });
}

function boss4() { // Chronos Tower - 時計塔要塞
    return new Boss({
        name: 'CHRONOS TOWER', subtitle: '時計塔要塞', hp: 1000, width: 120, height: 200, radius: 60,
        targetY: 130, score: 50000, movePattern: 'erratic', drawScale: 1.8,
        shootFunc: (b, pool, px, py) => {
            if (b.age % 8 === 0) BulletPatterns.spiral(pool, b.x, b.y, 2, 2, '#FFD700', b.age * 0.1);
            if (b.age % 60 === 0) BulletPatterns.radial(pool, b.x, b.y, 12, 1.5, '#FFAA00', b.age * 0.05);
            if (b.phase >= 1 && b.age % 40 === 0) BulletPatterns.cross(pool, b.x, b.y - 30, 3, '#FFCC44', b.age * 0.03);
            if (b.phase >= 1 && b.age % 25 === 0) BulletPatterns.aimed(pool, b.x, b.y + 50, px, py, 3, '#FFE066');
            if (b.phase >= 2 && b.age % 5 === 0) BulletPatterns.spiral(pool, b.x, b.y, 1, 2.5, '#FFDD33', b.age * 0.15);
        },
        drawFunc: (b, ctx) => {
            ctx.save(); ctx.translate(b.x, b.y);
            const age = b.age;
            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(-22, -18, 48, 78);
            // Tower body
            const tg = ctx.createLinearGradient(-25, 0, 25, 0);
            tg.addColorStop(0, '#6B5B3A'); tg.addColorStop(0.5, '#8B7B5A'); tg.addColorStop(1, '#6B5B3A');
            ctx.fillStyle = tg; ctx.fillRect(-25, -20, 50, 75);
            ctx.strokeStyle = '#5B4B2A'; ctx.lineWidth = 1.5; ctx.strokeRect(-25, -20, 50, 75);
            // Spire
            ctx.fillStyle = '#7B6B4A';
            ctx.beginPath(); ctx.moveTo(0, -62); ctx.lineTo(-22, -20); ctx.lineTo(22, -20); ctx.closePath(); ctx.fill();
            ctx.strokeStyle = '#5B4B2A'; ctx.lineWidth = 1; ctx.stroke();
            // Spire tip ornament
            ctx.fillStyle = '#FFD700';
            ctx.beginPath(); ctx.arc(0, -62, 4, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 0.4 + Math.sin(age * 0.06) * 0.2;
            ctx.fillStyle = '#FFE866'; ctx.beginPath(); ctx.arc(0, -62, 8, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1;
            // Clock face (large)
            ctx.fillStyle = '#EEE8D5'; ctx.beginPath(); ctx.arc(0, 10, 18, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#5B4B2A'; ctx.lineWidth = 2.5; ctx.stroke();
            // Roman numerals (simplified)
            ctx.fillStyle = '#333'; ctx.font = 'bold 6px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            const nums = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
            for (let i = 0; i < 12; i++) {
                const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
                ctx.fillText(nums[i], Math.cos(a) * 13, 10 + Math.sin(a) * 13);
            }
            // Hands (rotating!)
            const ha = age * 0.008 - Math.PI / 2, ma = age * 0.05 - Math.PI / 2;
            ctx.strokeStyle = '#333'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(Math.cos(ha) * 9, 10 + Math.sin(ha) * 9); ctx.stroke();
            ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(Math.cos(ma) * 14, 10 + Math.sin(ma) * 14); ctx.stroke();
            ctx.fillStyle = '#FFD700'; ctx.beginPath(); ctx.arc(0, 10, 2, 0, Math.PI * 2); ctx.fill();
            // Decorative gears (multiple, animated)
            drawGear(ctx, -32, 30, 12, 8, age * 0.02, '#8B6914', '#6B4914');
            drawGear(ctx, 32, 30, 12, 8, -age * 0.02, '#8B6914', '#6B4914');
            drawGear(ctx, -30, 10, 8, 6, -age * 0.03, '#9B7924', '#7B5924');
            drawGear(ctx, 30, 10, 8, 6, age * 0.03, '#9B7924', '#7B5924');
            drawGear(ctx, 0, 42, 10, 7, age * 0.025, '#AB8934', '#8B6934');
            // Windows
            ctx.fillStyle = '#FFE066'; ctx.globalAlpha = 0.5;
            ctx.fillRect(-18, -15, 5, 8); ctx.fillRect(13, -15, 5, 8);
            ctx.fillRect(-18, 32, 5, 8); ctx.fillRect(13, 32, 5, 8);
            ctx.globalAlpha = 1;
            // Pipes
            drawPipe(ctx, -28, -10, -35, 20, 3, '#777');
            drawPipe(ctx, 28, -10, 35, 20, 3, '#777');
            // Steam
            drawSteamVent(ctx, -35, 18, age);
            drawSteamVent(ctx, 35, 18, age);
            // Rivets
            for (let i = 0; i < 6; i++) { drawRivet(ctx, -25, -15 + i * 14); drawRivet(ctx, 25, -15 + i * 14); }
            ctx.restore();
        }
    });
}

function boss5() { // Drachenmaschine - 蒸気機関竜
    return new Boss({
        name: 'DRACHENMASCHINE', subtitle: '蒸気機関竜', hp: 1200, width: 200, height: 150, radius: 80,
        targetY: 120, score: 55000, movePattern: 'figure8', drawScale: 1.9,
        shootFunc: (b, pool, px, py) => {
            if (b.age % 6 === 0 && b.phaseTimer % 120 < 40) BulletPatterns.scatter(pool, b.x, b.y + 35, 2, 3, '#FF4422');
            if (b.age % 50 === 0) BulletPatterns.radial(pool, b.x, b.y, 10, 2, '#FF6633', b.age * 0.07);
            if (b.phase >= 1 && b.age % 35 === 0) { BulletPatterns.spiral(pool, b.x, b.y, 3, 2.5, '#FF8844', b.age * 0.1); BulletPatterns.spiral(pool, b.x, b.y, 3, 2.5, '#FFAA44', -b.age * 0.1); }
            if (b.phase >= 2 && b.age % 15 === 0) BulletPatterns.aimSpread(pool, b.x, b.y + 25, px, py, 5, 3, 0.15, '#FF3311');
        },
        drawFunc: (b, ctx) => {
            ctx.save(); ctx.translate(b.x, b.y);
            const age = b.age;
            // Wings (flapping)
            const wa = Math.sin(age * 0.05) * 0.25;
            for (let side of [-1, 1]) {
                ctx.save(); ctx.rotate(side * wa);
                const wg = ctx.createLinearGradient(side * 10, 0, side * 55, -20);
                wg.addColorStop(0, '#7a5a4a'); wg.addColorStop(1, '#4a2a1a');
                ctx.fillStyle = wg;
                ctx.beginPath();
                ctx.moveTo(side * 12, -8); ctx.lineTo(side * 55, -30);
                ctx.lineTo(side * 50, -15); ctx.lineTo(side * 45, 5);
                ctx.lineTo(side * 12, 2);
                ctx.closePath(); ctx.fill();
                ctx.strokeStyle = '#3a1a0a'; ctx.lineWidth = 1; ctx.stroke();
                // Wing ribs (mechanical)
                ctx.strokeStyle = '#888'; ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.moveTo(side * 14, -5); ctx.lineTo(side * 50, -25); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(side * 14, 0); ctx.lineTo(side * 45, -5); ctx.stroke();
                // Rivets on wing
                drawRivet(ctx, side * 25, -12); drawRivet(ctx, side * 35, -18); drawRivet(ctx, side * 45, -10);
                ctx.restore();
            }
            // Body
            const bg = ctx.createRadialGradient(-5, -5, 5, 0, 0, 38);
            bg.addColorStop(0, '#8a6a4a'); bg.addColorStop(0.5, '#6a4a3a'); bg.addColorStop(1, '#3a2a1a');
            ctx.fillStyle = bg; ctx.beginPath(); ctx.ellipse(0, 0, 35, 24, 0, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#2a1a0a'; ctx.lineWidth = 2; ctx.stroke();
            // Armor plates on body
            ctx.fillStyle = 'rgba(100,100,100,0.3)';
            ctx.fillRect(-20, -8, 40, 4); ctx.fillRect(-15, 6, 30, 4);
            // Head
            const ha = Math.sin(age * 0.03) * 0.15;
            ctx.save(); ctx.rotate(ha);
            ctx.fillStyle = '#7a5a3a';
            ctx.beginPath(); ctx.moveTo(0, -28); ctx.lineTo(-14, -8); ctx.lineTo(14, -8); ctx.closePath(); ctx.fill();
            ctx.strokeStyle = '#4a2a1a'; ctx.lineWidth = 1; ctx.stroke();
            // Eyes (glowing red)
            ctx.fillStyle = '#FF2200';
            ctx.beginPath(); ctx.arc(-6, -18, 4, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(6, -18, 4, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#FFAA00'; ctx.globalAlpha = 0.6;
            ctx.beginPath(); ctx.arc(-6, -18, 2, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(6, -18, 2, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1;
            // Jaw / maw (fire breathing)
            ctx.fillStyle = '#5a3a2a';
            ctx.beginPath(); ctx.moveTo(-8, -10); ctx.lineTo(0, -6); ctx.lineTo(8, -10); ctx.closePath(); ctx.fill();
            // Fire from mouth during attack
            if (b.phaseTimer % 120 < 40 && age % 6 < 3) {
                const fg = ctx.createLinearGradient(0, -6, 0, 30);
                fg.addColorStop(0, '#FF6600'); fg.addColorStop(0.5, '#FF2200'); fg.addColorStop(1, 'rgba(255,0,0,0)');
                ctx.fillStyle = fg; ctx.globalAlpha = 0.7;
                ctx.beginPath(); ctx.moveTo(-6, -6); ctx.lineTo(6, -6);
                ctx.lineTo(10 + Math.random() * 4, 25 + Math.random() * 10);
                ctx.lineTo(-10 - Math.random() * 4, 25 + Math.random() * 10);
                ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
            }
            ctx.restore();
            // Tail
            ctx.strokeStyle = '#6a4a3a'; ctx.lineWidth = 6; ctx.lineCap = 'round';
            const tailX = Math.sin(age * 0.04) * 15;
            ctx.beginPath(); ctx.moveTo(0, 20); ctx.quadraticCurveTo(tailX, 40, tailX * 0.5, 50); ctx.stroke();
            // Tail tip
            ctx.fillStyle = '#555';
            ctx.beginPath(); ctx.arc(tailX * 0.5, 50, 5, 0, Math.PI * 2); ctx.fill();
            // Exhaust pipes (back)
            drawPipe(ctx, -22, 12, -30, 22, 4, '#666');
            drawPipe(ctx, 22, 12, 30, 22, 4, '#666');
            drawSteamVent(ctx, -30, 20, age);
            drawSteamVent(ctx, 30, 20, age);
            // Gears (mechanical nature)
            drawGear(ctx, -28, 0, 7, 6, age * 0.04, '#8B6914', '#6B4914');
            drawGear(ctx, 28, 0, 7, 6, -age * 0.04, '#8B6914', '#6B4914');
            // Rivets on body
            for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; drawRivet(ctx, Math.cos(a) * 30, Math.sin(a) * 20); }
            ctx.restore();
        }
    });
}

function boss6() { // Himmelschloss - 空中要塞
    return new Boss({
        name: 'HIMMELSCHLOSS', subtitle: '空中要塞', hp: 1400, width: 240, height: 170, radius: 100,
        targetY: 110, score: 60000, movePattern: 'sway', moveSpeed: 0.6, drawScale: 1.9,
        phaseThresholds: [0.7, 0.4, 0.15],
        shootFunc: (b, pool, px, py) => {
            if (b.age % 45 === 0) { for (let i = -2; i <= 2; i++) BulletPatterns.aimed(pool, b.x + i * 25, b.y + 35, px, py, 2.5, '#AADDFF'); }
            if (b.age % 60 === 0) BulletPatterns.ring(pool, b.x, b.y, 16, 1.8, '#88CCFF', b.age * 0.04);
            if (b.phase >= 1 && b.age % 35 === 0) BulletPatterns.radial(pool, b.x, b.y, 14, 2, '#66BBFF', b.age * 0.06);
            if (b.phase >= 2 && b.age % 20 === 0) { BulletPatterns.spiral(pool, b.x - 40, b.y, 2, 2.5, '#AAEEFF', b.age * 0.1); BulletPatterns.spiral(pool, b.x + 40, b.y, 2, 2.5, '#AAEEFF', -b.age * 0.1); }
            if (b.phase >= 3 && b.age % 10 === 0) BulletPatterns.scatter(pool, b.x, b.y + 30, 3, 3, '#CCDDFF');
        },
        drawFunc: (b, ctx) => {
            ctx.save(); ctx.translate(b.x, b.y);
            const age = b.age;
            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(-58, 14, 120, 38);
            // Base platform
            const pg = ctx.createLinearGradient(0, 10, 0, 45);
            pg.addColorStop(0, '#CCDDEE'); pg.addColorStop(1, '#99AABB');
            ctx.fillStyle = pg; ctx.fillRect(-58, 10, 116, 32);
            ctx.strokeStyle = '#8899AA'; ctx.lineWidth = 1.5; ctx.strokeRect(-58, 10, 116, 32);
            // Upper deck
            ctx.fillStyle = '#BBCCDD'; ctx.fillRect(-48, -10, 96, 24);
            ctx.strokeStyle = '#99AABB'; ctx.lineWidth = 1; ctx.strokeRect(-48, -10, 96, 24);
            // Towers (3)
            for (let i = -1; i <= 1; i++) {
                const tw = i === 0 ? 20 : 16, th = i === 0 ? 50 : 38;
                ctx.fillStyle = '#CCDDEE'; ctx.fillRect(i * 35 - tw / 2, -10 - th, tw, th);
                ctx.strokeStyle = '#99AABB'; ctx.lineWidth = 1; ctx.strokeRect(i * 35 - tw / 2, -10 - th, tw, th);
                // Spire
                ctx.fillStyle = '#DDEEFF';
                ctx.beginPath(); ctx.moveTo(i * 35, -10 - th - 15); ctx.lineTo(i * 35 - tw / 2 - 2, -10 - th); ctx.lineTo(i * 35 + tw / 2 + 2, -10 - th); ctx.closePath(); ctx.fill();
                // Windows
                ctx.fillStyle = '#AADDFF'; ctx.globalAlpha = 0.5;
                for (let wy = 0; wy < 3; wy++) ctx.fillRect(i * 35 - 3, -10 - th + 6 + wy * 10, 6, 5);
                ctx.globalAlpha = 1;
            }
            // Turrets (5 guns)
            ctx.fillStyle = '#778899';
            for (let i = -2; i <= 2; i++) {
                ctx.fillRect(i * 22 - 2, 38, 4, 12);
                ctx.beginPath(); ctx.arc(i * 22, 38, 4, 0, Math.PI * 2); ctx.fill();
            }
            // Propulsion (bottom glow)
            ctx.globalAlpha = 0.3 + Math.sin(age * 0.08) * 0.1;
            ctx.fillStyle = '#66AAFF';
            ctx.fillRect(-40, 42, 80, 4);
            ctx.globalAlpha = 1;
            // Gears
            drawGear(ctx, -55, 25, 8, 6, age * 0.02, '#DDB866', '#AA8836');
            drawGear(ctx, 55, 25, 8, 6, -age * 0.02, '#DDB866', '#AA8836');
            // Pipes
            drawPipe(ctx, -48, 0, -55, 20, 2, '#999');
            drawPipe(ctx, 48, 0, 55, 20, 2, '#999');
            // Rivets
            for (let i = -6; i <= 6; i++) { drawRivet(ctx, i * 8, 10, 1); drawRivet(ctx, i * 8, 42, 1); }
            // Flags on towers
            ctx.fillStyle = '#4477BB';
            ctx.fillRect(2, -76, 12, 8);
            ctx.fillRect(-35 - 8 + 2, -62, 10, 6);
            ctx.fillRect(35 + 2, -62, 10, 6);
            ctx.restore();
        }
    });
}

function boss7() { // Deus Ex Machina - 巨大機械神
    return new Boss({
        name: 'DEUS EX MACHINA', subtitle: '巨大機械神', hp: 2000, width: 210, height: 210, radius: 90,
        targetY: 130, score: 100000, movePattern: 'figure8', drawScale: 2.0,
        phaseThresholds: [0.7, 0.4, 0.15],
        shootFunc: (b, pool, px, py) => {
            if (b.age % 30 === 0) BulletPatterns.radial(pool, b.x, b.y, 12, 2, '#AA66FF', b.age * 0.05);
            if (b.age % 40 === 0) BulletPatterns.aimSpread(pool, b.x, b.y + 30, px, py, 5, 3, 0.12, '#CC88FF');
            if (b.phase >= 1 && b.age % 6 === 0) BulletPatterns.spiral(pool, b.x, b.y, 2, 2.5, '#BB77FF', b.age * 0.12);
            if (b.phase >= 2) {
                if (b.age % 25 === 0) BulletPatterns.cross(pool, b.x, b.y, 3, '#FF66FF', b.age * 0.04);
                if (b.age % 20 === 0) BulletPatterns.scatter(pool, b.x, b.y + 20, 4, 3, '#DD88FF');
            }
            if (b.phase >= 3) {
                if (b.age % 10 === 0) BulletPatterns.ring(pool, b.x, b.y, 20, 2.2, '#EE99FF', b.age * 0.08);
                if (b.age % 15 === 0) BulletPatterns.aimed(pool, b.x, b.y, px, py, 4, '#FF44FF', 'big', 8);
            }
        },
        drawFunc: (b, ctx) => {
            ctx.save(); ctx.translate(b.x, b.y);
            const age = b.age;
            // Outer gear halos (massive rotating rings)
            for (let r = 0; r < 3; r++) {
                const gr = 55 + r * 15;
                ctx.globalAlpha = 0.2 + r * 0.05;
                drawGear(ctx, 0, 0, gr, 16 + r * 4, age * 0.008 * (r % 2 === 0 ? 1 : -1), null, '#AA66FF');
            }
            ctx.globalAlpha = 1;
            // Energy field
            ctx.globalAlpha = 0.08 + Math.sin(age * 0.05) * 0.04;
            ctx.fillStyle = '#AA44FF';
            ctx.beginPath(); ctx.arc(0, 0, 50, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1;
            // Body (dark mechanical form)
            const bodyG = ctx.createRadialGradient(-5, -8, 5, 0, 0, 38);
            bodyG.addColorStop(0, '#5a4a6a'); bodyG.addColorStop(0.5, '#3a2a4a'); bodyG.addColorStop(1, '#1a1024');
            ctx.fillStyle = bodyG; ctx.beginPath(); ctx.ellipse(0, 0, 36, 42, 0, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#6a4a8a'; ctx.lineWidth = 2; ctx.stroke();
            // Armor segments
            ctx.strokeStyle = 'rgba(170,100,255,0.3)'; ctx.lineWidth = 1;
            for (let i = 0; i < 6; i++) {
                const a = (i / 6) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(Math.cos(a) * 15, Math.sin(a) * 18);
                ctx.lineTo(Math.cos(a) * 34, Math.sin(a) * 40);
                ctx.stroke();
            }
            // Face/Eyes (glowing mechanical)
            ctx.fillStyle = '#CC88FF';
            ctx.beginPath(); ctx.ellipse(-12, -12, 6, 7, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(12, -12, 6, 7, 0, 0, Math.PI * 2); ctx.fill();
            // Eye inner glow
            ctx.fillStyle = '#FFFFFF';
            ctx.globalAlpha = 0.6 + Math.sin(age * 0.1) * 0.3;
            ctx.beginPath(); ctx.arc(-12, -12, 3, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(12, -12, 3, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1;
            // Core (chest, pulsing)
            const coreGlow = 0.5 + Math.sin(age * 0.08) * 0.3;
            const coreG = ctx.createRadialGradient(0, 8, 2, 0, 8, 14);
            coreG.addColorStop(0, `rgba(255,100,255,${coreGlow})`);
            coreG.addColorStop(0.5, `rgba(200,50,200,${coreGlow * 0.7})`);
            coreG.addColorStop(1, 'rgba(100,20,100,0)');
            ctx.fillStyle = coreG; ctx.beginPath(); ctx.arc(0, 8, 14, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#FF88FF'; ctx.beginPath(); ctx.arc(0, 8, 5, 0, Math.PI * 2); ctx.fill();
            // Mechanical arms
            for (let side of [-1, 1]) {
                const armAngle = Math.sin(age * 0.035) * 0.3;
                ctx.save(); ctx.translate(side * 32, 5); ctx.rotate(side * armAngle);
                // Upper arm
                ctx.fillStyle = '#4a3a5a'; ctx.fillRect(-5, -28, 10, 30);
                ctx.strokeStyle = '#6a5a7a'; ctx.lineWidth = 1; ctx.strokeRect(-5, -28, 10, 30);
                // Elbow gear
                drawGear(ctx, 0, 2, 7, 6, age * 0.04 * side, '#8B6914', '#6B4914');
                // Forearm
                ctx.fillStyle = '#3a2a4a'; ctx.fillRect(-4, 2, 8, 25);
                // Hand (energy orb)
                ctx.fillStyle = '#AA66FF'; ctx.globalAlpha = 0.6;
                ctx.beginPath(); ctx.arc(0, 28, 8, 0, Math.PI * 2); ctx.fill();
                ctx.globalAlpha = 1;
                ctx.fillStyle = '#DDAAFF';
                ctx.beginPath(); ctx.arc(0, 28, 4, 0, Math.PI * 2); ctx.fill();
                // Pipes on arm
                drawPipe(ctx, -6, -20, -6, 20, 2, '#666');
                ctx.restore();
            }
            // Shoulder gears (large)
            drawGear(ctx, -38, -8, 10, 8, age * 0.025, '#7B5B3B', '#5B3B1B');
            drawGear(ctx, 38, -8, 10, 8, -age * 0.025, '#7B5B3B', '#5B3B1B');
            // Crown/halo element
            ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.4;
            ctx.beginPath(); ctx.arc(0, -20, 28, -Math.PI * 0.8, -Math.PI * 0.2); ctx.stroke();
            for (let i = 0; i < 5; i++) {
                const a = -Math.PI * 0.8 + (i / 4) * Math.PI * 0.6;
                ctx.fillStyle = '#FFD700';
                ctx.beginPath(); ctx.arc(Math.cos(a) * 28, -20 + Math.sin(a) * 28, 2, 0, Math.PI * 2); ctx.fill();
            }
            ctx.globalAlpha = 1;
            // Steam vents
            drawSteamVent(ctx, -40, 20, age);
            drawSteamVent(ctx, 40, 20, age);
            // Rivets
            for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; drawRivet(ctx, Math.cos(a) * 34, Math.sin(a) * 40, 1.2); }
            ctx.restore();
        }
    });
}

/* ========== MID-BOSS DEFINITIONS ========== */
function createMidBoss(stageIndex) {
    const midBosses = [
        // Stage 1: Armored Scout
        () => new Boss({
            name: 'PANZER SCOUT', subtitle: '装甲偵察艇', hp: 180, width: 65, height: 45, radius: 28,
            targetY: 130, score: 10000, movePattern: 'sway', moveSpeed: 1.2,
            phaseThresholds: [0.4],
            shootFunc: (b, pool, px, py) => {
                if (b.age % 45 === 0) BulletPatterns.aimSpread(pool, b.x, b.y + 20, px, py, 3, 2.5, 0.25, '#FFAA44');
                if (b.phase >= 1 && b.age % 30 === 0) BulletPatterns.radial(pool, b.x, b.y, 8, 2, '#FF8833', b.age * 0.06);
            },
            drawFunc: (b, ctx) => {
                ctx.save(); ctx.translate(b.x, b.y);
                const g = ctx.createRadialGradient(-5, -5, 3, 0, 0, 28);
                g.addColorStop(0, '#C08030'); g.addColorStop(1, '#6A4010');
                ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, 28, 18, 0, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = '#5A3008'; ctx.lineWidth = 2; ctx.stroke();
                ctx.fillStyle = '#444'; ctx.fillRect(-8, 16, 16, 10);
                ctx.fillRect(-22, 18, 5, 8); ctx.fillRect(17, 18, 5, 8);
                drawGear(ctx, -30, 5, 7, 6, b.age * 0.04, '#8B6914', '#6B4914');
                drawGear(ctx, 30, 5, 7, 6, -b.age * 0.04, '#8B6914', '#6B4914');
                drawSteamVent(ctx, -20, -15, b.age); drawSteamVent(ctx, 20, -15, b.age);
                for (let i = -3; i <= 3; i++) drawRivet(ctx, i * 7, -16);
                ctx.restore();
            }
        }),
        // Stage 2: Iron Monk
        () => new Boss({
            name: 'IRON MONK', subtitle: '鉄の修道士', hp: 250, width: 55, height: 65, radius: 26,
            targetY: 140, score: 12000, movePattern: 'erratic',
            phaseThresholds: [0.4],
            shootFunc: (b, pool, px, py) => {
                if (b.age % 40 === 0) BulletPatterns.cross(pool, b.x, b.y, 2, '#DDAAFF', b.age * 0.03);
                if (b.age % 50 === 0) BulletPatterns.aimed(pool, b.x, b.y + 30, px, py, 3, '#FF88FF');
                if (b.phase >= 1 && b.age % 25 === 0) BulletPatterns.radial(pool, b.x, b.y, 8, 2, '#CC88FF', b.age * 0.05);
            },
            drawFunc: (b, ctx) => {
                ctx.save(); ctx.translate(b.x, b.y);
                const g = ctx.createLinearGradient(0, -30, 0, 30);
                g.addColorStop(0, '#bbaacb'); g.addColorStop(1, '#7a6a8a');
                ctx.fillStyle = g; ctx.fillRect(-20, -25, 40, 55);
                ctx.strokeStyle = '#6a5a7a'; ctx.lineWidth = 1.5; ctx.strokeRect(-20, -25, 40, 55);
                ctx.fillStyle = '#8a7a9a';
                ctx.beginPath(); ctx.moveTo(0, -42); ctx.lineTo(-15, -25); ctx.lineTo(15, -25); ctx.closePath(); ctx.fill();
                ctx.fillStyle = '#FFD700'; ctx.fillRect(-2, -50, 4, 12); ctx.fillRect(-6, -44, 12, 4);
                const rg = ctx.createRadialGradient(0, 0, 2, 0, 0, 10);
                rg.addColorStop(0, '#FFaaEE'); rg.addColorStop(1, '#883388');
                ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
                drawSteamVent(ctx, -25, 10, b.age); drawSteamVent(ctx, 25, 10, b.age);
                drawGear(ctx, -25, 20, 6, 6, b.age * 0.03, '#8B6914', '#6B4914');
                drawGear(ctx, 25, 20, 6, 6, -b.age * 0.03, '#8B6914', '#6B4914');
                ctx.restore();
            }
        }),
        // Stage 3: Port Warden
        () => new Boss({
            name: 'PORT WARDEN', subtitle: '港湾守備艦', hp: 320, width: 80, height: 40, radius: 35,
            targetY: 120, score: 15000, movePattern: 'sway', moveSpeed: 0.7,
            phaseThresholds: [0.4],
            shootFunc: (b, pool, px, py) => {
                if (b.age % 35 === 0) { BulletPatterns.aimed(pool, b.x - 30, b.y + 15, px, py, 2.5, '#88CCEE'); BulletPatterns.aimed(pool, b.x + 30, b.y + 15, px, py, 2.5, '#88CCEE'); }
                if (b.age % 55 === 0) BulletPatterns.radial(pool, b.x, b.y, 6, 1.8, '#66AADD', b.age * 0.04);
                if (b.phase >= 1 && b.age % 25 === 0) BulletPatterns.aimSpread(pool, b.x, b.y + 20, px, py, 5, 3, 0.15, '#AADDFF');
            },
            drawFunc: (b, ctx) => {
                ctx.save(); ctx.translate(b.x, b.y);
                const g = ctx.createRadialGradient(-8, -5, 3, 0, 0, 38);
                g.addColorStop(0, '#7a8a9a'); g.addColorStop(1, '#3a4a5a');
                ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, 38, 16, 0, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = '#2a3a4a'; ctx.lineWidth = 2; ctx.stroke();
                ctx.fillStyle = '#4a5a6a'; ctx.fillRect(-28, -8, 56, 16);
                ctx.fillStyle = '#444'; ctx.fillRect(-6, -22, 12, 16);
                drawSteamVent(ctx, 0, -24, b.age);
                ctx.fillStyle = '#444';
                ctx.fillRect(-34, 12, 5, 10); ctx.fillRect(29, 12, 5, 10);
                ctx.fillRect(-12, 14, 4, 8); ctx.fillRect(8, 14, 4, 8);
                for (let i = -4; i <= 4; i++) drawRivet(ctx, i * 8, -14, 1);
                drawGear(ctx, -35, 0, 6, 6, b.age * 0.03, '#8B6914', '#6B4914');
                drawGear(ctx, 35, 0, 6, 6, -b.age * 0.03, '#8B6914', '#6B4914');
                ctx.restore();
            }
        }),
        // Stage 4: Gear Master
        () => new Boss({
            name: 'GEAR MASTER', subtitle: '歯車職人', hp: 380, width: 55, height: 55, radius: 26,
            targetY: 140, score: 18000, movePattern: 'erratic',
            phaseThresholds: [0.4],
            shootFunc: (b, pool, px, py) => {
                if (b.age % 10 === 0) BulletPatterns.spiral(pool, b.x, b.y, 1, 2, '#FFD700', b.age * 0.12);
                if (b.age % 50 === 0) BulletPatterns.radial(pool, b.x, b.y, 10, 1.5, '#FFAA00', b.age * 0.05);
                if (b.phase >= 1 && b.age % 30 === 0) BulletPatterns.cross(pool, b.x, b.y, 2.5, '#FFCC44', b.age * 0.04);
            },
            drawFunc: (b, ctx) => {
                ctx.save(); ctx.translate(b.x, b.y);
                drawGear(ctx, 0, 0, 28, 12, b.age * 0.015, '#8B7B3A', '#6B5B2A');
                drawGear(ctx, 0, 0, 18, 8, -b.age * 0.025, '#AB9B5A', '#8B7B4A');
                ctx.fillStyle = '#EEE8D5'; ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = '#5B4B2A'; ctx.lineWidth = 1.5; ctx.stroke();
                const ha = b.age * 0.01 - Math.PI / 2, ma = b.age * 0.06 - Math.PI / 2;
                ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.lineCap = 'round';
                ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(ha) * 6, Math.sin(ha) * 6); ctx.stroke();
                ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(ma) * 8, Math.sin(ma) * 8); ctx.stroke();
                ctx.fillStyle = '#FFD700'; ctx.beginPath(); ctx.arc(0, 0, 2, 0, Math.PI * 2); ctx.fill();
                drawSteamVent(ctx, -22, -18, b.age); drawSteamVent(ctx, 22, -18, b.age);
                ctx.restore();
            }
        }),
        // Stage 5: Forge Guardian
        () => new Boss({
            name: 'FORGE GUARDIAN', subtitle: '鍛冶場の守護者', hp: 450, width: 70, height: 60, radius: 30,
            targetY: 130, score: 20000, movePattern: 'figure8',
            phaseThresholds: [0.4],
            shootFunc: (b, pool, px, py) => {
                if (b.age % 30 === 0) BulletPatterns.aimSpread(pool, b.x, b.y + 25, px, py, 4, 3, 0.2, '#FF6644');
                if (b.age % 50 === 0) BulletPatterns.radial(pool, b.x, b.y, 10, 2, '#FF4422', b.age * 0.06);
                if (b.phase >= 1 && b.age % 20 === 0) BulletPatterns.scatter(pool, b.x, b.y + 20, 3, 2.5, '#FFAA44');
            },
            drawFunc: (b, ctx) => {
                ctx.save(); ctx.translate(b.x, b.y);
                const g = ctx.createRadialGradient(-5, -5, 3, 0, 0, 32);
                g.addColorStop(0, '#8a5a3a'); g.addColorStop(1, '#3a1a0a');
                ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, 32, 26, 0, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = '#2a0a00'; ctx.lineWidth = 2; ctx.stroke();
                ctx.fillStyle = '#FF4400'; ctx.globalAlpha = 0.4 + Math.sin(b.age * 0.08) * 0.2;
                ctx.beginPath(); ctx.arc(0, 5, 12, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
                ctx.fillStyle = '#FF2200';
                ctx.beginPath(); ctx.arc(-8, -8, 4, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(8, -8, 4, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#FFCC00'; ctx.beginPath(); ctx.arc(-8, -8, 2, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(8, -8, 2, 0, Math.PI * 2); ctx.fill();
                drawGear(ctx, -30, 15, 8, 6, b.age * 0.03, '#8B6914', '#6B4914');
                drawGear(ctx, 30, 15, 8, 6, -b.age * 0.03, '#8B6914', '#6B4914');
                drawPipe(ctx, -28, -5, -35, 10, 3, '#666'); drawPipe(ctx, 28, -5, 35, 10, 3, '#666');
                drawSteamVent(ctx, -35, 8, b.age); drawSteamVent(ctx, 35, 8, b.age);
                ctx.restore();
            }
        }),
        // Stage 6: Sky Sentinel
        () => new Boss({
            name: 'SKY SENTINEL', subtitle: '空の番人', hp: 520, width: 75, height: 55, radius: 32,
            targetY: 120, score: 22000, movePattern: 'sway', moveSpeed: 0.9,
            phaseThresholds: [0.4],
            shootFunc: (b, pool, px, py) => {
                if (b.age % 35 === 0) { for (let i = -1; i <= 1; i++) BulletPatterns.aimed(pool, b.x + i * 20, b.y + 25, px, py, 2.5, '#AADDFF'); }
                if (b.age % 50 === 0) BulletPatterns.ring(pool, b.x, b.y, 12, 1.8, '#88CCFF', b.age * 0.04);
                if (b.phase >= 1 && b.age % 25 === 0) BulletPatterns.radial(pool, b.x, b.y, 10, 2, '#66BBFF', b.age * 0.06);
            },
            drawFunc: (b, ctx) => {
                ctx.save(); ctx.translate(b.x, b.y);
                const pg = ctx.createLinearGradient(0, -20, 0, 20);
                pg.addColorStop(0, '#CCDDEE'); pg.addColorStop(1, '#99AABB');
                ctx.fillStyle = pg; ctx.fillRect(-35, -18, 70, 36);
                ctx.strokeStyle = '#8899AA'; ctx.lineWidth = 1.5; ctx.strokeRect(-35, -18, 70, 36);
                ctx.fillStyle = '#BBCCDD'; ctx.fillRect(-12, -35, 24, 20);
                ctx.fillStyle = '#DDEEFF';
                ctx.beginPath(); ctx.moveTo(0, -45); ctx.lineTo(-14, -35); ctx.lineTo(14, -35); ctx.closePath(); ctx.fill();
                ctx.fillStyle = '#778899';
                for (let i = -1; i <= 1; i++) { ctx.fillRect(i * 25 - 2, 14, 4, 12); ctx.beginPath(); ctx.arc(i * 25, 14, 4, 0, Math.PI * 2); ctx.fill(); }
                ctx.globalAlpha = 0.3 + Math.sin(b.age * 0.08) * 0.1;
                ctx.fillStyle = '#66AAFF'; ctx.fillRect(-25, 26, 50, 3); ctx.globalAlpha = 1;
                drawGear(ctx, -38, 5, 7, 6, b.age * 0.025, '#DDB866', '#AA8836');
                drawGear(ctx, 38, 5, 7, 6, -b.age * 0.025, '#DDB866', '#AA8836');
                drawSteamVent(ctx, -30, -16, b.age); drawSteamVent(ctx, 30, -16, b.age);
                for (let i = -4; i <= 4; i++) drawRivet(ctx, i * 7, -18, 1);
                ctx.restore();
            }
        }),
        // Stage 7: Vanguard Automaton
        () => new Boss({
            name: 'VANGUARD', subtitle: '前衛自動兵', hp: 600, width: 65, height: 70, radius: 30,
            targetY: 130, score: 25000, movePattern: 'figure8',
            phaseThresholds: [0.5, 0.2],
            shootFunc: (b, pool, px, py) => {
                if (b.age % 25 === 0) BulletPatterns.radial(pool, b.x, b.y, 10, 2, '#AA66FF', b.age * 0.05);
                if (b.age % 35 === 0) BulletPatterns.aimSpread(pool, b.x, b.y + 25, px, py, 4, 3, 0.15, '#CC88FF');
                if (b.phase >= 1 && b.age % 8 === 0) BulletPatterns.spiral(pool, b.x, b.y, 1, 2.5, '#BB77FF', b.age * 0.1);
                if (b.phase >= 2 && b.age % 20 === 0) BulletPatterns.cross(pool, b.x, b.y, 3, '#FF66FF', b.age * 0.04);
            },
            drawFunc: (b, ctx) => {
                ctx.save(); ctx.translate(b.x, b.y);
                drawGear(ctx, 0, 0, 35, 12, b.age * 0.01, null, '#AA66FF');
                ctx.globalAlpha = 0.08 + Math.sin(b.age * 0.05) * 0.04;
                ctx.fillStyle = '#AA44FF'; ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.fill();
                ctx.globalAlpha = 1;
                const g = ctx.createRadialGradient(-3, -5, 3, 0, 0, 24);
                g.addColorStop(0, '#5a4a6a'); g.addColorStop(1, '#1a1024');
                ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, 24, 28, 0, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = '#6a4a8a'; ctx.lineWidth = 2; ctx.stroke();
                ctx.fillStyle = '#CC88FF';
                ctx.beginPath(); ctx.arc(-8, -8, 4, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(8, -8, 4, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#FFF'; ctx.globalAlpha = 0.6 + Math.sin(b.age * 0.1) * 0.3;
                ctx.beginPath(); ctx.arc(-8, -8, 2, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(8, -8, 2, 0, Math.PI * 2); ctx.fill();
                ctx.globalAlpha = 1;
                const cg = 0.5 + Math.sin(b.age * 0.08) * 0.3;
                ctx.fillStyle = `rgba(255,100,255,${cg})`; ctx.beginPath(); ctx.arc(0, 6, 8, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#FF88FF'; ctx.beginPath(); ctx.arc(0, 6, 3, 0, Math.PI * 2); ctx.fill();
                drawGear(ctx, -28, 10, 7, 6, b.age * 0.04, '#7B5B3B', '#5B3B1B');
                drawGear(ctx, 28, 10, 7, 6, -b.age * 0.04, '#7B5B3B', '#5B3B1B');
                drawSteamVent(ctx, -25, -20, b.age); drawSteamVent(ctx, 25, -20, b.age);
                ctx.restore();
            }
        })
    ];
    return midBosses[stageIndex % midBosses.length]();
}
