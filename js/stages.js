/* ============================================
   Stage Definitions - 7 Stages
   Longer stages with mid-boss encounters
   ============================================ */
const Stages = {
    currentStage: 0,
    stageTimer: 0,
    waveIndex: 0,
    bossSpawned: false,
    midBossSpawned: false,
    midBossActive: false,
    stageComplete: false,

    stageNames: [
        { name: 'Stage 1: Market District', jp: '第一面：市街地' },
        { name: 'Stage 2: Cathedral Quarter', jp: '第二面：大聖堂地区' },
        { name: 'Stage 3: Harbor', jp: '第三面：港湾' },
        { name: 'Stage 4: Clockwork City', jp: '第四面：時計塔都市' },
        { name: 'Stage 5: Industrial Zone', jp: '第五面：工業地帯' },
        { name: 'Stage 6: Sky City', jp: '第六面：空中都市' },
        { name: 'Stage 7: Machine Temple', jp: '第七面：機械神殿' }
    ],

    init(stageIndex) {
        this.currentStage = stageIndex;
        this.stageTimer = 0;
        this.waveIndex = 0;
        this.bossSpawned = false;
        this.midBossSpawned = false;
        this.midBossActive = false;
        this.stageComplete = false;
    },

    getWaves(stageIndex) {
        const W = [];
        switch (stageIndex) {
            case 0: // Market District (~10200 frames = ~170sec = ~3min)
                // === Phase 0: Intro (0-2400, ~40s) - Light enemies, setting the scene ===
                W.push({ t: 60, e: () => this.spawnFormation('ornithopter', 6, 60, 'line') });
                W.push({ t: 200, e: () => this.spawnFormation('drone', 4, 80, 'scatter') });
                W.push({ t: 360, e: () => this.spawnFormation('ornithopter', 8, 50, 'vee') });
                W.push({ t: 520, e: () => this.spawnFormation('drone', 6, 60, 'scatter') });
                W.push({ t: 700, e: () => this.spawnFormation('ornithopter', 8, 48, 'line') });
                W.push({ t: 880, e: () => [createEnemy('airship', 200, -30, { behavior: 'hover', behaviorData: { hoverY: 100 } })] });
                W.push({ t: 1040, e: () => this.spawnFormation('ornithopter', 10, 44, 'zigzag') });
                W.push({ t: 1200, e: () => this.spawnFormation('drone', 8, 50, 'scatter') });
                W.push({ t: 1400, e: () => this.spawnFormation('ornithopter', 10, 40, 'vee') });
                W.push({ t: 1600, e: () => [createEnemy('airship', 140, -30, { behavior: 'hover', behaviorData: { hoverY: 110 } }), createEnemy('airship', 340, -30, { behavior: 'hover', behaviorData: { hoverY: 110 } })] });
                W.push({ t: 1800, e: () => this.spawnFormation('drone', 10, 44, 'line') });
                W.push({ t: 2000, e: () => this.spawnFormation('ornithopter', 12, 36, 'zigzag') });
                W.push({ t: 2200, e: () => this.spawnFormation('fighter', 4, 80, 'burst') });

                // === Phase 1: Buildup (2400-4800, ~40-80s) - Lead melody kicks in ===
                W.push({ t: 2500, e: () => this.spawnFormation('ornithopter', 12, 36, 'line') });
                W.push({ t: 2700, e: () => this.spawnFormation('drone', 10, 40, 'scatter') });
                W.push({ t: 2900, e: () => this.spawnFormation('fighter', 6, 60, 'burst') });
                W.push({ t: 3100, e: () => [createEnemy('airship', 120, -30, { behavior: 'hover', behaviorData: { hoverY: 100 } }), createEnemy('airship', 240, -30, { behavior: 'hover', behaviorData: { hoverY: 90 } }), createEnemy('airship', 360, -30, { behavior: 'hover', behaviorData: { hoverY: 100 } })] });
                W.push({ t: 3300, e: () => this.spawnFormation('ornithopter', 14, 32, 'vee') });
                W.push({ t: 3500, e: () => this.spawnFormation('drone', 12, 36, 'scatter') });
                W.push({ t: 3700, e: () => this.spawnFormation('fighter', 6, 60, 'burst') });
                W.push({ t: 3900, e: () => this.spawnFormation('ornithopter', 14, 30, 'zigzag') });
                W.push({ t: 4100, e: () => this.spawnFormation('drone', 14, 32, 'line') });
                W.push({ t: 4300, e: () => [createEnemy('balloon', 160, -30), createEnemy('balloon', 320, -30)] });
                W.push({ t: 4500, e: () => this.spawnFormation('fighter', 8, 50, 'burst') });
                W.push({ t: 4700, e: () => this.spawnFormation('ornithopter', 16, 28, 'zigzag') });

                // === Mid-Boss (~5000, ~83s) ===
                W.push({ t: 5000, e: () => 'MIDBOSS' });

                // === Phase 2: Full (5400-8400, ~90-140s) - Arps and stabs, high density ===
                W.push({ t: 5500, e: () => this.spawnFormation('ornithopter', 14, 32, 'line') });
                W.push({ t: 5700, e: () => this.spawnFormation('fighter', 8, 50, 'burst') });
                W.push({ t: 5900, e: () => [createEnemy('gunship', 160, -30, { behavior: 'hover', behaviorData: { hoverY: 80 } }), createEnemy('gunship', 320, -30, { behavior: 'hover', behaviorData: { hoverY: 80 } })] });
                W.push({ t: 6100, e: () => this.spawnFormation('ornithopter', 16, 28, 'vee') });
                W.push({ t: 6300, e: () => this.spawnFormation('drone', 14, 30, 'scatter') });
                W.push({ t: 6500, e: () => this.spawnFormation('fighter', 10, 44, 'burst') });
                W.push({ t: 6700, e: () => [createEnemy('airship', 100, -30, { behavior: 'hover', behaviorData: { hoverY: 100 } }), createEnemy('airship', 240, -30, { behavior: 'hover', behaviorData: { hoverY: 80 } }), createEnemy('airship', 380, -30, { behavior: 'hover', behaviorData: { hoverY: 100 } })] });
                W.push({ t: 6900, e: () => this.spawnFormation('ornithopter', 18, 24, 'zigzag') });
                W.push({ t: 7100, e: () => this.spawnFormation('drone', 16, 26, 'scatter') });
                W.push({ t: 7300, e: () => [createEnemy('balloon', 120, -30), createEnemy('balloon', 240, -30), createEnemy('balloon', 360, -30)] });
                W.push({ t: 7500, e: () => this.spawnFormation('fighter', 10, 40, 'burst') });
                W.push({ t: 7700, e: () => this.spawnFormation('ornithopter', 18, 22, 'line') });
                W.push({ t: 7900, e: () => this.spawnFormation('drone', 16, 26, 'line') });
                W.push({ t: 8100, e: () => [createEnemy('gunship', 120, -30, { behavior: 'hover', behaviorData: { hoverY: 70 } }), createEnemy('gunship', 240, -30, { behavior: 'hover', behaviorData: { hoverY: 60 } }), createEnemy('gunship', 360, -30, { behavior: 'hover', behaviorData: { hoverY: 70 } })] });

                // === Phase 3: Climax (8400+, ~140s+) - Everything goes full tilt ===
                W.push({ t: 8400, e: () => this.spawnFormation('ornithopter', 20, 20, 'zigzag') });
                W.push({ t: 8600, e: () => this.spawnFormation('fighter', 12, 36, 'burst') });
                W.push({ t: 8800, e: () => this.spawnFormation('drone', 18, 22, 'scatter') });
                W.push({ t: 9000, e: () => [createEnemy('airship', 120, -30), createEnemy('airship', 200, -30), createEnemy('airship', 280, -30), createEnemy('airship', 360, -30)] });
                W.push({ t: 9200, e: () => this.spawnFormation('ornithopter', 20, 18, 'vee') });
                W.push({ t: 9400, e: () => this.spawnFormation('fighter', 12, 32, 'burst') });
                W.push({ t: 9600, e: () => this.spawnFormation('balloon', 8, 50, 'line') });
                W.push({ t: 9800, e: () => this.spawnFormation('drone', 20, 20, 'scatter') });
                W.push({ t: 10000, e: () => this.spawnFormation('ornithopter', 22, 16, 'zigzag') });

                // === BOSS at ~170s ===
                W.push({ t: 10200, e: () => 'BOSS' });
                break;
            case 1: // Cathedral Quarter
                W.push({ t: 60, e: () => this.spawnFormation('ornithopter', 14, 34, 'vee') });
                W.push({ t: 160, e: () => this.spawnFormation('drone', 10, 48, 'scatter') });
                W.push({ t: 260, e: () => [createEnemy('balloon', 120, -30), createEnemy('balloon', 240, -30), createEnemy('balloon', 360, -30)] });
                W.push({ t: 360, e: () => this.spawnFormation('ornithopter', 12, 40, 'line') });
                W.push({ t: 460, e: () => this.spawnFormation('drone', 14, 34, 'line') });
                W.push({ t: 580, e: () => [createEnemy('turret', 100, -20, { behavior: 'hover', behaviorData: { hoverY: 100 } }), createEnemy('turret', 240, -20, { behavior: 'hover', behaviorData: { hoverY: 80 } }), createEnemy('turret', 380, -20, { behavior: 'hover', behaviorData: { hoverY: 100 } })] });
                W.push({ t: 680, e: () => this.spawnFormation('fighter', 10, 48, 'burst') });
                W.push({ t: 800, e: () => this.spawnFormation('ornithopter', 16, 30, 'zigzag') });
                W.push({ t: 920, e: () => this.spawnFormation('drone', 12, 40, 'scatter') });
                W.push({ t: 1050, e: () => [createEnemy('airship', 160, -30), createEnemy('airship', 240, -30), createEnemy('airship', 320, -30)] });
                W.push({ t: 1150, e: () => this.spawnFormation('fighter', 8, 60, 'burst') });
                // MID-BOSS
                W.push({ t: 1250, e: () => 'MIDBOSS' });
                W.push({ t: 1650, e: () => this.spawnFormation('balloon', 8, 60, 'line') });
                W.push({ t: 1750, e: () => this.spawnFormation('ornithopter', 14, 34, 'vee') });
                W.push({ t: 1850, e: () => [createEnemy('gunship', 120, -30, { behavior: 'hover', behaviorData: { hoverY: 80 } }), createEnemy('gunship', 240, -30, { behavior: 'hover', behaviorData: { hoverY: 60 } }), createEnemy('gunship', 360, -30, { behavior: 'hover', behaviorData: { hoverY: 80 } })] });
                W.push({ t: 1950, e: () => this.spawnFormation('drone', 16, 30, 'scatter') });
                W.push({ t: 2050, e: () => this.spawnFormation('fighter', 12, 40, 'burst') });
                W.push({ t: 2150, e: () => this.spawnFormation('ornithopter', 18, 26, 'line') });
                W.push({ t: 2250, e: () => this.spawnFormation('ornithopter', 20, 24, 'zigzag') });
                W.push({ t: 2450, e: () => [createEnemy('turret', 100, -20, { behavior: 'hover', behaviorData: { hoverY: 70 } }), createEnemy('turret', 200, -20, { behavior: 'hover', behaviorData: { hoverY: 60 } }), createEnemy('turret', 300, -20, { behavior: 'hover', behaviorData: { hoverY: 70 } }), createEnemy('turret', 400, -20, { behavior: 'hover', behaviorData: { hoverY: 60 } })] });
                W.push({ t: 2600, e: () => this.spawnFormation('fighter', 10, 48, 'burst') });
                W.push({ t: 2700, e: () => this.spawnFormation('drone', 18, 26, 'scatter') });
                W.push({ t: 2900, e: () => 'BOSS' });
                break;
            case 2: // Harbor
                W.push({ t: 60, e: () => this.spawnFormation('drone', 16, 30, 'scatter') });
                W.push({ t: 160, e: () => this.spawnFormation('ornithopter', 12, 40, 'vee') });
                W.push({ t: 240, e: () => [createEnemy('heavyAirship', 160, -40, { behavior: 'hover', behaviorData: { hoverY: 80 } }), createEnemy('heavyAirship', 320, -40, { behavior: 'hover', behaviorData: { hoverY: 80 } })] });
                W.push({ t: 350, e: () => this.spawnFormation('fighter', 8, 60, 'burst') });
                W.push({ t: 450, e: () => this.spawnFormation('ornithopter', 18, 26, 'vee') });
                W.push({ t: 560, e: () => this.spawnFormation('drone', 14, 34, 'scatter') });
                W.push({ t: 620, e: () => [createEnemy('turret', 80, -20, { behavior: 'hover', behaviorData: { hoverY: 90 } }), createEnemy('turret', 180, -20, { behavior: 'hover', behaviorData: { hoverY: 70 } }), createEnemy('turret', 300, -20, { behavior: 'hover', behaviorData: { hoverY: 90 } }), createEnemy('turret', 400, -20, { behavior: 'hover', behaviorData: { hoverY: 70 } })] });
                W.push({ t: 740, e: () => this.spawnFormation('fighter', 12, 40, 'burst') });
                W.push({ t: 860, e: () => this.spawnFormation('ornithopter', 14, 34, 'zigzag') });
                W.push({ t: 1000, e: () => [createEnemy('airship', 120, -30, { behavior: 'sine', behaviorData: { amplitude: 3 } }), createEnemy('airship', 240, -30, { behavior: 'sine', behaviorData: { amplitude: 3 } }), createEnemy('airship', 360, -30, { behavior: 'sine', behaviorData: { amplitude: 3 } })] });
                W.push({ t: 1100, e: () => this.spawnFormation('drone', 18, 26, 'scatter') });
                // MID-BOSS
                W.push({ t: 1200, e: () => 'MIDBOSS' });
                W.push({ t: 1600, e: () => this.spawnFormation('ornithopter', 20, 24, 'zigzag') });
                W.push({ t: 1700, e: () => this.spawnFormation('fighter', 10, 48, 'burst') });
                W.push({ t: 1800, e: () => [createEnemy('heavyAirship', 120, -40), createEnemy('heavyAirship', 240, -40), createEnemy('heavyAirship', 360, -40)] });
                W.push({ t: 1920, e: () => this.spawnFormation('drone', 16, 30, 'scatter') });
                W.push({ t: 2050, e: () => this.spawnFormation('fighter', 14, 34, 'vee') });
                W.push({ t: 2150, e: () => this.spawnFormation('ornithopter', 16, 30, 'line') });
                W.push({ t: 2250, e: () => this.spawnFormation('balloon', 10, 48, 'scatter') });
                W.push({ t: 2450, e: () => [createEnemy('gunship', 100, -30, { behavior: 'hover', behaviorData: { hoverY: 60 } }), createEnemy('gunship', 240, -30, { behavior: 'hover', behaviorData: { hoverY: 50 } }), createEnemy('gunship', 380, -30, { behavior: 'hover', behaviorData: { hoverY: 60 } })] });
                W.push({ t: 2600, e: () => this.spawnFormation('fighter', 12, 40, 'burst') });
                W.push({ t: 2700, e: () => this.spawnFormation('drone', 20, 24, 'scatter') });
                W.push({ t: 2900, e: () => 'BOSS' });
                break;
            case 3: // Clockwork City
                W.push({ t: 60, e: () => this.spawnFormation('ornithopter', 18, 26, 'line') });
                W.push({ t: 160, e: () => this.spawnFormation('drone', 14, 34, 'scatter') });
                W.push({ t: 260, e: () => [createEnemy('gunship', 100, -30, { behavior: 'hover', behaviorData: { hoverY: 70 } }), createEnemy('gunship', 240, -30, { behavior: 'hover', behaviorData: { hoverY: 60 } }), createEnemy('gunship', 380, -30, { behavior: 'hover', behaviorData: { hoverY: 70 } })] });
                W.push({ t: 380, e: () => this.spawnFormation('fighter', 10, 48, 'burst') });
                W.push({ t: 460, e: () => this.spawnFormation('drone', 20, 24, 'scatter') });
                W.push({ t: 560, e: () => this.spawnFormation('ornithopter', 14, 34, 'zigzag') });
                W.push({ t: 640, e: () => this.spawnFormation('fighter', 14, 34, 'vee') });
                W.push({ t: 760, e: () => this.spawnFormation('drone', 16, 30, 'scatter') });
                W.push({ t: 840, e: () => [createEnemy('heavyAirship', 160, -40, { behavior: 'hover', behaviorData: { hoverY: 80 } }), createEnemy('heavyAirship', 320, -40, { behavior: 'hover', behaviorData: { hoverY: 80 } })] });
                W.push({ t: 960, e: () => this.spawnFormation('fighter', 12, 40, 'burst') });
                W.push({ t: 1020, e: () => this.spawnFormation('balloon', 10, 48, 'line') });
                W.push({ t: 1140, e: () => this.spawnFormation('ornithopter', 16, 30, 'vee') });
                // MID-BOSS
                W.push({ t: 1250, e: () => 'MIDBOSS' });
                W.push({ t: 1650, e: () => [createEnemy('turret', 80, -20, { behavior: 'hover', behaviorData: { hoverY: 80 } }), createEnemy('turret', 160, -20, { behavior: 'hover', behaviorData: { hoverY: 60 } }), createEnemy('turret', 320, -20, { behavior: 'hover', behaviorData: { hoverY: 60 } }), createEnemy('turret', 400, -20, { behavior: 'hover', behaviorData: { hoverY: 80 } })] });
                W.push({ t: 1780, e: () => this.spawnFormation('ornithopter', 22, 22, 'zigzag') });
                W.push({ t: 1900, e: () => this.spawnFormation('drone', 18, 26, 'scatter') });
                W.push({ t: 2050, e: () => this.spawnFormation('fighter', 16, 30, 'burst') });
                W.push({ t: 2180, e: () => this.spawnFormation('ornithopter', 18, 26, 'line') });
                W.push({ t: 2250, e: () => [createEnemy('gunship', 140, -30, { behavior: 'hover', behaviorData: { hoverY: 70 } }), createEnemy('gunship', 340, -30, { behavior: 'hover', behaviorData: { hoverY: 70 } })] });
                W.push({ t: 2400, e: () => this.spawnFormation('fighter', 14, 34, 'burst') });
                W.push({ t: 2500, e: () => this.spawnFormation('drone', 24, 20, 'scatter') });
                W.push({ t: 2700, e: () => this.spawnFormation('balloon', 8, 60, 'scatter') });
                W.push({ t: 2900, e: () => 'BOSS' });
                break;
            case 4: // Industrial Zone
                W.push({ t: 40, e: () => this.spawnFormation('fighter', 14, 34, 'burst') });
                W.push({ t: 140, e: () => this.spawnFormation('drone', 16, 30, 'scatter') });
                W.push({ t: 220, e: () => [createEnemy('heavyAirship', 120, -40), createEnemy('heavyAirship', 240, -40), createEnemy('heavyAirship', 360, -40)] });
                W.push({ t: 340, e: () => this.spawnFormation('ornithopter', 18, 26, 'zigzag') });
                W.push({ t: 440, e: () => this.spawnFormation('drone', 20, 24, 'scatter') });
                W.push({ t: 540, e: () => this.spawnFormation('fighter', 10, 48, 'vee') });
                W.push({ t: 620, e: () => this.spawnFormation('ornithopter', 22, 22, 'vee') });
                W.push({ t: 740, e: () => this.spawnFormation('drone', 18, 26, 'scatter') });
                W.push({ t: 830, e: () => [createEnemy('gunship', 100, -30, { behavior: 'hover', behaviorData: { hoverY: 60 } }), createEnemy('gunship', 200, -30, { behavior: 'hover', behaviorData: { hoverY: 70 } }), createEnemy('gunship', 300, -30, { behavior: 'hover', behaviorData: { hoverY: 60 } }), createEnemy('gunship', 400, -30, { behavior: 'hover', behaviorData: { hoverY: 70 } })] });
                W.push({ t: 960, e: () => this.spawnFormation('fighter', 14, 34, 'burst') });
                // MID-BOSS
                W.push({ t: 1100, e: () => 'MIDBOSS' });
                W.push({ t: 1500, e: () => this.spawnFormation('fighter', 18, 26, 'burst') });
                W.push({ t: 1600, e: () => this.spawnFormation('ornithopter', 20, 24, 'zigzag') });
                W.push({ t: 1700, e: () => this.spawnFormation('balloon', 12, 40, 'scatter') });
                W.push({ t: 1800, e: () => this.spawnFormation('drone', 22, 22, 'scatter') });
                W.push({ t: 1900, e: () => [createEnemy('heavyAirship', 180, -40, { hp: 50, behavior: 'hover', behaviorData: { hoverY: 70 } }), createEnemy('heavyAirship', 300, -40, { hp: 50, behavior: 'hover', behaviorData: { hoverY: 70 } })] });
                W.push({ t: 2020, e: () => this.spawnFormation('fighter', 16, 30, 'vee') });
                W.push({ t: 2100, e: () => this.spawnFormation('turret', 6, 80, 'line').map(e => { e.behavior = 'hover'; e.behaviorData = { hoverY: 80 }; return e; }) });
                W.push({ t: 2250, e: () => this.spawnFormation('ornithopter', 24, 20, 'zigzag') });
                W.push({ t: 2400, e: () => this.spawnFormation('drone', 24, 20, 'scatter') });
                W.push({ t: 2600, e: () => this.spawnFormation('fighter', 18, 26, 'burst') });
                W.push({ t: 2900, e: () => 'BOSS' });
                break;
            case 5: // Sky City
                W.push({ t: 60, e: () => this.spawnFormation('ornithopter', 22, 22, 'zigzag') });
                W.push({ t: 160, e: () => this.spawnFormation('drone', 18, 26, 'scatter') });
                W.push({ t: 280, e: () => [createEnemy('airship', 100, -30, { behavior: 'sine', behaviorData: { amplitude: 4 } }), createEnemy('airship', 200, -30), createEnemy('airship', 300, -30), createEnemy('airship', 400, -30, { behavior: 'sine', behaviorData: { amplitude: 4 } })] });
                W.push({ t: 400, e: () => this.spawnFormation('fighter', 14, 34, 'burst') });
                W.push({ t: 500, e: () => this.spawnFormation('fighter', 18, 26, 'vee') });
                W.push({ t: 620, e: () => this.spawnFormation('ornithopter', 16, 30, 'line') });
                W.push({ t: 720, e: () => this.spawnFormation('drone', 24, 20, 'scatter') });
                W.push({ t: 840, e: () => this.spawnFormation('fighter', 12, 40, 'burst') });
                W.push({ t: 950, e: () => [createEnemy('heavyAirship', 100, -40), createEnemy('heavyAirship', 240, -40), createEnemy('heavyAirship', 380, -40)] });
                W.push({ t: 1080, e: () => this.spawnFormation('ornithopter', 20, 24, 'vee') });
                // MID-BOSS
                W.push({ t: 1200, e: () => 'MIDBOSS' });
                W.push({ t: 1600, e: () => this.spawnFormation('turret', 6, 80, 'line').map(e => { e.behavior = 'hover'; e.behaviorData = { hoverY: 70 }; return e; }) });
                W.push({ t: 1720, e: () => this.spawnFormation('ornithopter', 24, 20, 'line') });
                W.push({ t: 1800, e: () => this.spawnFormation('fighter', 16, 30, 'burst') });
                W.push({ t: 1900, e: () => this.spawnFormation('drone', 22, 22, 'scatter') });
                W.push({ t: 2000, e: () => [createEnemy('gunship', 120, -30, { hp: 30, behavior: 'hover', behaviorData: { hoverY: 60 } }), createEnemy('gunship', 240, -30, { hp: 30, behavior: 'hover', behaviorData: { hoverY: 50 } }), createEnemy('gunship', 360, -30, { hp: 30, behavior: 'hover', behaviorData: { hoverY: 60 } })] });
                W.push({ t: 2150, e: () => this.spawnFormation('ornithopter', 20, 24, 'zigzag') });
                W.push({ t: 2250, e: () => this.spawnFormation('fighter', 18, 26, 'burst') });
                W.push({ t: 2400, e: () => this.spawnFormation('drone', 24, 20, 'scatter') });
                W.push({ t: 2500, e: () => this.spawnFormation('balloon', 12, 40, 'scatter') });
                W.push({ t: 2700, e: () => [createEnemy('heavyAirship', 140, -40), createEnemy('heavyAirship', 240, -40), createEnemy('heavyAirship', 340, -40)] });
                W.push({ t: 2900, e: () => 'BOSS' });
                break;
            case 6: // Machine Temple
                W.push({ t: 40, e: () => this.spawnFormation('fighter', 18, 26, 'burst') });
                W.push({ t: 120, e: () => this.spawnFormation('drone', 22, 22, 'scatter') });
                W.push({ t: 200, e: () => this.spawnFormation('ornithopter', 20, 24, 'zigzag') });
                W.push({ t: 300, e: () => this.spawnFormation('fighter', 14, 34, 'vee') });
                W.push({ t: 380, e: () => [createEnemy('heavyAirship', 100, -40), createEnemy('heavyAirship', 200, -40), createEnemy('heavyAirship', 300, -40), createEnemy('heavyAirship', 400, -40)] });
                W.push({ t: 500, e: () => this.spawnFormation('drone', 24, 20, 'scatter') });
                W.push({ t: 600, e: () => this.spawnFormation('ornithopter', 22, 22, 'zigzag') });
                W.push({ t: 720, e: () => this.spawnFormation('fighter', 16, 30, 'burst') });
                W.push({ t: 840, e: () => [createEnemy('gunship', 80, -30, { hp: 30, behavior: 'hover', behaviorData: { hoverY: 60 } }), createEnemy('gunship', 200, -30, { hp: 30, behavior: 'hover', behaviorData: { hoverY: 50 } }), createEnemy('gunship', 320, -30, { hp: 30, behavior: 'hover', behaviorData: { hoverY: 60 } }), createEnemy('gunship', 440, -30, { hp: 30, behavior: 'hover', behaviorData: { hoverY: 50 } })] });
                W.push({ t: 960, e: () => this.spawnFormation('ornithopter', 24, 20, 'line') });
                // MID-BOSS
                W.push({ t: 1100, e: () => 'MIDBOSS' });
                W.push({ t: 1500, e: () => this.spawnFormation('balloon', 14, 34, 'scatter') });
                W.push({ t: 1600, e: () => this.spawnFormation('fighter', 20, 24, 'burst') });
                W.push({ t: 1700, e: () => this.spawnFormation('fighter', 18, 26, 'vee') });
                W.push({ t: 1800, e: () => this.spawnFormation('drone', 26, 18, 'scatter') });
                W.push({ t: 1900, e: () => [createEnemy('turret', 80, -20, { hp: 20, behavior: 'hover', behaviorData: { hoverY: 60 } }), createEnemy('turret', 180, -20, { hp: 20, behavior: 'hover', behaviorData: { hoverY: 80 } }), createEnemy('turret', 280, -20, { hp: 20, behavior: 'hover', behaviorData: { hoverY: 60 } }), createEnemy('turret', 380, -20, { hp: 20, behavior: 'hover', behaviorData: { hoverY: 80 } })] });
                W.push({ t: 2050, e: () => this.spawnFormation('ornithopter', 26, 18, 'zigzag') });
                W.push({ t: 2200, e: () => this.spawnFormation('fighter', 18, 26, 'burst') });
                W.push({ t: 2300, e: () => this.spawnFormation('drone', 28, 17, 'scatter') });
                W.push({ t: 2400, e: () => [createEnemy('heavyAirship', 100, -40, { hp: 60 }), createEnemy('heavyAirship', 240, -40, { hp: 60 }), createEnemy('heavyAirship', 380, -40, { hp: 60 })] });
                W.push({ t: 2550, e: () => this.spawnFormation('ornithopter', 24, 20, 'vee') });
                W.push({ t: 2650, e: () => this.spawnFormation('drone', 30, 16, 'scatter') });
                W.push({ t: 2800, e: () => this.spawnFormation('fighter', 14, 34, 'burst') });
                W.push({ t: 2900, e: () => 'BOSS' });
                break;
        }
        return W;
    },

    spawnFormation(type, count, spacing, pattern) {
        const enemies = [];
        for (let i = 0; i < count; i++) {
            let x, y, config = {};
            switch (pattern) {
                case 'line':
                    x = 40 + (400 / (count - 1 || 1)) * i;
                    y = -20 - i * 15;
                    break;
                case 'vee':
                    x = 240 + (i - (count - 1) / 2) * spacing * 0.6;
                    y = -20 - Math.abs(i - (count - 1) / 2) * 20;
                    break;
                case 'burst':
                    x = 100 + Math.random() * 280;
                    y = -20 - Math.random() * 60;
                    config.vy = 1.5 + Math.random();
                    break;
                case 'scatter':
                    x = 40 + Math.random() * 400;
                    y = -20 - Math.random() * 100;
                    config.behavior = 'sine';
                    config.behaviorData = { amplitude: 1 + Math.random() * 2 };
                    break;
                case 'zigzag':
                    x = 40 + (400 / (count - 1 || 1)) * i;
                    y = -20 - i * 20;
                    config.behavior = 'zigzag';
                    break;
                default:
                    x = 240; y = -20 - i * 20;
            }
            enemies.push(createEnemy(type, x, y, config));
        }
        return enemies;
    },

    update(game) {
        this.stageTimer++;
        const waves = this.getWaves(this.currentStage);

        while (this.waveIndex < waves.length && this.stageTimer >= waves[this.waveIndex].t) {
            const result = waves[this.waveIndex].e();
            if (result === 'BOSS') {
                if (!this.bossSpawned) {
                    game.spawnBoss(this.currentStage);
                    this.bossSpawned = true;
                    Audio.bossWarning();
                }
            } else if (result === 'MIDBOSS') {
                if (!this.midBossSpawned) {
                    game.spawnMidBoss(this.currentStage);
                    this.midBossSpawned = true;
                    this.midBossActive = true;
                }
            } else if (Array.isArray(result)) {
                result.forEach(e => game.enemies.push(e));
            }
            this.waveIndex++;
        }
    }
};
