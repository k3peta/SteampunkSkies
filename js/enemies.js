/* ============================================
   Enemy Types - Premium Steampunk Designs
   ============================================ */
class Enemy {
    constructor(type, x, y, config = {}) {
        this.type = type; this.x = x; this.y = y;
        this.vx = config.vx || 0; this.vy = config.vy || 1;
        this.hp = config.hp || 5; this.maxHp = this.hp;
        this.shootTimer = config.shootDelay || 60;
        this.shootInterval = config.shootInterval || 90;
        this.active = true; this.age = 0;
        this.scoreValue = config.score || 100;
        this.width = config.width || 24; this.height = config.height || 24;
        this.radius = config.radius || 12;
        this.behavior = config.behavior || 'linear';
        this.behaviorData = config.behaviorData || {};
        this.color = config.color || '#AA6633';
        this.animFrame = 0;
        this.willDropItem = config.willDropItem || false;
    }

    update(enemyBullets, playerX, playerY) {
        this.age++; this.animFrame++;
        switch (this.behavior) {
            case 'linear': this.x += this.vx; this.y += this.vy; break;
            case 'sine':
                this.x += this.vx + Math.sin(this.age * 0.05) * (this.behaviorData.amplitude || 2);
                this.y += this.vy; break;
            case 'swoop':
                if (this.age < (this.behaviorData.swoopTime || 60)) { this.y += this.vy; }
                else { this.vx += (this.behaviorData.swoopDir || 1) * 0.1; this.x += this.vx; this.y += this.vy * 0.3; }
                break;
            case 'hover':
                if (this.y < (this.behaviorData.hoverY || 150)) { this.y += this.vy; }
                else { this.x += Math.sin(this.age * 0.02) * 1; } break;
            case 'zigzag': this.x += Math.sign(Math.sin(this.age * 0.03)) * 2; this.y += this.vy; break;
        }
        this.shootTimer--;
        if (this.shootTimer <= 0 && this.y > 0 && this.y < 600) {
            this.shoot(enemyBullets, playerX, playerY);
            this.shootTimer = this.shootInterval;
        }
        if (this.y > 800 || this.y < -100 || this.x < -80 || this.x > 560) this.active = false;
    }

    shoot(pool, px, py) {
        switch (this.type) {
            case 'ornithopter': BulletPatterns.aimed(pool, this.x, this.y, px, py, 2.5, '#DD8844'); break;
            case 'airship': BulletPatterns.aimSpread(pool, this.x, this.y, px, py, 3, 2, 0.2, '#DDAA44'); break;
            case 'fighter': BulletPatterns.aimed(pool, this.x, this.y, px, py, 4, '#FF5544', 'circle', 3); break;
            case 'gunship': BulletPatterns.radial(pool, this.x, this.y, 8, 2, '#FFCC33', this.age * 0.1); break;
            case 'drone': BulletPatterns.aimed(pool, this.x, this.y, px, py, 3, '#88FF88'); break;
            case 'turret': BulletPatterns.aimSpread(pool, this.x, this.y, px, py, 5, 2.5, 0.15, '#FF7766'); break;
            case 'heavyAirship':
                BulletPatterns.radial(pool, this.x, this.y, 12, 2, '#FFAA33', this.age * 0.05);
                BulletPatterns.aimed(pool, this.x, this.y, px, py, 3, '#FF6644', 'big', 6); break;
        }
        Audio.enemyShoot();
    }

    takeDamage(dmg) {
        this.hp -= dmg; Particles.sparks(this.x, this.y, 2);
        if (this.hp <= 0) { this.active = false; this.onDeath(); return true; }
        return false;
    }
    onDeath() {
        if (this.type === 'balloon') { Particles.bigExplosion(this.x, this.y); Audio.bigExplode(); }
        else { Particles.explosion(this.x, this.y, 10); Audio.explode(); }
    }

    draw(ctx) {
        ctx.save(); ctx.translate(this.x, this.y);
        // Item carrier glow
        if (this.willDropItem) {
            const gPulse = 0.15 + Math.sin(this.animFrame * 0.08) * 0.08;
            ctx.globalAlpha = gPulse;
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 1.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = gPulse * 0.6;
            ctx.fillStyle = '#FFEE88';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 1.6, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
        ctx.scale(1.4, 1.4);
        switch (this.type) {
            case 'ornithopter': this.drawOrnithopter(ctx); break;
            case 'airship': this.drawAirship(ctx); break;
            case 'fighter': this.drawFighter(ctx); break;
            case 'gunship': this.drawGunship(ctx); break;
            case 'balloon': this.drawBalloon(ctx); break;
            case 'drone': this.drawDrone(ctx); break;
            case 'turret': this.drawTurret(ctx); break;
            case 'heavyAirship': this.drawHeavyAirship(ctx); break;
            default: ctx.fillStyle = this.color; ctx.fillRect(-12, -12, 24, 24);
        }
        ctx.restore();
        // HP bar for tough enemies
        if (this.maxHp > 10) {
            const bw = this.width, r = this.hp / this.maxHp;
            ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(this.x - bw / 2 - 1, this.y - this.height / 2 - 8, bw + 2, 5);
            ctx.fillStyle = r > 0.5 ? '#44DD44' : r > 0.25 ? '#DDDD44' : '#DD4444';
            ctx.fillRect(this.x - bw / 2, this.y - this.height / 2 - 7, bw * r, 3);
        }
    }

    /* ======= PREMIUM ENEMY DRAWINGS ======= */

    drawOrnithopter(ctx) {
        const af = this.animFrame;
        const wingAngle = Math.sin(af * 0.4) * 0.6;
        // Body - sleek insectoid
        const bodyGrad = ctx.createLinearGradient(0, -10, 0, 10);
        bodyGrad.addColorStop(0, '#C49530'); bodyGrad.addColorStop(1, '#7A5A18');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.moveTo(0, -12); ctx.lineTo(-5, -2); ctx.lineTo(-4, 10);
        ctx.lineTo(0, 12); ctx.lineTo(4, 10); ctx.lineTo(5, -2);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#5A3A08'; ctx.lineWidth = 0.8; ctx.stroke();
        // Wings (flapping)
        ctx.save(); ctx.rotate(wingAngle);
        const wingGrad = ctx.createLinearGradient(-20, 0, 0, 0);
        wingGrad.addColorStop(0, 'rgba(200,160,60,0.3)'); wingGrad.addColorStop(1, 'rgba(200,160,60,0.8)');
        ctx.fillStyle = wingGrad;
        ctx.beginPath(); ctx.moveTo(-3, -3); ctx.lineTo(-22, -8); ctx.lineTo(-20, 3); ctx.lineTo(-3, 2); ctx.closePath(); ctx.fill();
        // Wing veins
        ctx.strokeStyle = 'rgba(120,80,20,0.3)'; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(-3, -1); ctx.lineTo(-20, -5); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-3, 1); ctx.lineTo(-18, 1); ctx.stroke();
        ctx.restore();
        ctx.save(); ctx.rotate(-wingAngle);
        ctx.fillStyle = wingGrad;
        ctx.beginPath(); ctx.moveTo(3, -3); ctx.lineTo(22, -8); ctx.lineTo(20, 3); ctx.lineTo(3, 2); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(120,80,20,0.3)'; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(3, -1); ctx.lineTo(20, -5); ctx.stroke();
        ctx.restore();
        // Engine glow
        ctx.fillStyle = '#FF8833';
        ctx.globalAlpha = 0.7; ctx.beginPath(); ctx.arc(0, -6, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#FFCC66';
        ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(0, -6, 1.5, 0, Math.PI * 2); ctx.fill();
    }

    drawAirship(ctx) {
        // Envelope with metallic sheen
        const envGrad = ctx.createRadialGradient(-4, -8, 2, 0, -4, 20);
        envGrad.addColorStop(0, '#C89040'); envGrad.addColorStop(0.5, '#8B5520'); envGrad.addColorStop(1, '#5A3510');
        ctx.fillStyle = envGrad;
        ctx.beginPath(); ctx.ellipse(0, -5, 20, 11, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#6B3810'; ctx.lineWidth = 1.2; ctx.stroke();
        // Rigging lines
        ctx.strokeStyle = 'rgba(100,70,30,0.4)'; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(-12, 5); ctx.lineTo(-8, 8); ctx.moveTo(12, 5); ctx.lineTo(8, 8);
        ctx.moveTo(-6, 6); ctx.lineTo(-4, 9); ctx.moveTo(6, 6); ctx.lineTo(4, 9); ctx.stroke();
        // Gondola
        ctx.fillStyle = '#4A2A10'; ctx.fillRect(-12, 8, 24, 10);
        ctx.strokeStyle = '#3A1A08'; ctx.lineWidth = 0.8; ctx.strokeRect(-12, 8, 24, 10);
        // Windows
        ctx.fillStyle = '#FFD080'; ctx.globalAlpha = 0.6;
        ctx.fillRect(-8, 10, 4, 3); ctx.fillRect(-2, 10, 4, 3); ctx.fillRect(4, 10, 4, 3);
        ctx.globalAlpha = 1;
        // Propeller
        const pa = this.animFrame * 0.5;
        ctx.save(); ctx.translate(-20, -4);
        ctx.strokeStyle = '#CCA855'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(Math.cos(pa) * 5, Math.sin(pa) * 2); ctx.lineTo(Math.cos(pa + Math.PI) * 5, Math.sin(pa + Math.PI) * 2); ctx.stroke();
        ctx.fillStyle = '#888'; ctx.beginPath(); ctx.arc(0, 0, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        // Rivets
        ctx.fillStyle = '#DDB866';
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            ctx.beginPath(); ctx.arc(Math.cos(a) * 16, -5 + Math.sin(a) * 8, 0.8, 0, Math.PI * 2); ctx.fill();
        }
    }

    drawFighter(ctx) {
        // Sleek steam-powered dart fighter
        const bodyGrad = ctx.createLinearGradient(0, -14, 0, 12);
        bodyGrad.addColorStop(0, '#888'); bodyGrad.addColorStop(0.5, '#555'); bodyGrad.addColorStop(1, '#333');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.moveTo(0, -14); ctx.lineTo(-5, -4); ctx.lineTo(-12, 8);
        ctx.lineTo(-8, 12); ctx.lineTo(0, 8); ctx.lineTo(8, 12);
        ctx.lineTo(12, 8); ctx.lineTo(5, -4);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#222'; ctx.lineWidth = 0.8; ctx.stroke();
        // Cockpit
        const cockGrad = ctx.createRadialGradient(0, -6, 1, 0, -4, 5);
        cockGrad.addColorStop(0, '#FF8866'); cockGrad.addColorStop(1, '#CC3322');
        ctx.fillStyle = cockGrad;
        ctx.beginPath(); ctx.ellipse(0, -4, 3, 4, 0, 0, Math.PI * 2); ctx.fill();
        // Exhaust
        const exLen = 4 + Math.random() * 5;
        ctx.fillStyle = '#FF6633'; ctx.globalAlpha = 0.6;
        ctx.beginPath(); ctx.moveTo(-3, 12); ctx.lineTo(3, 12); ctx.lineTo(0, 12 + exLen); ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 1;
        // Wing markings
        ctx.strokeStyle = '#FF4433'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(-10, 6); ctx.lineTo(-6, 6); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(6, 6); ctx.lineTo(10, 6); ctx.stroke();
    }

    drawGunship(ctx) {
        // Armored weapons platform
        ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(-18, -6, 40, 18);
        const platGrad = ctx.createLinearGradient(0, -10, 0, 10);
        platGrad.addColorStop(0, '#6a6a6a'); platGrad.addColorStop(1, '#3a3a3a');
        ctx.fillStyle = platGrad;
        ctx.fillRect(-18, -10, 36, 20);
        // Armored side panels
        ctx.fillStyle = '#555'; ctx.fillRect(-22, -6, 6, 14); ctx.fillRect(16, -6, 6, 14);
        ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
        ctx.strokeRect(-18, -10, 36, 20);
        // Turret cannons
        ctx.fillStyle = '#444';
        ctx.fillRect(-20, -16, 5, 10); ctx.fillRect(15, -16, 5, 10);
        // Muzzles
        ctx.fillStyle = '#222';
        ctx.beginPath(); ctx.arc(-17.5, -16, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(17.5, -16, 2.5, 0, Math.PI * 2); ctx.fill();
        // Central turret
        ctx.fillStyle = '#555';
        ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#FFAA33';
        ctx.beginPath(); ctx.arc(0, 0, 3.5, 0, Math.PI * 2); ctx.fill();
        // Rivets
        ctx.fillStyle = '#888';
        for (let i = -2; i <= 2; i++) {
            ctx.beginPath(); ctx.arc(i * 7, -10, 1, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(i * 7, 10, 1, 0, Math.PI * 2); ctx.fill();
        }
    }

    drawBalloon(ctx) {
        // Menacing explosive balloon
        const ballGrad = ctx.createRadialGradient(-3, -10, 2, 0, -6, 16);
        ballGrad.addColorStop(0, '#FF6666'); ballGrad.addColorStop(0.6, '#CC3333'); ballGrad.addColorStop(1, '#881111');
        ctx.fillStyle = ballGrad;
        ctx.beginPath(); ctx.arc(0, -6, 15, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#661111'; ctx.lineWidth = 1.5; ctx.stroke();
        // Danger stripes
        ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(-10, -6); ctx.lineTo(10, -6); ctx.stroke();
        // Basket
        ctx.fillStyle = '#6B4400'; ctx.fillRect(-7, 9, 14, 9);
        ctx.strokeStyle = '#4A2A00'; ctx.lineWidth = 0.8; ctx.strokeRect(-7, 9, 14, 9);
        // Ropes
        ctx.strokeStyle = '#8B6914'; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(-7, 9); ctx.lineTo(-10, 2); ctx.moveTo(7, 9); ctx.lineTo(10, 2); ctx.stroke();
        // Fuse sparks
        ctx.fillStyle = '#FFEE44';
        ctx.globalAlpha = 0.5 + Math.sin(this.animFrame * 0.3) * 0.3;
        ctx.beginPath(); ctx.arc(0, 18, 2 + Math.random(), 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
        // Skull
        ctx.fillStyle = '#FFF'; ctx.font = '12px serif'; ctx.textAlign = 'center';
        ctx.fillText('☠', 0, -3);
    }

    drawDrone(ctx) {
        // Sleek surveillance drone
        const af = this.animFrame;
        // Body
        const droneGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 10);
        droneGrad.addColorStop(0, '#557755'); droneGrad.addColorStop(1, '#334433');
        ctx.fillStyle = droneGrad;
        ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#223322'; ctx.lineWidth = 1; ctx.stroke();
        // Rotor arms
        const ra = af * 0.6;
        ctx.strokeStyle = '#556655'; ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            const a = ra + (i / 3) * Math.PI * 2;
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 14, Math.sin(a) * 14); ctx.stroke();
            // Rotor blades (blurred disc)
            ctx.fillStyle = 'rgba(100,150,100,0.25)';
            ctx.beginPath(); ctx.arc(Math.cos(a) * 14, Math.sin(a) * 14, 5, 0, Math.PI * 2); ctx.fill();
        }
        // Eye/sensor
        ctx.fillStyle = '#66FF66';
        ctx.beginPath(); ctx.arc(0, 0, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#AAFFAA';
        ctx.beginPath(); ctx.arc(-1, -1, 1.5, 0, Math.PI * 2); ctx.fill();
    }

    drawTurret(ctx) {
        // Fixed weapons emplacement
        ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(-13, -4, 30, 14);
        // Base
        const baseGrad = ctx.createLinearGradient(0, -8, 0, 8);
        baseGrad.addColorStop(0, '#6A5A4A'); baseGrad.addColorStop(1, '#3A2A1A');
        ctx.fillStyle = baseGrad;
        ctx.fillRect(-16, -6, 32, 14);
        ctx.strokeStyle = '#2A1A0A'; ctx.lineWidth = 1; ctx.strokeRect(-16, -6, 32, 14);
        // Gun barrel
        ctx.fillStyle = '#444';
        ctx.fillRect(-3, -18, 6, 16);
        ctx.strokeStyle = '#333'; ctx.lineWidth = 0.8; ctx.strokeRect(-3, -18, 6, 16);
        // Muzzle
        ctx.fillStyle = '#333';
        ctx.beginPath(); ctx.arc(0, -18, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#FF6655';
        ctx.beginPath(); ctx.arc(0, -18, 2, 0, Math.PI * 2); ctx.fill();
        // Shell casings stacked
        ctx.fillStyle = '#AA8833';
        ctx.fillRect(-14, -2, 4, 8); ctx.fillRect(10, -2, 4, 8);
    }

    drawHeavyAirship(ctx) {
        const af = this.animFrame;
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath(); ctx.ellipse(3, 0, 30, 16, 0, 0, Math.PI * 2); ctx.fill();
        // Massive envelope
        const envGrad = ctx.createRadialGradient(-8, -8, 5, 0, -2, 32);
        envGrad.addColorStop(0, '#9A7030'); envGrad.addColorStop(0.5, '#6B4A18'); envGrad.addColorStop(1, '#3A2808');
        ctx.fillStyle = envGrad;
        ctx.beginPath(); ctx.ellipse(0, -4, 30, 15, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#4B2808'; ctx.lineWidth = 2; ctx.stroke();
        // Armor plates
        ctx.fillStyle = 'rgba(80,80,80,0.5)';
        ctx.fillRect(-26, -4, 12, 6); ctx.fillRect(14, -4, 12, 6);
        // Cross-beams
        ctx.strokeStyle = 'rgba(100,70,30,0.4)'; ctx.lineWidth = 0.5;
        for (let i = -2; i <= 2; i++) {
            ctx.beginPath(); ctx.moveTo(i * 10, -15); ctx.lineTo(i * 10, 10); ctx.stroke();
        }
        // Gondola
        ctx.fillStyle = '#4A2A0A'; ctx.fillRect(-22, 10, 44, 14);
        ctx.strokeStyle = '#3A1A00'; ctx.lineWidth = 1; ctx.strokeRect(-22, 10, 44, 14);
        // Cannon arrays
        ctx.fillStyle = '#333';
        ctx.fillRect(-26, 14, 5, 14); ctx.fillRect(21, 14, 5, 14);
        ctx.fillRect(-12, 20, 5, 10); ctx.fillRect(7, 20, 5, 10);
        // Muzzle flashes (random)
        if (af % 30 < 3) {
            ctx.fillStyle = '#FFA033'; ctx.globalAlpha = 0.6;
            ctx.beginPath(); ctx.arc(-23.5, 28, 3, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1;
        }
        // Gondola windows
        ctx.fillStyle = '#FFD080'; ctx.globalAlpha = 0.5;
        for (let i = 0; i < 5; i++) ctx.fillRect(-18 + i * 8, 12, 4, 3);
        ctx.globalAlpha = 1;
        // Rivets
        ctx.fillStyle = '#DDB866';
        for (let i = 0; i < 10; i++) {
            const a = (i / 10) * Math.PI * 2;
            ctx.beginPath(); ctx.arc(Math.cos(a) * 26, -4 + Math.sin(a) * 12, 1, 0, Math.PI * 2); ctx.fill();
        }
    }
}

/* ============================================
   Power Items - Large & Clear with Labels
   ============================================ */
class PowerItem {
    constructor(x, y, type = 'power') {
        this.x = x; this.y = y; this.type = type;
        this.vy = 1.5; this.active = true; this.age = 0; this.radius = 12;
    }
    update() {
        this.y += this.vy; this.vy = Math.min(this.vy + 0.01, 2);
        this.age++;
        if (this.y > 740) this.active = false;
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        const bob = Math.sin(this.age * 0.08) * 3;
        const pulse = 1 + Math.sin(this.age * 0.15) * 0.1;

        switch (this.type) {
            case 'power': {
                // Large red item with POW text
                // Glow
                ctx.globalAlpha = 0.3;
                ctx.fillStyle = '#FF4444';
                ctx.beginPath(); ctx.arc(0, bob, 18 * pulse, 0, Math.PI * 2); ctx.fill();
                ctx.globalAlpha = 1;
                // Body
                const pg = ctx.createRadialGradient(-2, bob - 2, 1, 0, bob, 12);
                pg.addColorStop(0, '#FF8888'); pg.addColorStop(0.5, '#EE3333'); pg.addColorStop(1, '#AA1111');
                ctx.fillStyle = pg;
                ctx.beginPath(); ctx.arc(0, bob, 12 * pulse, 0, Math.PI * 2); ctx.fill();
                // Border
                ctx.strokeStyle = '#FF6666'; ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.arc(0, bob, 12 * pulse, 0, Math.PI * 2); ctx.stroke();
                // POW text
                ctx.fillStyle = '#FFF';
                ctx.font = 'bold 10px Cinzel, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('POW', 0, bob + 1);
                break;
            }
            case 'score': {
                // Green star-shaped score item
                ctx.globalAlpha = 0.3;
                ctx.fillStyle = '#44FF44';
                ctx.beginPath(); ctx.arc(0, bob, 14 * pulse, 0, Math.PI * 2); ctx.fill();
                ctx.globalAlpha = 1;
                const sg = ctx.createRadialGradient(-1, bob - 1, 1, 0, bob, 10);
                sg.addColorStop(0, '#88FF88'); sg.addColorStop(0.5, '#33DD33'); sg.addColorStop(1, '#118811');
                ctx.fillStyle = sg;
                // Star shape
                ctx.beginPath();
                for (let i = 0; i < 10; i++) {
                    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
                    const r = (i % 2 === 0 ? 10 : 5) * pulse;
                    ctx.lineTo(Math.cos(a) * r, bob + Math.sin(a) * r);
                }
                ctx.closePath(); ctx.fill();
                // Text
                ctx.fillStyle = '#FFF';
                ctx.font = 'bold 8px sans-serif';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText('PTS', 0, bob + 1);
                break;
            }
            case 'bomb': {
                // Blue bomb item
                ctx.globalAlpha = 0.3;
                ctx.fillStyle = '#4466FF';
                ctx.beginPath(); ctx.arc(0, bob, 16 * pulse, 0, Math.PI * 2); ctx.fill();
                ctx.globalAlpha = 1;
                const bg = ctx.createRadialGradient(-2, bob - 2, 1, 0, bob, 12);
                bg.addColorStop(0, '#8888FF'); bg.addColorStop(0.5, '#4444EE'); bg.addColorStop(1, '#1111AA');
                ctx.fillStyle = bg;
                ctx.beginPath(); ctx.arc(0, bob, 12 * pulse, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = '#6688FF'; ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.arc(0, bob, 12 * pulse, 0, Math.PI * 2); ctx.stroke();
                ctx.fillStyle = '#FFF';
                ctx.font = 'bold 10px Cinzel, sans-serif';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText('BOM', 0, bob + 1);
                break;
            }
            case 'life': {
                // Pink life item with heart
                ctx.globalAlpha = 0.3;
                ctx.fillStyle = '#FF44FF';
                ctx.beginPath(); ctx.arc(0, bob, 16 * pulse, 0, Math.PI * 2); ctx.fill();
                ctx.globalAlpha = 1;
                const lg = ctx.createRadialGradient(-2, bob - 2, 1, 0, bob, 12);
                lg.addColorStop(0, '#FF88FF'); lg.addColorStop(0.5, '#EE33EE'); lg.addColorStop(1, '#AA11AA');
                ctx.fillStyle = lg;
                ctx.beginPath(); ctx.arc(0, bob, 12 * pulse, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = '#FF66FF'; ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.arc(0, bob, 12 * pulse, 0, Math.PI * 2); ctx.stroke();
                ctx.fillStyle = '#FFF';
                ctx.font = 'bold 14px sans-serif';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText('♥', 0, bob + 1);
                break;
            }
            case 'barrier': {
                // Yellow shield barrier item
                ctx.globalAlpha = 0.35;
                ctx.fillStyle = '#FFE744';
                ctx.beginPath(); ctx.arc(0, bob, 18 * pulse, 0, Math.PI * 2); ctx.fill();
                ctx.globalAlpha = 1;
                const brg = ctx.createRadialGradient(-2, bob - 2, 1, 0, bob, 12);
                brg.addColorStop(0, '#FFFF88'); brg.addColorStop(0.5, '#FFDD33'); brg.addColorStop(1, '#CC9900');
                ctx.fillStyle = brg;
                ctx.beginPath(); ctx.arc(0, bob, 12 * pulse, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = '#FFE744'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(0, bob, 12 * pulse, 0, Math.PI * 2); ctx.stroke();
                // Shield icon
                ctx.fillStyle = '#FFF';
                ctx.font = 'bold 10px Cinzel, sans-serif';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText('BRR', 0, bob + 1);
                // Extra ring effect
                ctx.globalAlpha = 0.3 + Math.sin(this.age * 0.15) * 0.15;
                ctx.strokeStyle = '#FFEE44'; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.arc(0, bob, 16 * pulse, 0, Math.PI * 2); ctx.stroke();
                ctx.globalAlpha = 1;
                break;
            }
        }
        ctx.restore();
    }
}

function createEnemy(type, x, y, extra = {}) {
    const c = {
        ornithopter: { hp: 4, score: 100, width: 34, height: 34, radius: 14, shootInterval: 120 },
        airship: { hp: 15, score: 300, width: 50, height: 28, radius: 22, shootInterval: 100 },
        fighter: { hp: 5, score: 150, width: 28, height: 34, radius: 14, vy: 3, shootInterval: 60 },
        gunship: { hp: 25, score: 500, width: 56, height: 22, radius: 25, vy: 0.5, shootInterval: 80 },
        balloon: { hp: 10, score: 200, width: 38, height: 38, radius: 18, shootInterval: 9999 },
        drone: { hp: 3, score: 80, width: 22, height: 22, radius: 11, shootInterval: 90 },
        turret: { hp: 18, score: 400, width: 38, height: 20, radius: 18, vy: 0.3, shootInterval: 60 },
        heavyAirship: { hp: 45, score: 800, width: 76, height: 38, radius: 32, vy: 0.3, shootInterval: 70 }
    };
    return new Enemy(type, x, y, { ...(c[type] || c.ornithopter), ...extra, willDropItem: Math.random() < 0.25 });
}
