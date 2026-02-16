/* ============================================
   Particle System
   ============================================ */
class Particle {
    constructor() { this.active = false; }

    init(x, y, vx, vy, life, color, size, type = 'circle') {
        this.x = x; this.y = y;
        this.vx = vx; this.vy = vy;
        this.life = life; this.maxLife = life;
        this.color = color; this.size = size;
        this.type = type;
        this.active = true;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.2;
        return this;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.02;
        this.life--;
        this.rotation += this.rotSpeed;
        if (this.life <= 0) this.active = false;
    }

    draw(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;

        if (this.type === 'gear') {
            this.drawGear(ctx);
        } else if (this.type === 'spark') {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.fillRect(-this.size * 2, -0.5, this.size * 4, 1);
            ctx.restore();
        } else if (this.type === 'steam') {
            ctx.beginPath();
            const s = this.size * (1 + (1 - alpha) * 2);
            ctx.arc(this.x, this.y, s, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    drawGear(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        const s = this.size;
        const teeth = 6;
        ctx.beginPath();
        for (let i = 0; i < teeth; i++) {
            const a1 = (i / teeth) * Math.PI * 2;
            const a2 = ((i + 0.3) / teeth) * Math.PI * 2;
            const a3 = ((i + 0.5) / teeth) * Math.PI * 2;
            const a4 = ((i + 0.8) / teeth) * Math.PI * 2;
            if (i === 0) ctx.moveTo(Math.cos(a1) * s * 0.7, Math.sin(a1) * s * 0.7);
            ctx.lineTo(Math.cos(a2) * s, Math.sin(a2) * s);
            ctx.lineTo(Math.cos(a3) * s, Math.sin(a3) * s);
            ctx.lineTo(Math.cos(a4) * s * 0.7, Math.sin(a4) * s * 0.7);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}

const Particles = {
    pool: [],
    maxParticles: 1800,

    init() {
        this.pool = [];
        for (let i = 0; i < this.maxParticles; i++) {
            this.pool.push(new Particle());
        }
    },

    spawn(x, y, vx, vy, life, color, size, type) {
        for (const p of this.pool) {
            if (!p.active) {
                p.init(x, y, vx, vy, life, color, size, type);
                return p;
            }
        }
        return null;
    },

    explosion(x, y, count = 15, colors = ['#FF6633', '#FFAA33', '#FFDD44', '#FF4422']) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            const color = colors[Math.floor(Math.random() * colors.length)];
            this.spawn(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed,
                20 + Math.random() * 20, color, 2 + Math.random() * 3, 'circle');
        }
        // sparks
        for (let i = 0; i < count / 2; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 4;
            this.spawn(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed,
                10 + Math.random() * 15, '#FFEEAA', 2, 'spark');
        }
    },

    bigExplosion(x, y) {
        this.explosion(x, y, 40, ['#FF6633', '#FFAA33', '#FFDD44', '#FF2200', '#FF8800']);
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.5 + Math.random() * 1.5;
            this.spawn(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed,
                30 + Math.random() * 20, '#B87333', 3 + Math.random() * 3, 'gear');
        }
    },

    steam(x, y, count = 3) {
        for (let i = 0; i < count; i++) {
            this.spawn(x + (Math.random() - 0.5) * 10, y,
                (Math.random() - 0.5) * 0.5, -0.5 - Math.random() * 0.5,
                30 + Math.random() * 20, 'rgba(200,200,210,0.5)', 3 + Math.random() * 3, 'steam');
        }
    },

    sparks(x, y, count = 5) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;
            this.spawn(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed,
                8 + Math.random() * 8, '#FFDD88', 2, 'spark');
        }
    },

    update() {
        for (const p of this.pool) {
            if (p.active) p.update();
        }
    },

    draw(ctx) {
        for (const p of this.pool) {
            if (p.active) p.draw(ctx);
        }
    },

    clear() {
        for (const p of this.pool) p.active = false;
    }
};
