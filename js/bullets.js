/* ============================================
   Bullet System & Danmaku Patterns
   ============================================ */
class Bullet {
    constructor() { this.active = false; }

    init(x, y, vx, vy, radius, color, type = 'circle', dmg = 1) {
        this.x = x; this.y = y; this.vx = vx; this.vy = vy;
        this.radius = radius; this.color = color;
        this.type = type; this.dmg = dmg;
        this.active = true; this.age = 0;
        this.accelX = 0; this.accelY = 0;
        return this;
    }

    update() {
        this.vx += this.accelX; this.vy += this.accelY;
        this.x += this.vx; this.y += this.vy; this.age++;
        if (this.x < -20 || this.x > 500 || this.y < -20 || this.y > 740) this.active = false;
    }

    draw(ctx) {
        const r = this.radius;
        const angle = Math.atan2(this.vy, this.vx);

        if (this.type === 'diamond') {
            // Player shots - sleek energy tracer
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(angle);
            // Glow trail
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.moveTo(r * 2, 0);
            ctx.lineTo(-r * 4, -r);
            ctx.lineTo(-r * 3, 0);
            ctx.lineTo(-r * 4, r);
            ctx.closePath();
            ctx.fill();
            // Core
            ctx.globalAlpha = 1;
            ctx.fillStyle = '#FFF';
            ctx.beginPath();
            ctx.moveTo(r * 1.5, 0);
            ctx.lineTo(-r, -r * 0.5);
            ctx.lineTo(-r * 0.5, 0);
            ctx.lineTo(-r, r * 0.5);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            return;
        }

        if (this.type === 'circle') {
            // Steampunk bullet - brass round with metallic sheen + dark outline
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(angle);
            // Dark outline for visibility against bright backgrounds
            ctx.globalAlpha = 0.6;
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1.5;
            const bLen2 = r * 2.4;
            const bW2 = r * 1.1;
            ctx.beginPath();
            ctx.moveTo(bLen2, 0);
            ctx.quadraticCurveTo(bLen2, -bW2, bLen2 * 0.3, -bW2);
            ctx.lineTo(-bLen2 * 0.5, -bW2 * 0.8);
            ctx.lineTo(-bLen2 * 0.5, bW2 * 0.8);
            ctx.lineTo(bLen2 * 0.3, bW2);
            ctx.quadraticCurveTo(bLen2, bW2, bLen2, 0);
            ctx.closePath();
            ctx.stroke();
            // Outer glow
            ctx.globalAlpha = 0.35;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, r * 2, 0, Math.PI * 2);
            ctx.fill();
            // Bullet body (elongated, like a cartridge)
            ctx.globalAlpha = 1;
            const bLen = r * 2.2;
            const bW = r * 0.9;
            // Casing
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.moveTo(bLen, 0);
            ctx.quadraticCurveTo(bLen, -bW, bLen * 0.3, -bW);
            ctx.lineTo(-bLen * 0.5, -bW * 0.8);
            ctx.lineTo(-bLen * 0.5, bW * 0.8);
            ctx.lineTo(bLen * 0.3, bW);
            ctx.quadraticCurveTo(bLen, bW, bLen, 0);
            ctx.closePath();
            ctx.fill();
            // Dark border on body
            ctx.strokeStyle = 'rgba(0,0,0,0.5)';
            ctx.lineWidth = 0.8;
            ctx.stroke();
            // Highlight stripe
            ctx.fillStyle = 'rgba(255,255,255,0.35)';
            ctx.beginPath();
            ctx.moveTo(bLen * 0.8, -bW * 0.15);
            ctx.lineTo(-bLen * 0.3, -bW * 0.6);
            ctx.lineTo(-bLen * 0.3, -bW * 0.2);
            ctx.lineTo(bLen * 0.8, bW * 0.05);
            ctx.closePath();
            ctx.fill();
            // Tip (darker, copper point)
            ctx.fillStyle = 'rgba(0,0,0,0.25)';
            ctx.beginPath();
            ctx.arc(bLen * 0.7, 0, bW * 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            return;
        }

        if (this.type === 'big') {
            // Big bullet - cannonball with metallic finish + dark outline
            ctx.save();
            ctx.translate(this.x, this.y);
            // Dark shadow ring for visibility
            ctx.globalAlpha = 0.5;
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, r * 1.1, 0, Math.PI * 2);
            ctx.stroke();
            // Outer glow
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, r * 2.5, 0, Math.PI * 2);
            ctx.fill();
            // Main sphere
            ctx.globalAlpha = 1;
            const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
            g.addColorStop(0, '#FFEECC');
            g.addColorStop(0.3, this.color);
            g.addColorStop(1, 'rgba(0,0,0,0.4)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fill();
            // Dark edge ring
            ctx.strokeStyle = 'rgba(0,0,0,0.45)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.stroke();
            // Bright ring
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(0, 0, r * 1.2, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
            return;
        }

        if (this.type === 'laser') {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(angle);
            // Dark outline
            ctx.strokeStyle = 'rgba(0,0,0,0.4)';
            ctx.lineWidth = 1;
            ctx.strokeRect(-r * 3, -5, r * 6, 10);
            // Core beam
            ctx.fillStyle = '#FFF';
            ctx.globalAlpha = 0.9;
            ctx.fillRect(-r * 3, -1.5, r * 6, 3);
            // Glow
            ctx.fillStyle = this.color;
            ctx.globalAlpha = 0.5;
            ctx.fillRect(-r * 3, -4, r * 6, 8);
            ctx.globalAlpha = 0.2;
            ctx.fillRect(-r * 3, -6, r * 6, 12);
            ctx.restore();
            return;
        }

        // Fallback - also add outline
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, r + 1, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
        ctx.fill();
    }
}

class BulletPool {
    constructor(size) {
        this.bullets = [];
        for (let i = 0; i < size; i++) this.bullets.push(new Bullet());
    }
    fire(x, y, vx, vy, radius, color, type, dmg) {
        for (const b of this.bullets) {
            if (!b.active) return b.init(x, y, vx, vy, radius, color, type, dmg);
        }
        return null;
    }
    update() { for (const b of this.bullets) if (b.active) b.update(); }
    draw(ctx) { for (const b of this.bullets) if (b.active) b.draw(ctx); }
    clear() { for (const b of this.bullets) b.active = false; }
    getActive() { return this.bullets.filter(b => b.active); }
}

// Bullet pattern generators
const BulletPatterns = {
    diff: { bulletSpeed: 1, bulletDensity: 1 },

    radial(pool, x, y, count, speed, color, offset = 0, type = 'circle', radius = 4) {
        const n = Math.max(1, Math.round(count * this.diff.bulletDensity));
        const sp = speed * this.diff.bulletSpeed;
        for (let i = 0; i < n; i++) {
            const a = (i / n) * Math.PI * 2 + offset;
            pool.fire(x, y, Math.cos(a) * sp, Math.sin(a) * sp, radius, color, type);
        }
    },
    aimed(pool, x, y, tx, ty, speed, color, type = 'circle', radius = 4) {
        const sp = speed * this.diff.bulletSpeed;
        const a = Math.atan2(ty - y, tx - x);
        return pool.fire(x, y, Math.cos(a) * sp, Math.sin(a) * sp, radius, color, type);
    },
    aimSpread(pool, x, y, tx, ty, count, speed, spread, color, type = 'circle', radius = 4) {
        const n = Math.max(1, Math.round(count * this.diff.bulletDensity));
        const sp = speed * this.diff.bulletSpeed;
        const ba = Math.atan2(ty - y, tx - x);
        for (let i = 0; i < n; i++) {
            const a = ba + (i - (n - 1) / 2) * spread;
            pool.fire(x, y, Math.cos(a) * sp, Math.sin(a) * sp, radius, color, type);
        }
    },
    spiral(pool, x, y, count, speed, color, baseAngle, type = 'circle', radius = 4) {
        const n = Math.max(1, Math.round(count * this.diff.bulletDensity));
        const sp = speed * this.diff.bulletSpeed;
        for (let i = 0; i < n; i++) {
            const a = baseAngle + (i / n) * Math.PI * 0.5;
            pool.fire(x, y, Math.cos(a) * sp, Math.sin(a) * sp, radius, color, type);
        }
    },
    cross(pool, x, y, speed, color, offset = 0, type = 'circle', radius = 4) {
        const sp = speed * this.diff.bulletSpeed;
        for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2 + offset;
            pool.fire(x, y, Math.cos(a) * sp, Math.sin(a) * sp, radius, color, type);
        }
    },
    scatter(pool, x, y, count, speed, color, type = 'circle', radius = 4) {
        const n = Math.max(1, Math.round(count * this.diff.bulletDensity));
        const sp = speed * this.diff.bulletSpeed;
        for (let i = 0; i < n; i++) {
            const a = Math.random() * Math.PI * 2;
            const s = sp * (0.5 + Math.random() * 0.5);
            pool.fire(x, y, Math.cos(a) * s, Math.sin(a) * s, radius, color, type);
        }
    },
    ring(pool, x, y, count, speed, color, offset = 0, radius = 4) {
        const n = Math.max(3, Math.round(count * this.diff.bulletDensity));
        const sp = speed * this.diff.bulletSpeed;
        for (let i = 0; i < n; i++) {
            const a = (i / n) * Math.PI * 2 + offset;
            pool.fire(x, y, Math.cos(a) * sp, Math.sin(a) * sp, radius, color, 'circle');
        }
    },
    stream(pool, x, y, tx, ty, speed, color, radius = 3) {
        return this.aimed(pool, x, y, tx, ty, speed, color, 'diamond', radius);
    }
};
