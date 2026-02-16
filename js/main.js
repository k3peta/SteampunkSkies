/* ============================================
   Main Game Loop & State Machine
   ============================================ */
const DIFFICULTIES = {
    easy: { bulletSpeed: 0.6, bulletDensity: 0.5, enemyHpMult: 0.7, lives: 5, bombs: 5, continues: 99, label: 'EASY' },
    normal: { bulletSpeed: 1.0, bulletDensity: 1.0, enemyHpMult: 1.0, lives: 3, bombs: 3, continues: 3, label: 'NORMAL' },
    hard: { bulletSpeed: 1.3, bulletDensity: 1.5, enemyHpMult: 1.3, lives: 3, bombs: 2, continues: 1, label: 'HARD' },
    lunatic: { bulletSpeed: 1.6, bulletDensity: 2.0, enemyHpMult: 1.5, lives: 2, bombs: 1, continues: 0, label: 'LUNATIC' }
};
const DIFF_KEYS = ['easy', 'normal', 'hard', 'lunatic'];

const Game = {
    canvas: null, ctx: null,
    state: 'TITLE', // TITLE, DIFFICULTY, PLAYING, STAGE_CLEAR, GAME_OVER, ENDING, PAUSED
    difficulty: null,
    player: null,
    playerBullets: null,
    enemyBullets: null,
    enemies: [],
    boss: null,
    midBoss: null,
    items: [],
    currentStage: 0,
    bossWarningTimer: 0,
    stageClearTimer: 0,
    frameCount: 0,

    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        Input.init();
        Audio.init();
        BGM.init();
        Particles.init();
        this.playerBullets = new BulletPool(200);
        this.enemyBullets = new BulletPool(1500);
        this.player = new Player();
        this.state = 'TITLE';
        this.loop();
    },

    loop() {
        this.update();
        this.render();
        this.frameCount++;
        requestAnimationFrame(() => this.loop());
    },

    update() {
        switch (this.state) {
            case 'TITLE': this.updateTitle(); break;
            case 'DIFFICULTY': this.updateDifficulty(); break;
            case 'PLAYING': this.updatePlaying(); break;
            case 'STAGE_CLEAR': this.updateStageClear(); break;
            case 'GAME_OVER': this.updateGameOver(); break;
            case 'ENDING': this.updateEnding(); break;
            case 'PAUSED': this.updatePaused(); break;
        }
    },

    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, 480, 720);

        switch (this.state) {
            case 'TITLE':
                ctx.fillStyle = '#1a1a2e';
                ctx.fillRect(0, 0, 480, 720);
                UI.drawTitle(ctx);
                break;
            case 'DIFFICULTY':
                UI.drawDifficultySelect(ctx);
                break;
            case 'PLAYING':
            case 'PAUSED':
                Background.draw(ctx);
                this.items.forEach(i => i.draw(ctx));
                this.enemies.forEach(e => e.draw(ctx));
                if (this.boss) this.boss.draw(ctx);
                if (this.midBoss) this.midBoss.draw(ctx);
                this.playerBullets.draw(ctx);
                this.enemyBullets.draw(ctx);
                this.player.draw(ctx);
                Particles.draw(ctx);
                UI.drawHUD(ctx, this.player, this.currentStage);
                UI.drawStageAnnounce(ctx, this.currentStage);
                UI.drawBossWarning(ctx, this.bossWarningTimer);
                if (this.state === 'PAUSED') UI.drawPause(ctx);
                break;
            case 'STAGE_CLEAR':
                Background.draw(ctx);
                this.items.forEach(i => i.draw(ctx));
                this.player.draw(ctx);
                Particles.draw(ctx);
                UI.drawHUD(ctx, this.player, this.currentStage);
                UI.drawStageClear(ctx, this.stageClearTimer);
                break;
            case 'GAME_OVER':
                Background.draw(ctx);
                Particles.draw(ctx);
                UI.drawHUD(ctx, this.player, this.currentStage);
                UI.drawGameOver(ctx);
                break;
            case 'ENDING':
                UI.endingTimer = (UI.endingTimer || 0) + 1;
                UI.drawEnding(ctx, UI.endingTimer);
                break;
        }
    },

    // === State Updates ===
    updateTitle() {
        if (Input.wasPressed('ArrowUp')) { UI.menuSelection = Math.max(0, UI.menuSelection - 1); Audio.menuSelect(); }
        if (Input.wasPressed('ArrowDown')) { UI.menuSelection = Math.min(1, UI.menuSelection + 1); Audio.menuSelect(); }
        if (Input.wasPressed('Enter') || Input.wasPressed('KeyZ')) {
            Audio.resume(); BGM.resume(); Audio.menuConfirm();
            if (UI.menuSelection === 0) { this.state = 'DIFFICULTY'; UI.difficultySelection = 1; BGM.play(8); }
        }
    },

    updateDifficulty() {
        if (Input.wasPressed('ArrowUp')) { UI.difficultySelection = Math.max(0, UI.difficultySelection - 1); Audio.menuSelect(); }
        if (Input.wasPressed('ArrowDown')) { UI.difficultySelection = Math.min(3, UI.difficultySelection + 1); Audio.menuSelect(); }
        if (Input.wasPressed('Enter') || Input.wasPressed('KeyZ')) {
            Audio.menuConfirm();
            this.difficulty = DIFFICULTIES[DIFF_KEYS[UI.difficultySelection]];
            this.startGame();
        }
        if (Input.wasPressed('Escape')) { this.state = 'TITLE'; Audio.menuSelect(); }
    },

    updatePlaying() {
        if (Input.wasPressed('Escape')) { this.state = 'PAUSED'; BGM.pause(); return; }

        Background.update();
        this.player.update(this.playerBullets);
        this.playerBullets.update();
        this.enemyBullets.update();
        Particles.update();

        // Update enemies
        for (const e of this.enemies) {
            if (e.active) e.update(this.enemyBullets, this.player.x, this.player.y);
        }
        this.enemies = this.enemies.filter(e => e.active);

        // Update boss
        if (this.boss && this.boss.active) {
            this.boss.update(this.enemyBullets, this.player.x, this.player.y);
        }
        // Update mid-boss
        if (this.midBoss && this.midBoss.active) {
            this.midBoss.update(this.enemyBullets, this.player.x, this.player.y);
        }

        // Update items
        for (const i of this.items) { if (i.active) i.update(); }
        this.items = this.items.filter(i => i.active);

        // Stage update
        Stages.update(this);

        // Boss warning timer
        if (this.bossWarningTimer > 0) this.bossWarningTimer--;

        // Collisions
        this.checkCollisions();

        // Clear bullets when boss starts crashing
        if (this.boss && this.boss.crashing && this.boss.crashTimer === 1) {
            this.enemyBullets.clear();
            this.player.invincible = 300; // safe during crash
        }

        // Check boss defeated (after crash finishes)
        if (this.boss && this.boss.defeated) {
            this.onBossDefeated();
        }
        // Check mid-boss defeated
        if (this.midBoss && this.midBoss.defeated) {
            this.onMidBossDefeated();
        }

        // Check game over
        if (this.player.lives < 0 && this.player.respawnTimer <= 0) {
            this.state = 'GAME_OVER';
            BGM.stop();
        }
    },

    updateStageClear() {
        this.stageClearTimer++;
        Particles.update();
        Background.update();
        // Player can move to collect items
        this.player.update(this.playerBullets);
        // Collect items during clear
        for (const i of this.items) { if (i.active) i.update(); }
        this.items = this.items.filter(i => i.active);
        // Check item collection
        const px = this.player.x, py = this.player.y;
        for (const i of this.items) {
            if (!i.active) continue;
            const dx = i.x - px, dy = i.y - py;
            if (dx * dx + dy * dy < 900) {
                i.active = false;
                switch (i.type) {
                    case 'power': this.player.addPower(); break;
                    case 'bomb': this.player.bombs = Math.min(this.player.bombs + 1, 5); Audio.powerUp(); break;
                    case 'score': this.player.score += 1000; Audio.powerUp(); break;
                    case 'barrier': this.player.barrier = Math.min((this.player.barrier || 0) + 1, 3); Audio.powerUp(); break;
                }
            }
        }

        // Fade BGM out during stage clear
        if (this.stageClearTimer === 60 && BGM.masterGain) {
            BGM.masterGain.gain.linearRampToValueAtTime(0, BGM.ctx.currentTime + 3.5);
        }

        if (this.stageClearTimer > 300) {
            BGM.stop();
            if (this.currentStage < 6) {
                this.currentStage++;
                this.startStage(this.currentStage);
            } else {
                this.state = 'ENDING';
                UI.endingTimer = 0;
                Audio.stageClear();
            }
        }
    },

    updateGameOver() {
        if (Input.wasPressed('KeyZ') || Input.wasPressed('Enter')) {
            if (UI.continuesUsed < this.difficulty.continues) {
                UI.continuesUsed++;
                this.player.lives = this.difficulty.lives;
                this.player.bombs = this.difficulty.bombs;
                this.player.invincible = 180;
                this.player.active = true;
                this.player.respawnTimer = 0;
                this.player.x = 240;
                this.player.y = 600;
                this.enemyBullets.clear();
                this.state = 'PLAYING';
                // Resume correct BGM based on current state
                if (this.boss && this.boss.active) {
                    BGM.play(10 + this.currentStage); // boss BGM
                } else if (this.midBoss && this.midBoss.active) {
                    BGM.play(9); // mid-boss BGM
                } else {
                    BGM.play(this.currentStage); // stage BGM
                }
            }
        }
        if (Input.wasPressed('Escape')) {
            this.state = 'TITLE';
            UI.menuSelection = 0;
            BGM.stop();
        }
    },

    updateEnding() {
        if ((UI.endingTimer || 0) > 360 && (Input.wasPressed('KeyZ') || Input.wasPressed('Enter'))) {
            this.state = 'TITLE';
            UI.menuSelection = 0;
            BGM.stop();
        }
    },

    updatePaused() {
        if (Input.wasPressed('Escape')) { this.state = 'PLAYING'; BGM.resume(); }
    },

    // === Game Logic ===
    startGame() {
        this.currentStage = 0;
        UI.continuesUsed = 0;
        BulletPatterns.diff = {
            bulletSpeed: this.difficulty.bulletSpeed,
            bulletDensity: this.difficulty.bulletDensity
        };
        this.player = new Player();
        this.player.reset(this.difficulty);
        this.startStage(0);
    },

    startStage(index) {
        this.currentStage = index;
        this.enemies = [];
        this.boss = null;
        this.midBoss = null;
        this.items = [];
        this.playerBullets.clear();
        this.enemyBullets.clear();
        Particles.clear();
        Background.init(index);
        Stages.init(index);
        UI.stageAnnounceTimer = 180;
        this.bossWarningTimer = 0;
        this.stageClearTimer = 0;
        BGM.play(index);
        this.state = 'PLAYING';
    },

    spawnBoss(stageIndex) {
        this.boss = createBoss(stageIndex);
        // Apply difficulty HP multiplier
        this.boss.hp = Math.floor(this.boss.hp * this.difficulty.enemyHpMult);
        this.boss.maxHp = this.boss.hp;
        this.bossWarningTimer = 240; // Extended for siren
        Audio.bossWarning(); // Siren
        BGM.play(10 + stageIndex); // per-boss BGM track
    },

    onBossDefeated() {
        this.player.score += this.boss.scoreValue;
        this.boss = null;
        this.enemyBullets.clear();
        this.state = 'STAGE_CLEAR';
        this.stageClearTimer = 0;
        Audio.stageClear();

        // Drop items
        for (let i = 0; i < 5; i++) {
            const types = ['power', 'power', 'score', 'bomb', 'barrier'];
            this.items.push(new PowerItem(200 + Math.random() * 80, 100 + Math.random() * 40, types[i]));
        }
    },

    spawnMidBoss(stageIndex) {
        this.midBoss = createMidBoss(stageIndex);
        this.midBoss.hp = Math.floor(this.midBoss.hp * this.difficulty.enemyHpMult);
        this.midBoss.maxHp = this.midBoss.hp;
        this.bossWarningTimer = 150;
        BGM.play(9); // mid-boss track
        Audio.bossWarning();
    },

    onMidBossDefeated() {
        this.player.score += this.midBoss.scoreValue;
        this.midBoss = null;
        this.enemyBullets.clear();
        Stages.midBossActive = false;
        BGM.play(this.currentStage); // back to stage BGM
        // Drop items
        for (let i = 0; i < 5; i++) {
            const types = ['power', 'power', 'score', 'bomb', 'barrier'];
            this.items.push(new PowerItem(
                this.player.x - 40 + Math.random() * 80,
                Math.max(60, this.player.y - 100 + Math.random() * 60),
                types[i]
            ));
        }
    },

    checkCollisions() {
        const px = this.player.x, py = this.player.y;
        const phr = this.player.hitboxRadius;

        if (!this.player.active) return;

        // Player bullets vs enemies
        for (const b of this.playerBullets.bullets) {
            if (!b.active) continue;

            // vs enemies
            for (const e of this.enemies) {
                if (!e.active) continue;
                const dx = b.x - e.x, dy = b.y - e.y;
                if (dx * dx + dy * dy < (b.radius + e.radius) * (b.radius + e.radius)) {
                    b.active = false;
                    if (e.takeDamage(b.dmg)) {
                        this.player.score += e.scoreValue;
                        // Drop items (reduced rates)
                        if (e.willDropItem) {
                            if (Math.random() < 0.5) this.items.push(new PowerItem(e.x, e.y, 'power'));
                            else if (Math.random() < 0.3) this.items.push(new PowerItem(e.x, e.y, 'score'));
                            else if (Math.random() < 0.08) this.items.push(new PowerItem(e.x, e.y, 'barrier'));
                        } else {
                            if (Math.random() < 0.08) this.items.push(new PowerItem(e.x, e.y, 'power'));
                            else if (Math.random() < 0.05) this.items.push(new PowerItem(e.x, e.y, 'score'));
                        }
                    }
                    break;
                }
            }

            // vs boss
            if (this.boss && this.boss.active && !this.boss.crashing && b.active) {
                const dx = b.x - this.boss.x, dy = b.y - this.boss.y;
                if (dx * dx + dy * dy < (b.radius + this.boss.radius) * (b.radius + this.boss.radius)) {
                    b.active = false;
                    this.boss.takeDamage(b.dmg);
                }
            }
            // vs mid-boss
            if (this.midBoss && this.midBoss.active && b.active) {
                const dx = b.x - this.midBoss.x, dy = b.y - this.midBoss.y;
                if (dx * dx + dy * dy < (b.radius + this.midBoss.radius) * (b.radius + this.midBoss.radius)) {
                    b.active = false;
                    this.midBoss.takeDamage(b.dmg);
                }
            }
        }

        // Enemy bullets vs player
        for (const b of this.enemyBullets.bullets) {
            if (!b.active) continue;

            // Bomb clears bullets
            if (this.player.bombActive > 0) {
                const dx = b.x - px, dy = b.y - py;
                const bombR = (90 - this.player.bombActive) * 6;
                if (dx * dx + dy * dy < bombR * bombR) {
                    b.active = false;
                    this.player.score += 10;
                    continue;
                }
            }

            const dx = b.x - px, dy = b.y - py;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Graze
            if (dist < this.player.grazeRadius && dist > phr) {
                this.player.graze++;
                this.player.score += 50;
            }

            // Hit
            if (dist < phr + b.radius) {
                if (this.player.barrier > 0) {
                    this.player.barrier--;
                    b.active = false;
                    Particles.explosion(px, py, 8, ['#FFEE44', '#FFDD00', '#FFCC00', '#FFB800']);
                    Audio.barrierBreak();
                } else {
                    b.active = false;
                    this.player.hit();
                    if (this.player.lives < 0 && this.player.respawnTimer <= 0) return;
                }
            }
        }

        // Bomb vs enemies
        if (this.player.bombActive > 0) {
            const bombR = (90 - this.player.bombActive) * 6;
            for (const e of this.enemies) {
                if (!e.active) continue;
                const dx = e.x - px, dy = e.y - py;
                if (dx * dx + dy * dy < bombR * bombR) {
                    e.takeDamage(2);
                    if (!e.active) this.player.score += e.scoreValue;
                }
            }
            if (this.boss && this.boss.active) {
                const dx = this.boss.x - px, dy = this.boss.y - py;
                if (dx * dx + dy * dy < bombR * bombR) {
                    this.boss.takeDamage(1);
                }
            }
            if (this.midBoss && this.midBoss.active) {
                const dx = this.midBoss.x - px, dy = this.midBoss.y - py;
                if (dx * dx + dy * dy < bombR * bombR) {
                    this.midBoss.takeDamage(1);
                }
            }
        }

        // Player vs items
        for (const item of this.items) {
            if (!item.active) continue;
            const dx = item.x - px, dy = item.y - py;
            if (dx * dx + dy * dy < (item.radius + 16) * (item.radius + 16)) {
                item.active = false;
                switch (item.type) {
                    case 'power': this.player.addPower(); break;
                    case 'score': this.player.score += 500; break;
                    case 'bomb': this.player.bombs = Math.min(this.player.bombs + 1, 5); Audio.powerUp(); break;
                    case 'life': this.player.lives++; Audio.powerUp(); break;
                    case 'barrier': this.player.barrier = Math.min((this.player.barrier || 0) + 1, 3); Audio.powerUp(); break;
                }
            }
        }

        // Player vs enemies (collision)
        for (const e of this.enemies) {
            if (!e.active) continue;
            const dx = e.x - px, dy = e.y - py;
            if (dx * dx + dy * dy < (phr + e.radius * 0.5) * (phr + e.radius * 0.5)) {
                if (this.player.barrier > 0) {
                    this.player.barrier--;
                    e.takeDamage(5);
                    Particles.explosion(px, py, 8, ['#FFEE44', '#FFDD00', '#FFCC00', '#FFB800']);
                    Audio.barrierBreak();
                } else {
                    this.player.hit();
                    if (this.player.lives < 0 && this.player.respawnTimer <= 0) return;
                }
            }
        }
    }
};

// Start
window.addEventListener('load', () => Game.init());
