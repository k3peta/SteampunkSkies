/* ============================================
   UI System
   ============================================ */
const UI = {
    titleGearAngle: 0,
    menuSelection: 0,
    difficultySelection: 0,
    stageAnnounceTimer: 0,
    gameOverTimer: 0,
    endingTimer: 0,
    continuesUsed: 0,
    difficultyNames: ['EASY', 'NORMAL', 'HARD', 'LUNATIC'],
    difficultyDescriptions: [
        '初心者向け - 弾が遅く少ない',
        '標準的な難易度',
        '歯ごたえのある戦い',
        '覚悟はいいか？'
    ],

    drawTitle(ctx) {
        this.titleGearAngle += 0.005;
        // Background gears
        ctx.save();
        for (let i = 0; i < 5; i++) {
            const gx = 80 + i * 100, gy = 200 + Math.sin(i * 2.1) * 80;
            const gr = 40 + i * 10;
            ctx.globalAlpha = 0.08;
            ctx.strokeStyle = '#DDB866';
            ctx.lineWidth = 3;
            this.drawGear(ctx, gx, gy, gr, 12, this.titleGearAngle * (i % 2 === 0 ? 1 : -1));
        }
        ctx.globalAlpha = 1;
        ctx.restore();

        // Title text
        ctx.save();
        ctx.shadowColor = '#DDB866';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#DDB866';
        ctx.font = 'bold 38px Cinzel, serif';
        ctx.textAlign = 'center';
        ctx.fillText('STEAMPUNK', 240, 220);
        ctx.font = 'bold 48px Cinzel, serif';
        ctx.fillText('SKIES', 240, 275);
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#AA8844';
        ctx.font = '16px "Noto Sans JP", sans-serif';
        ctx.fillText('〜 蒸 気 空 戦 記 〜', 240, 310);

        // Menu
        const items = ['START', 'EXIT'];
        for (let i = 0; i < items.length; i++) {
            const sel = i === this.menuSelection;
            ctx.fillStyle = sel ? '#FFD700' : '#886644';
            ctx.font = (sel ? 'bold ' : '') + '22px Cinzel, serif';
            ctx.fillText(items[i], 240, 420 + i * 45);
            if (sel) {
                ctx.fillText('▸', 160, 420 + i * 45);
                ctx.fillText('◂', 320, 420 + i * 45);
            }
        }

        // Controls
        ctx.fillStyle = '#665544';
        ctx.font = '12px "Noto Sans JP", sans-serif';
        ctx.fillText('↑↓: 選択  Enter/Z: 決定', 240, 600);
        ctx.fillText('矢印キー: 移動  Z: ショット  X: ボム  Shift: 低速', 240, 625);
        ctx.restore();
    },

    drawDifficultySelect(ctx) {
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, 480, 720);

        ctx.fillStyle = '#DDB866';
        ctx.font = 'bold 28px Cinzel, serif';
        ctx.textAlign = 'center';
        ctx.fillText('SELECT DIFFICULTY', 240, 120);

        for (let i = 0; i < 4; i++) {
            const sel = i === this.difficultySelection;
            const colors = ['#44CC44', '#DDCC44', '#DD6644', '#DD44DD'];
            ctx.fillStyle = sel ? colors[i] : '#555';
            ctx.font = (sel ? 'bold 26px' : '20px') + ' Cinzel, serif';
            ctx.fillText(this.difficultyNames[i], 240, 240 + i * 70);
            if (sel) {
                ctx.fillStyle = '#AAA';
                ctx.font = '13px "Noto Sans JP", sans-serif';
                ctx.fillText(this.difficultyDescriptions[i], 240, 268 + i * 70);
                ctx.fillStyle = colors[i];
                ctx.fillText('▸', 130, 240 + i * 70);
                ctx.fillText('◂', 350, 240 + i * 70);
            }
        }

        ctx.fillStyle = '#665544';
        ctx.font = '12px "Noto Sans JP", sans-serif';
        ctx.fillText('↑↓: 選択  Enter/Z: 決定  Escape: 戻る', 240, 650);
    },

    drawHUD(ctx, player, stageIndex) {
        ctx.save();
        // Score
        ctx.fillStyle = '#DDB866';
        ctx.font = 'bold 14px Cinzel, serif';
        ctx.textAlign = 'left';
        ctx.fillText('SCORE', 10, 708);
        ctx.fillStyle = '#FFF';
        ctx.font = '14px monospace';
        ctx.fillText(String(player.score).padStart(10, '0'), 70, 708);

        // Lives
        ctx.fillStyle = '#FF6666';
        ctx.font = '14px sans-serif';
        let lx = 200;
        for (let i = 0; i < player.lives; i++) {
            ctx.fillText('♥', lx + i * 16, 708);
        }

        // Bombs
        ctx.fillStyle = '#6688FF';
        let bx = 290;
        for (let i = 0; i < player.bombs; i++) {
            ctx.fillText('★', bx + i * 16, 708);
        }

        // Barrier
        if (player.barrier > 0) {
            ctx.fillStyle = '#FFE744';
            let brx = 390;
            for (let i = 0; i < player.barrier; i++) {
                ctx.fillText('◆', brx + i * 14, 708);
            }
        }

        // Power
        ctx.fillStyle = '#DDB866';
        ctx.font = '11px Cinzel, serif';
        ctx.textAlign = 'right';
        ctx.fillText('POWER ' + player.power + '/' + player.maxPower, 470, 708);

        // Graze
        ctx.fillStyle = '#888';
        ctx.font = '10px monospace';
        ctx.fillText('GRAZE ' + player.graze, 470, 694);
        ctx.restore();
    },

    drawStageAnnounce(ctx, stageIndex) {
        if (this.stageAnnounceTimer <= 0) return;
        this.stageAnnounceTimer--;
        const info = Stages.stageNames[stageIndex];
        const alpha = this.stageAnnounceTimer > 150 ? Math.min(1, (180 - this.stageAnnounceTimer) / 30 * 1) : this.stageAnnounceTimer / 150;
        ctx.save();
        ctx.globalAlpha = Math.min(1, alpha);
        ctx.fillStyle = '#DDB866';
        ctx.font = 'bold 24px Cinzel, serif';
        ctx.textAlign = 'center';
        ctx.fillText(info.name, 240, 320);
        ctx.fillStyle = '#AA8844';
        ctx.font = '16px "Noto Sans JP", sans-serif';
        ctx.fillText(info.jp, 240, 350);
        ctx.globalAlpha = 1;
        ctx.restore();
    },

    drawBossWarning(ctx, timer) {
        if (timer <= 0) return;
        const t = 120 - timer; // time elapsed since warning started
        const flash = Math.floor(timer / 8) % 2;
        const pulse = 0.5 + Math.sin(t * 0.3) * 0.5;
        ctx.save();

        // Red screen edges pulsing
        ctx.globalAlpha = pulse * 0.15;
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(0, 0, 480, 720);

        // Top and bottom red stripes
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = flash ? '#CC0000' : '#880000';
        ctx.fillRect(0, 0, 480, 24);
        ctx.fillRect(0, 696, 480, 24);

        // Hazard stripes
        ctx.fillStyle = '#000';
        for (let x = -20 + (t * 2) % 40; x < 500; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0); ctx.lineTo(x + 12, 0);
            ctx.lineTo(x + 32, 24); ctx.lineTo(x + 20, 24);
            ctx.closePath(); ctx.fill();
            ctx.beginPath();
            ctx.moveTo(x, 696); ctx.lineTo(x + 12, 696);
            ctx.lineTo(x + 32, 720); ctx.lineTo(x + 20, 720);
            ctx.closePath(); ctx.fill();
        }

        // WARNING text with pulse scale
        const scale = 1 + pulse * 0.08;
        ctx.save();
        ctx.translate(240, 360);
        ctx.scale(scale, scale);
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = flash ? '#FF2222' : '#CC1111';
        ctx.font = 'bold 44px Cinzel, serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        // Text shadow
        ctx.shadowColor = '#FF0000';
        ctx.shadowBlur = 15;
        ctx.fillText('⚠ WARNING ⚠', 0, 0);
        ctx.shadowBlur = 0;
        ctx.restore();

        // Sub text
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = '#FFCC44';
        ctx.font = 'bold 16px "Noto Sans JP", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('大型敵接近中', 240, 395);

        ctx.globalAlpha = 1;
        ctx.restore();
    },

    drawStageClear(ctx, timer) {
        // Phase 1 (0-120): Show "STAGE CLEAR!" text with glow
        const textAlpha = Math.min(1, timer / 30);
        ctx.save();
        ctx.globalAlpha = textAlpha;

        // Gold glow behind text
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 20 + Math.sin(timer * 0.1) * 8;
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 40px Cinzel, serif';
        ctx.textAlign = 'center';
        ctx.fillText('STAGE CLEAR!', 240, 340);
        ctx.shadowBlur = 0;

        // Bonus text
        if (timer > 40) {
            ctx.globalAlpha = Math.min(1, (timer - 40) / 20);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '16px "Noto Sans JP", sans-serif';
            ctx.fillText('ステージクリア！', 240, 380);
        }
        ctx.restore();

        // Phase 2 (120+): Fade to black
        if (timer > 120) {
            const fadeAlpha = Math.min(1, (timer - 120) / 120);
            ctx.save();
            ctx.globalAlpha = fadeAlpha;
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, 480, 720);
            ctx.restore();
        }
    },

    drawGameOver(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, 480, 720);
        ctx.fillStyle = '#CC4444';
        ctx.font = 'bold 40px Cinzel, serif';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', 240, 320);
        ctx.fillStyle = '#AAA';
        ctx.font = '16px "Noto Sans JP", sans-serif';
        ctx.fillText('Z: コンティニュー  Escape: タイトルへ', 240, 400);
        ctx.restore();
    },

    drawEnding(ctx, timer) {
        const alpha = Math.min(1, timer / 60);
        ctx.save();
        ctx.fillStyle = `rgba(10,10,20,${alpha})`;
        ctx.fillRect(0, 0, 480, 720);
        if (timer > 60) {
            ctx.globalAlpha = Math.min(1, (timer - 60) / 60);
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 32px Cinzel, serif';
            ctx.textAlign = 'center';
            ctx.fillText('CONGRATULATIONS!', 240, 250);
            ctx.fillStyle = '#DDB866';
            ctx.font = '18px "Noto Sans JP", sans-serif';
            ctx.fillText('全ステージクリア！', 240, 300);
            ctx.fillText('蒸気の空は再び平和になった', 240, 340);
        }
        if (timer > 180) {
            ctx.globalAlpha = Math.min(1, (timer - 180) / 60);
            ctx.fillStyle = '#AA8844';
            ctx.font = '14px "Noto Sans JP", sans-serif';
            ctx.fillText('STEAMPUNK SKIES ～蒸気空戦記～', 240, 450);
            ctx.fillText('Thank you for playing!', 240, 480);
        }
        if (timer > 360) {
            ctx.globalAlpha = Math.min(1, (timer - 360) / 60);
            ctx.fillStyle = '#888';
            ctx.font = '14px "Noto Sans JP", sans-serif';
            ctx.fillText('Press Z to return to title', 240, 560);
        }
        ctx.globalAlpha = 1;
        ctx.restore();
    },

    drawGear(ctx, x, y, radius, teeth, angle) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.beginPath();
        for (let i = 0; i < teeth; i++) {
            const a1 = (i / teeth) * Math.PI * 2;
            const a2 = ((i + 0.25) / teeth) * Math.PI * 2;
            const a3 = ((i + 0.5) / teeth) * Math.PI * 2;
            const a4 = ((i + 0.75) / teeth) * Math.PI * 2;
            ctx.lineTo(Math.cos(a1) * radius * 0.8, Math.sin(a1) * radius * 0.8);
            ctx.lineTo(Math.cos(a2) * radius, Math.sin(a2) * radius);
            ctx.lineTo(Math.cos(a3) * radius, Math.sin(a3) * radius);
            ctx.lineTo(Math.cos(a4) * radius * 0.8, Math.sin(a4) * radius * 0.8);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    },

    drawPause(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, 480, 720);
        ctx.fillStyle = '#DDB866';
        ctx.font = 'bold 32px Cinzel, serif';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', 240, 340);
        ctx.fillStyle = '#888';
        ctx.font = '14px "Noto Sans JP", sans-serif';
        ctx.fillText('Escape: 再開', 240, 390);
        ctx.restore();
    }
};
