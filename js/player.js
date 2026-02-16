/* ============================================
   Player Ship - Premium Steampunk Airship
   ============================================ */
class Player {
    constructor() {
        this.x = 240; this.y = 600;
        this.speed = 4.5; this.slowSpeed = 2;
        this.hitboxRadius = 2.5; this.grazeRadius = 18;
        this.width = 28; this.height = 32;
        this.lives = 3; this.bombs = 3;
        this.power = 0; this.maxPower = 4;
        this.score = 0; this.graze = 0;
        this.invincible = 0; this.bombActive = 0;
        this.shootCooldown = 0; this.shootInterval = 5;
        this.active = true; this.respawnTimer = 0;
        this.animFrame = 0; this.tilt = 0;
        this.thrusterFlicker = 0;
        this.barrier = 0;
    }

    reset(difficulty) {
        this.x = 240; this.y = 600;
        this.lives = difficulty.lives; this.bombs = difficulty.bombs;
        this.power = 0; this.score = 0; this.graze = 0;
        this.invincible = 120; this.bombActive = 0;
        this.active = true; this.respawnTimer = 0;
        this.barrier = 0;
    }

    update(playerBullets) {
        if (this.respawnTimer > 0) {
            this.respawnTimer--;
            if (this.respawnTimer <= 0) {
                this.active = true; this.invincible = 180;
                this.x = 240; this.y = 600;
            }
            return;
        }
        if (!this.active) return;

        const spd = Input.isSlow() ? this.slowSpeed : this.speed;
        this.tilt = 0;

        // Touch analog movement (proportional speed)
        const tx = Input.touchAxis('x');
        const ty = Input.touchAxis('y');
        if (tx !== 0 || ty !== 0) {
            this.x += tx * spd;
            this.y += ty * spd;
            if (tx < -0.1) this.tilt = -1;
            else if (tx > 0.1) this.tilt = 1;
        }
        // Keyboard digital movement (full speed, layered on top)
        if (Input.keys['ArrowLeft'] || Input.keys['KeyA']) { this.x -= spd; this.tilt = -1; }
        if (Input.keys['ArrowRight'] || Input.keys['KeyD']) { this.x += spd; this.tilt = 1; }
        if (Input.keys['ArrowUp'] || Input.keys['KeyW']) this.y -= spd;
        if (Input.keys['ArrowDown'] || Input.keys['KeyS']) this.y += spd;
        this.x = Math.max(14, Math.min(466, this.x));
        this.y = Math.max(14, Math.min(706, this.y));

        this.shootCooldown--;
        if (Input.isDown('KeyZ') && this.shootCooldown <= 0) {
            this.shoot(playerBullets); this.shootCooldown = this.shootInterval;
        }
        if (Input.wasPressed('KeyX') && this.bombs > 0 && this.bombActive <= 0) this.useBomb();
        if (this.invincible > 0) this.invincible--;
        if (this.bombActive > 0) this.bombActive--;
        this.animFrame++;
        this.thrusterFlicker = Math.random();
    }

    shoot(pool) {
        Audio.shoot();
        const pw = this.power;
        pool.fire(this.x, this.y - 18, 0, -11, 3, '#88DDFF', 'diamond', 3);
        if (pw >= 1) {
            pool.fire(this.x - 10, this.y - 14, -0.4, -10, 2.5, '#66BBDD', 'diamond', 2);
            pool.fire(this.x + 10, this.y - 14, 0.4, -10, 2.5, '#66BBDD', 'diamond', 2);
        }
        if (pw >= 2) {
            pool.fire(this.x - 18, this.y - 8, -1, -9, 2.5, '#88DDFF', 'diamond', 2);
            pool.fire(this.x + 18, this.y - 8, 1, -9, 2.5, '#88DDFF', 'diamond', 2);
        }
        if (pw >= 3) {
            pool.fire(this.x - 5, this.y - 18, -0.15, -11, 2, '#AAEEFF', 'diamond', 2);
            pool.fire(this.x + 5, this.y - 18, 0.15, -11, 2, '#AAEEFF', 'diamond', 2);
        }
        if (pw >= 4) {
            pool.fire(this.x - 24, this.y - 4, -1.8, -8, 2, '#66EEFF', 'diamond', 1.5);
            pool.fire(this.x + 24, this.y - 4, 1.8, -8, 2, '#66EEFF', 'diamond', 1.5);
        }
    }

    useBomb() { this.bombs--; this.bombActive = 90; this.invincible = 100; Audio.bomb(); }

    hit() {
        if (this.invincible > 0 || this.bombActive > 0) return false;
        this.lives--; this.active = false;
        this.power = Math.max(0, this.power - 1);
        this.barrier = 0;
        Audio.playerHit();
        // Multi-phase death explosion
        Particles.bigExplosion(this.x, this.y);
        // Secondary delayed explosion
        const px = this.x, py = this.y;
        setTimeout(() => {
            Particles.explosion(px, py, 20, ['#FF2200', '#FF6600', '#FFAA00', '#FFDD44']);
            for (let i = 0; i < 6; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 0.8 + Math.random() * 1.2;
                Particles.spawn(px, py, Math.cos(angle) * speed, Math.sin(angle) * speed,
                    35 + Math.random() * 20, '#B87333', 4 + Math.random() * 3, 'gear');
            }
        }, 80);
        // Final debris spray
        setTimeout(() => {
            Particles.explosion(px, py, 12, ['#888888', '#666666', '#AA8844', '#BB7733']);
        }, 200);
        if (this.lives >= 0) this.respawnTimer = 60;
        return true;
    }

    addPower() {
        if (this.power < this.maxPower) { this.power++; Audio.powerUp(); }
        else this.score += 1000;
    }

    draw(ctx) {
        if (!this.active) return;
        if (this.invincible > 0 && Math.floor(this.invincible / 3) % 2 === 0) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        const tilt = this.tilt * 4;
        const af = this.animFrame;

        // === Thruster flames (3 engines) ===
        const drawFlame = (fx, fy, size) => {
            const len = size * (6 + this.thrusterFlicker * 8);
            const g = ctx.createLinearGradient(fx, fy, fx, fy + len);
            g.addColorStop(0, '#AAEEFF');
            g.addColorStop(0.3, '#44AADD');
            g.addColorStop(0.7, '#2266AA');
            g.addColorStop(1, 'transparent');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(fx - size * 2.5, fy);
            ctx.lineTo(fx + size * 2.5, fy);
            ctx.lineTo(fx + (Math.random() - 0.5) * 2, fy + len);
            ctx.closePath();
            ctx.fill();
        };
        drawFlame(tilt, 16, 1.2);
        drawFlame(tilt - 10, 14, 0.7);
        drawFlame(tilt + 10, 14, 0.7);

        // === Wing struts (side pontoons) ===
        ctx.fillStyle = '#7a5a2a';
        ctx.strokeStyle = '#5a3a1a';
        ctx.lineWidth = 0.8;
        // Left pontoon
        ctx.beginPath();
        ctx.moveTo(-22 + tilt, 0);
        ctx.lineTo(-26 + tilt, 4);
        ctx.lineTo(-26 + tilt, 14);
        ctx.lineTo(-20 + tilt, 16);
        ctx.lineTo(-16 + tilt, 14);
        ctx.lineTo(-16 + tilt, 4);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
        // Right pontoon
        ctx.beginPath();
        ctx.moveTo(22 + tilt, 0);
        ctx.lineTo(26 + tilt, 4);
        ctx.lineTo(26 + tilt, 14);
        ctx.lineTo(20 + tilt, 16);
        ctx.lineTo(16 + tilt, 14);
        ctx.lineTo(16 + tilt, 4);
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        // === Main hull (brass airship body) ===
        // Hull shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(tilt + 2, 4, 14, 18, 0, 0, Math.PI * 2);
        ctx.fill();

        // Hull body
        const hullGrad = ctx.createRadialGradient(tilt - 3, -4, 2, tilt, 2, 18);
        hullGrad.addColorStop(0, '#E8C880');
        hullGrad.addColorStop(0.4, '#C89848');
        hullGrad.addColorStop(0.8, '#A07030');
        hullGrad.addColorStop(1, '#7a5020');
        ctx.fillStyle = hullGrad;
        ctx.beginPath();
        ctx.ellipse(tilt, 0, 13, 17, 0, 0, Math.PI * 2);
        ctx.fill();

        // Hull edge
        ctx.strokeStyle = '#8B6914';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(tilt, 0, 13, 17, 0, 0, Math.PI * 2);
        ctx.stroke();

        // === Cockpit (glowing blue dome) ===
        const cockpitGrad = ctx.createRadialGradient(tilt - 1, -5, 1, tilt, -3, 8);
        cockpitGrad.addColorStop(0, '#AAEEFF');
        cockpitGrad.addColorStop(0.5, '#55AADD');
        cockpitGrad.addColorStop(1, '#2266AA');
        ctx.fillStyle = cockpitGrad;
        ctx.beginPath();
        ctx.ellipse(tilt, -4, 6, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        // Cockpit frame
        ctx.strokeStyle = '#DDB866';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(tilt, -4, 6, 7, 0, 0, Math.PI * 2);
        ctx.stroke();
        // Cockpit cross-frame
        ctx.beginPath();
        ctx.moveTo(tilt - 6, -4); ctx.lineTo(tilt + 6, -4);
        ctx.moveTo(tilt, -11); ctx.lineTo(tilt, 3);
        ctx.stroke();

        // === Rivets along hull ===
        ctx.fillStyle = '#DDB866';
        for (let i = 0; i < 10; i++) {
            const a = (i / 10) * Math.PI * 2;
            ctx.beginPath();
            ctx.arc(tilt + Math.cos(a) * 11, Math.sin(a) * 14, 1, 0, Math.PI * 2);
            ctx.fill();
        }

        // === Propellers (top, spinning) ===
        const propAngle = af * 0.35;
        ctx.save();
        ctx.translate(tilt, -16);
        // prop hub
        ctx.fillStyle = '#DDB866';
        ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, Math.PI * 2); ctx.fill();
        // blades (4)
        ctx.strokeStyle = '#CCA855';
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = 0.7;
        for (let i = 0; i < 4; i++) {
            const ba = propAngle + (i / 4) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(ba) * 10, Math.sin(ba) * 3);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.restore();

        // === Small wing fins ===
        ctx.fillStyle = '#8B6914';
        // Left fin
        ctx.beginPath();
        ctx.moveTo(-12 + tilt, 8);
        ctx.lineTo(-22 + tilt, 2);
        ctx.lineTo(-20 + tilt, 8);
        ctx.closePath();
        ctx.fill();
        // Right fin
        ctx.beginPath();
        ctx.moveTo(12 + tilt, 8);
        ctx.lineTo(22 + tilt, 2);
        ctx.lineTo(20 + tilt, 8);
        ctx.closePath();
        ctx.fill();

        // === Belly cannon ===
        ctx.fillStyle = '#555';
        ctx.fillRect(tilt - 2, 12, 4, 6);
        ctx.fillStyle = '#333';
        ctx.beginPath(); ctx.arc(tilt, 12, 3, 0, Math.PI * 2); ctx.fill();

        ctx.restore();

        // === Barrier shield (yellow energy) ===
        if (this.barrier > 0) {
            ctx.save();
            const bPulse = 0.4 + Math.sin(af * 0.12) * 0.15;
            const bRadius = 22 + Math.sin(af * 0.08) * 3;
            for (let i = 0; i < this.barrier; i++) {
                const r = bRadius + i * 5;
                ctx.globalAlpha = bPulse * (1 - i * 0.2);
                ctx.strokeStyle = i === 0 ? '#FFE744' : '#FFCC00';
                ctx.lineWidth = 2.5 - i * 0.5;
                ctx.beginPath();
                ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
                ctx.stroke();
            }
            // Inner glow
            ctx.globalAlpha = bPulse * 0.12;
            ctx.fillStyle = '#FFE744';
            ctx.beginPath();
            ctx.arc(this.x, this.y, bRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // === Focus hitbox (slow mode) ===
        if (Input.isSlow()) {
            ctx.save();
            ctx.strokeStyle = '#FF4444';
            ctx.lineWidth = 1.5;
            const pulse = 0.6 + Math.sin(af * 0.2) * 0.3;
            ctx.globalAlpha = pulse;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.hitboxRadius + 4, 0, Math.PI * 2);
            ctx.stroke();
            // inner dot
            ctx.fillStyle = '#FF4444';
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // === Bomb effect (massive explosion with shockwave) ===
        if (this.bombActive > 0) {
            const ba = this.bombActive / 90;
            const br = (90 - this.bombActive) * 6;
            const time = 90 - this.bombActive;
            ctx.save();

            // Screen shake effect
            if (time < 20) {
                const shake = (20 - time) * 0.3;
                ctx.translate(
                    (Math.random() - 0.5) * shake,
                    (Math.random() - 0.5) * shake
                );
            }

            // Outer blast glow (large, soft)
            const outerGrad = ctx.createRadialGradient(this.x, this.y, br * 0.3, this.x, this.y, br * 1.2);
            outerGrad.addColorStop(0, `rgba(100,200,255,${ba * 0.15})`);
            outerGrad.addColorStop(0.5, `rgba(50,150,255,${ba * 0.08})`);
            outerGrad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = outerGrad;
            ctx.fillRect(0, 0, 480, 720);

            // Inner blast fill (bright core)
            const coreGrad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, br * 0.5);
            coreGrad.addColorStop(0, `rgba(200,240,255,${ba * 0.3})`);
            coreGrad.addColorStop(0.4, `rgba(100,200,255,${ba * 0.15})`);
            coreGrad.addColorStop(1, 'rgba(0,50,100,0)');
            ctx.fillStyle = coreGrad;
            ctx.beginPath(); ctx.arc(this.x, this.y, br * 0.5, 0, Math.PI * 2); ctx.fill();

            // Primary shockwave ring (thick, bright)
            ctx.globalAlpha = ba * 0.7;
            ctx.strokeStyle = '#AAEEFF';
            ctx.lineWidth = 5 + ba * 3;
            ctx.beginPath(); ctx.arc(this.x, this.y, br, 0, Math.PI * 2); ctx.stroke();

            // Secondary shockwave ring (thin, trailing)
            ctx.globalAlpha = ba * 0.5;
            ctx.strokeStyle = '#66CCFF';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(this.x, this.y, br * 0.85, 0, Math.PI * 2); ctx.stroke();

            // Inner energy ring (pulsing)
            const pulseR = br * 0.6 + Math.sin(time * 0.5) * 8;
            ctx.globalAlpha = ba * 0.45;
            ctx.strokeStyle = '#DDEEFF';
            ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.arc(this.x, this.y, pulseR, 0, Math.PI * 2); ctx.stroke();

            // Radial energy rays
            if (time < 45) {
                ctx.globalAlpha = ba * 0.25;
                ctx.strokeStyle = '#88DDFF';
                ctx.lineWidth = 1;
                const rays = 16;
                for (let i = 0; i < rays; i++) {
                    const a = (i / rays) * Math.PI * 2 + time * 0.02;
                    const r1 = br * 0.2;
                    const r2 = br * (0.7 + Math.sin(i * 1.7 + time * 0.1) * 0.2);
                    ctx.beginPath();
                    ctx.moveTo(this.x + Math.cos(a) * r1, this.y + Math.sin(a) * r1);
                    ctx.lineTo(this.x + Math.cos(a) * r2, this.y + Math.sin(a) * r2);
                    ctx.stroke();
                }
            }

            // Debris particles along shockwave edge
            if (time < 60 && time % 2 === 0) {
                for (let i = 0; i < 3; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const dist = br * (0.9 + Math.random() * 0.2);
                    Particles.spawn(
                        this.x + Math.cos(angle) * dist,
                        this.y + Math.sin(angle) * dist,
                        Math.cos(angle) * 1.5, Math.sin(angle) * 1.5,
                        15 + Math.random() * 10,
                        Math.random() < 0.5 ? '#88DDFF' : '#FFAA44',
                        2 + Math.random() * 2,
                        Math.random() < 0.3 ? 'spark' : 'circle'
                    );
                }
            }

            // Fire/sparks near center during early frames
            if (time < 25 && time % 3 === 0) {
                for (let i = 0; i < 4; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 2 + Math.random() * 3;
                    Particles.spawn(
                        this.x, this.y,
                        Math.cos(angle) * speed, Math.sin(angle) * speed,
                        20 + Math.random() * 15,
                        ['#FF6633', '#FFAA33', '#FFDD44', '#66CCFF'][Math.floor(Math.random() * 4)],
                        3 + Math.random() * 3, 'circle'
                    );
                }
            }

            // Ongoing rumble sound
            Audio.bombRumble();

            ctx.restore();
        }
    }
}
