/* ============================================
   Tile-Based Steampunk Background System
   Pre-renders detailed tiles to offscreen canvases,
   assembles via tilemaps, scrolls downward.
   Each stage: ~200 rows × 8 cols = 3+ min scroll
   ============================================ */
const TILE = 60;       // tile size in px
const COLS = 8;        // 8 × 60 = 480
const MAP_ROWS = 220;  // 220 × 60 = 13200px ≈ 3.5 min @63px/s

const Background = {
    scrollY: 0,
    scrollSpeed: 1.2,
    tileCanvases: {},   // keyed by tile id
    tilemap: [],        // 2D array [row][col] of tile id
    stageTheme: 0,
    clouds: [],
    rendered: false,

    /* ---- colour palettes per stage ---- */
    palettes: [
        { sky: '#1a1a2e', ground: '#3a2f25', road: '#4a3f35', roofH: ['#8B4513', '#A0522D', '#7B3B1A', '#6B3410'], wall: ['#C4956A', '#B8895E', '#D4A67A', '#BFA07A'], window: '#FFD080', accent: '#DDB866', water: null },
        { sky: '#18142a', ground: '#2f2530', road: '#3f3540', roofH: ['#5a3570', '#6a4580', '#4a2560', '#7a5590'], wall: ['#9a8aaa', '#aa9abb', '#8a7a9a', '#bbaacb'], window: '#EECCFF', accent: '#DDAAFF', water: null },
        { sky: '#0e1a2e', ground: '#2a3540', road: '#3a4550', roofH: ['#3a5060', '#4a6070', '#2a4050', '#5a7080'], wall: ['#7a8a9a', '#8a9aaa', '#6a7a8a', '#9aaabb'], window: '#AAE0FF', accent: '#88CCEE', water: '#1a4a6a' },
        { sky: '#1a1820', ground: '#2e2818', road: '#3e3828', roofH: ['#7B6B3A', '#8B7B4A', '#6B5B2A', '#9B8B5A'], wall: ['#BCA06A', '#CCB07A', '#ACA05A', '#DCBF8A'], window: '#FFE066', accent: '#FFD700', water: null },
        { sky: '#1a0808', ground: '#1a1212', road: '#2a1a1a', roofH: ['#5a3030', '#6a4040', '#4a2020', '#7a5050'], wall: ['#8a6a6a', '#7a5a5a', '#9a7a7a', '#6a4a4a'], window: '#FF8844', accent: '#FF6633', water: null },
        { sky: '#4466aa', ground: '#c0d0e8', road: '#b0c0d8', roofH: ['#dde8f8', '#ccddef', '#eef4ff', '#bbccdd'], wall: ['#ffffff', '#eef0ff', '#dde0ef', '#f0f4ff'], window: '#AADDFF', accent: '#88BBFF', water: null },
        { sky: '#050510', ground: '#0e0e1e', road: '#1a1a2a', roofH: ['#2a2a3e', '#3a3a4e', '#1a1a2e', '#4a4a5e'], wall: ['#5a5a7a', '#4a4a6a', '#6a6a8a', '#3a3a5a'], window: '#CC88FF', accent: '#AA66FF', water: null },
    ],

    /* ================= TILE IDS ================== */
    // 0  = ground/empty
    // 1-6 = house variants (small buildings)
    // 7  = tall building
    // 8  = church / cathedral
    // 9  = factory
    // 10 = clock tower
    // 11 = road horizontal
    // 12 = road vertical
    // 13 = road cross
    // 14 = park / trees
    // 15 = water / canal
    // 16 = bridge
    // 17 = large gear ground
    // 18 = chimney building
    // 19 = pipe building

    /* ================= INIT ====================== */
    init(stageIndex) {
        this.stageTheme = stageIndex % this.palettes.length;
        this.scrollY = 0;
        this.rendered = false;
        this.tileCanvases = {};
        this.clouds = [];
        this.generateClouds();
        this.renderAllTiles();
        this.generateTilemap();
        this.rendered = true;
    },

    /* ================= TILE RENDERING ============= */
    renderAllTiles() {
        const P = this.palettes[this.stageTheme];
        for (let id = 0; id <= 19; id++) {
            const c = document.createElement('canvas');
            c.width = TILE; c.height = TILE;
            const x = c.getContext('2d');
            this.drawTile(x, id, P);
            this.tileCanvases[id] = c;
        }
    },

    drawTile(ctx, id, P) {
        const T = TILE;
        // fill ground
        ctx.fillStyle = P.ground;
        ctx.fillRect(0, 0, T, T);

        switch (id) {
            case 0: this.drawGround(ctx, P); break;
            case 1: case 2: case 3: case 4: case 5: case 6:
                this.drawHouse(ctx, P, id); break;
            case 7: this.drawTallBuilding(ctx, P); break;
            case 8: this.drawChurch(ctx, P); break;
            case 9: this.drawFactory(ctx, P); break;
            case 10: this.drawClockTower(ctx, P); break;
            case 11: this.drawRoadH(ctx, P); break;
            case 12: this.drawRoadV(ctx, P); break;
            case 13: this.drawRoadCross(ctx, P); break;
            case 14: this.drawPark(ctx, P); break;
            case 15: this.drawWater(ctx, P); break;
            case 16: this.drawBridge(ctx, P); break;
            case 17: this.drawGearGround(ctx, P); break;
            case 18: this.drawChimneyBuilding(ctx, P); break;
            case 19: this.drawPipeBuilding(ctx, P); break;
        }
        // vignette edge shadow for depth
        const g = ctx.createLinearGradient(0, 0, 0, T);
        g.addColorStop(0, 'rgba(0,0,0,0.08)'); g.addColorStop(0.3, 'rgba(0,0,0,0)');
        g.addColorStop(0.7, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.08)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, T, T);
    },

    /* ------- helper: cobblestone noise ------- */
    cobble(ctx, x0, y0, w, h, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x0, y0, w, h);
        // procedural cobblestone
        const seed = x0 * 31 + y0 * 17;
        for (let i = 0; i < 18; i++) {
            const px = x0 + ((seed * (i + 1) * 7) % w);
            const py = y0 + ((seed * (i + 1) * 13) % h);
            const br = ((seed * (i + 1) * 3) % 40) - 20;
            ctx.fillStyle = `rgba(${br > 0 ? 255 : 0},${br > 0 ? 255 : 0},${br > 0 ? 255 : 0},${Math.abs(br) / 255})`;
            ctx.fillRect(px, py, 3, 2);
        }
    },

    /* ------- helper: roof shingles ------- */
    shingles(ctx, x0, y0, w, h, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x0, y0, w, h);
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 0.5;
        for (let row = 0; row < h; row += 4) {
            const off = (row / 4) % 2 === 0 ? 0 : 3;
            for (let col = off; col < w; col += 6) {
                ctx.strokeRect(x0 + col, y0 + row, 6, 4);
            }
        }
    },

    /* ------- helper: windows grid ------- */
    windows(ctx, x0, y0, w, h, winColor, cols, rows) {
        const gx = w / (cols + 1);
        const gy = h / (rows + 1);
        for (let r = 1; r <= rows; r++) {
            for (let c = 1; c <= cols; c++) {
                const wx = x0 + c * gx - 2;
                const wy = y0 + r * gy - 2;
                // window glow
                ctx.fillStyle = winColor;
                ctx.globalAlpha = 0.5 + Math.sin(wx * 3.7 + wy * 7.3) * 0.3;
                ctx.fillRect(wx, wy, 4, 3);
                ctx.globalAlpha = 1;
            }
        }
    },

    /* ===== TILE DRAW FUNCTIONS ===== */

    drawGround(ctx, P) {
        this.cobble(ctx, 0, 0, TILE, TILE, P.ground);
        // random weeds / cracks
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(12, 20); ctx.lineTo(30, 35); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(40, 10); ctx.lineTo(45, 45); ctx.stroke();
    },

    drawHouse(ctx, P, variant) {
        const T = TILE;
        const m = 4; // margin
        const roofC = P.roofH[(variant - 1) % P.roofH.length];
        const wallC = P.wall[(variant - 1) % P.wall.length];
        // shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(m + 3, m + 3, T - m * 2, T - m * 2);
        // wall
        ctx.fillStyle = wallC;
        ctx.fillRect(m, m, T - m * 2, T - m * 2);
        // roof
        const rh = 14 + (variant % 3) * 4;
        this.shingles(ctx, m, m, T - m * 2, rh, roofC);
        // roof ridge line
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (variant % 2 === 0) {
            ctx.moveTo(m, m + rh / 2); ctx.lineTo(T - m, m + rh / 2);
        } else {
            ctx.moveTo(T / 2, m); ctx.lineTo(T / 2, m + rh);
        }
        ctx.stroke();
        // windows
        this.windows(ctx, m, m + rh, T - m * 2, T - m * 2 - rh, P.window, 2, 2);
        // edge detail
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 1;
        ctx.strokeRect(m, m, T - m * 2, T - m * 2);
    },

    drawTallBuilding(ctx, P) {
        const T = TILE, m = 2;
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(m + 4, m + 4, T - m * 2, T - m * 2);
        ctx.fillStyle = P.wall[0];
        ctx.fillRect(m, m, T - m * 2, T - m * 2);
        // flat roof with edge wall
        ctx.fillStyle = P.roofH[0];
        ctx.fillRect(m, m, T - m * 2, 6);
        ctx.fillRect(m, T - m - 6, T - m * 2, 6);
        ctx.fillRect(m, m, 6, T - m * 2);
        ctx.fillRect(T - m - 6, m, 6, T - m * 2);
        // roof equipment
        ctx.fillStyle = 'rgba(80,80,80,0.6)';
        ctx.fillRect(18, 18, 10, 8);
        ctx.fillRect(34, 26, 8, 10);
        // windows (more)
        this.windows(ctx, m + 6, m + 6, T - m * 2 - 12, T - m * 2 - 12, P.window, 3, 3);
        // deeper shadow (tall)
        ctx.fillStyle = 'rgba(0,0,0,0.07)';
        ctx.fillRect(m, m, T - m * 2, T - m * 2);
    },

    drawChurch(ctx, P) {
        const T = TILE, cx = T / 2, cy = T / 2;
        // shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(8, 8, T - 10, T - 10);
        // main body (cross shaped)
        ctx.fillStyle = P.wall[1] || P.wall[0];
        ctx.fillRect(10, 5, T - 20, T - 10); // vertical
        ctx.fillRect(3, 18, T - 6, 24);       // horizontal
        // roof
        this.shingles(ctx, 10, 5, T - 20, 12, P.roofH[0]);
        this.shingles(ctx, 3, 18, T - 6, 8, P.roofH[1] || P.roofH[0]);
        // steeple
        ctx.fillStyle = P.roofH[0];
        ctx.beginPath();
        ctx.moveTo(cx, 0); ctx.lineTo(cx - 8, 14); ctx.lineTo(cx + 8, 14);
        ctx.closePath(); ctx.fill();
        // cross on top
        ctx.fillStyle = P.accent;
        ctx.fillRect(cx - 1, 0, 2, 8);
        ctx.fillRect(cx - 3, 3, 6, 2);
        // rose window
        ctx.fillStyle = P.window;
        ctx.globalAlpha = 0.6;
        ctx.beginPath(); ctx.arc(cx, cy + 4, 5, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
        // stained glass dots
        const sgColors = ['#FF6688', '#66AAFF', '#FFCC44', '#88FF88'];
        for (let i = 0; i < 4; i++) {
            ctx.fillStyle = sgColors[i];
            ctx.globalAlpha = 0.5;
            const a = (i / 4) * Math.PI * 2;
            ctx.beginPath();
            ctx.arc(cx + Math.cos(a) * 3, cy + 4 + Math.sin(a) * 3, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    },

    drawFactory(ctx, P) {
        const T = TILE, m = 3;
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(m + 3, m + 3, T - m * 2, T - m * 2);
        // main building
        ctx.fillStyle = P.wall[2] || P.wall[0];
        ctx.fillRect(m, m + 8, T - m * 2, T - m * 2 - 8);
        // sawtooth roof
        ctx.fillStyle = P.roofH[2] || P.roofH[0];
        for (let i = 0; i < 4; i++) {
            const sx = m + i * ((T - m * 2) / 4);
            const sw = (T - m * 2) / 4;
            ctx.beginPath();
            ctx.moveTo(sx, m + 8); ctx.lineTo(sx + sw / 2, m); ctx.lineTo(sx + sw, m + 8);
            ctx.closePath(); ctx.fill();
        }
        // smokestacks
        ctx.fillStyle = '#5a4a3a';
        ctx.fillRect(8, m - 2, 5, 12);
        ctx.fillRect(T - 14, m - 2, 5, 12);
        // smoke puffs (static)
        ctx.fillStyle = 'rgba(180,180,190,0.25)';
        ctx.beginPath(); ctx.arc(10, m - 6, 5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(T - 12, m - 8, 6, 0, Math.PI * 2); ctx.fill();
        // pipes on roof
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(20, 20); ctx.lineTo(40, 20); ctx.lineTo(40, 40); ctx.stroke();
        // small windows
        this.windows(ctx, m + 2, m + 12, T - m * 2 - 4, T - m * 2 - 16, P.window, 3, 2);
    },

    drawClockTower(ctx, P) {
        const T = TILE, cx = T / 2, cy = T / 2;
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(cx - 14, cy - 14, 32, 32);
        // tower base
        ctx.fillStyle = P.wall[0];
        ctx.fillRect(cx - 12, cy - 12, 24, 24);
        // roof
        ctx.fillStyle = P.roofH[0];
        ctx.beginPath();
        ctx.moveTo(cx, cy - 22); ctx.lineTo(cx - 14, cy - 8); ctx.lineTo(cx + 14, cy - 8);
        ctx.closePath(); ctx.fill();
        // clock face
        ctx.fillStyle = '#EEEEDD';
        ctx.beginPath(); ctx.arc(cx, cy + 2, 8, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
        ctx.stroke();
        // hour marks
        for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(cx + Math.cos(a) * 6, cy + 2 + Math.sin(a) * 6, 0.8, 0, Math.PI * 2);
            ctx.fill();
        }
        // hands (static decorative)
        ctx.strokeStyle = '#333'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(cx, cy + 2); ctx.lineTo(cx + 3, cy - 3); ctx.stroke();
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx, cy + 2); ctx.lineTo(cx - 2, cy + 7); ctx.stroke();
        // decorative gears around base
        ctx.strokeStyle = P.accent; ctx.lineWidth = 0.8; ctx.globalAlpha = 0.5;
        this.miniGear(ctx, cx - 16, cy + 10, 5);
        this.miniGear(ctx, cx + 16, cy + 10, 5);
        ctx.globalAlpha = 1;
    },

    drawRoadH(ctx, P) {
        this.cobble(ctx, 0, 0, TILE, TILE, P.ground);
        ctx.fillStyle = P.road;
        ctx.fillRect(0, 16, TILE, 28);
        // lane line
        ctx.strokeStyle = 'rgba(255,255,200,0.15)';
        ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, 30); ctx.lineTo(TILE, 30); ctx.stroke();
        ctx.setLineDash([]);
        // edge stones
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(0, 15, TILE, 1); ctx.fillRect(0, 44, TILE, 1);
    },

    drawRoadV(ctx, P) {
        this.cobble(ctx, 0, 0, TILE, TILE, P.ground);
        ctx.fillStyle = P.road;
        ctx.fillRect(16, 0, 28, TILE);
        ctx.strokeStyle = 'rgba(255,255,200,0.15)';
        ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(30, 0); ctx.lineTo(30, TILE); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(15, 0, 1, TILE); ctx.fillRect(44, 0, 1, TILE);
    },

    drawRoadCross(ctx, P) {
        this.cobble(ctx, 0, 0, TILE, TILE, P.ground);
        ctx.fillStyle = P.road;
        ctx.fillRect(0, 16, TILE, 28);
        ctx.fillRect(16, 0, 28, TILE);
        // cobble center
        this.cobble(ctx, 16, 16, 28, 28, P.road);
    },

    drawPark(ctx, P) {
        // grass
        ctx.fillStyle = this.stageTheme === 5 ? '#c8e8c0' : '#2a4a2a';
        ctx.fillRect(0, 0, TILE, TILE);
        // grass texture
        ctx.fillStyle = this.stageTheme === 5 ? '#b8d8b0' : '#1a3a1a';
        for (let i = 0; i < 12; i++) {
            const px = (i * 37) % TILE, py = (i * 23) % TILE;
            ctx.fillRect(px, py, 3, 2);
        }
        // trees (circles from above)
        const treeColor = this.stageTheme === 5 ? '#70a868' : '#1a5a1a';
        const treeShadow = this.stageTheme === 5 ? '#5a8a52' : '#0a3a0a';
        // 2-3 trees
        const trees = [[15, 15, 9], [42, 38, 7], [20, 45, 8]];
        for (const [tx, ty, tr] of trees) {
            ctx.fillStyle = treeShadow;
            ctx.beginPath(); ctx.arc(tx + 2, ty + 2, tr, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = treeColor;
            ctx.beginPath(); ctx.arc(tx, ty, tr, 0, Math.PI * 2); ctx.fill();
            // foliage texture
            ctx.fillStyle = 'rgba(255,255,255,0.08)';
            ctx.beginPath(); ctx.arc(tx - 2, ty - 2, tr * 0.5, 0, Math.PI * 2); ctx.fill();
        }
        // path
        ctx.fillStyle = P.road;
        ctx.fillRect(26, 0, 8, TILE);
    },

    drawWater(ctx, P) {
        const wc = P.water || '#1a3a6a';
        ctx.fillStyle = wc;
        ctx.fillRect(0, 0, TILE, TILE);
        // wave lines
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 0.8;
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            for (let x = 0; x < TILE; x += 2) {
                const y = 8 + i * 12 + Math.sin(x * 0.3 + i * 2) * 2;
                if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
        // reflection shimmer
        ctx.fillStyle = 'rgba(200,220,255,0.05)';
        ctx.fillRect(10, 15, 20, 3);
        ctx.fillRect(30, 35, 15, 2);
    },

    drawBridge(ctx, P) {
        this.drawWater(ctx, P);
        // bridge planks
        ctx.fillStyle = '#6a5030';
        ctx.fillRect(8, 0, 44, TILE);
        // plank lines
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 0.5;
        for (let y = 0; y < TILE; y += 5) {
            ctx.beginPath(); ctx.moveTo(8, y); ctx.lineTo(52, y); ctx.stroke();
        }
        // railings
        ctx.fillStyle = '#4a3a20';
        ctx.fillRect(6, 0, 3, TILE);
        ctx.fillRect(51, 0, 3, TILE);
        // railing posts
        ctx.fillStyle = '#3a2a10';
        for (let y = 0; y < TILE; y += 15) {
            ctx.fillRect(5, y, 5, 3);
            ctx.fillRect(50, y, 5, 3);
        }
    },

    drawGearGround(ctx, P) {
        ctx.fillStyle = P.ground;
        ctx.fillRect(0, 0, TILE, TILE);
        // large gear embedded in ground
        ctx.strokeStyle = P.accent;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.35;
        this.miniGear(ctx, TILE / 2, TILE / 2, 22);
        ctx.globalAlpha = 0.2;
        this.miniGear(ctx, 12, 12, 10);
        this.miniGear(ctx, TILE - 12, TILE - 12, 8);
        ctx.globalAlpha = 1;
        // metal plates
        ctx.fillStyle = 'rgba(120,120,140,0.15)';
        ctx.fillRect(5, 5, 20, 2);
        ctx.fillRect(35, 40, 18, 2);
        // rivets
        ctx.fillStyle = P.accent;
        ctx.globalAlpha = 0.3;
        for (let i = 0; i < 6; i++) {
            const rx = 10 + (i * 41) % 40, ry = 10 + (i * 29) % 40;
            ctx.beginPath(); ctx.arc(rx, ry, 1.2, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
    },

    drawChimneyBuilding(ctx, P) {
        this.drawHouse(ctx, P, 3);
        // extra chimney stack
        ctx.fillStyle = '#5a4a3a';
        ctx.fillRect(40, 0, 8, 18);
        ctx.fillStyle = '#4a3a2a';
        ctx.fillRect(39, 15, 10, 3);
        // smoke
        ctx.fillStyle = 'rgba(180,180,190,0.2)';
        ctx.beginPath(); ctx.arc(44, -2, 6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(46, -8, 4, 0, Math.PI * 2); ctx.fill();
    },

    drawPipeBuilding(ctx, P) {
        this.drawHouse(ctx, P, 5);
        // pipes running across roof
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(6, 12); ctx.lineTo(54, 12); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(30, 8); ctx.lineTo(30, 55); ctx.stroke();
        // pipe joints
        ctx.fillStyle = '#999';
        ctx.beginPath(); ctx.arc(30, 12, 4, 0, Math.PI * 2); ctx.fill();
        // valves
        ctx.strokeStyle = P.accent; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(18, 8); ctx.lineTo(18, 16); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(42, 8); ctx.lineTo(42, 16); ctx.stroke();
    },

    /* --- helper: mini gear --- */
    miniGear(ctx, gx, gy, gr) {
        const teeth = Math.max(6, Math.round(gr * 0.6));
        ctx.beginPath();
        for (let i = 0; i < teeth; i++) {
            const a1 = (i / teeth) * Math.PI * 2;
            const a2 = ((i + 0.3) / teeth) * Math.PI * 2;
            const a3 = ((i + 0.5) / teeth) * Math.PI * 2;
            const a4 = ((i + 0.8) / teeth) * Math.PI * 2;
            ctx.lineTo(gx + Math.cos(a1) * gr * 0.75, gy + Math.sin(a1) * gr * 0.75);
            ctx.lineTo(gx + Math.cos(a2) * gr, gy + Math.sin(a2) * gr);
            ctx.lineTo(gx + Math.cos(a3) * gr, gy + Math.sin(a3) * gr);
            ctx.lineTo(gx + Math.cos(a4) * gr * 0.75, gy + Math.sin(a4) * gr * 0.75);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath(); ctx.arc(gx, gy, gr * 0.25, 0, Math.PI * 2); ctx.stroke();
    },

    /* ================ TILEMAP GENERATION =============== */
    generateTilemap() {
        this.tilemap = [];
        const theme = this.stageTheme;
        // seeded pseudo-random
        let seed = theme * 12345 + 9876;
        const rand = () => { seed = (seed * 16807 + 11) % 2147483647; return (seed & 0x7fffffff) / 0x7fffffff; };

        // Stage-specific tile distributions
        const tileWeights = this.getTileWeights(theme);

        for (let row = 0; row < MAP_ROWS; row++) {
            const r = [];
            for (let col = 0; col < COLS; col++) {
                // roads every ~8 rows, and 2 vertical road columns
                const isRoadRow = (row % 12 >= 5 && row % 12 <= 5);
                const isRoadCol = (col === 2 || col === 5);
                const isIntersection = isRoadRow && isRoadCol;

                if (isIntersection) {
                    r.push(13);
                } else if (isRoadRow) {
                    r.push(11);
                } else if (isRoadCol) {
                    r.push(12);
                } else {
                    // weighted random tile
                    const v = rand();
                    let cumul = 0;
                    let chosen = 0;
                    for (const [tileId, weight] of tileWeights) {
                        cumul += weight;
                        if (v <= cumul) { chosen = tileId; break; }
                    }
                    r.push(chosen);
                }
            }
            this.tilemap.push(r);
        }

        // Insert special landmarks per stage
        this.insertLandmarks(rand);
    },

    getTileWeights(theme) {
        switch (theme) {
            case 0: // Market District
                return [[1, 0.18], [2, 0.18], [3, 0.12], [4, 0.1], [5, 0.08], [6, 0.06], [7, 0.08], [14, 0.06], [18, 0.08], [0, 0.06]];
            case 1: // Cathedral
                return [[1, 0.1], [2, 0.1], [3, 0.08], [8, 0.2], [7, 0.12], [4, 0.08], [14, 0.08], [18, 0.06], [0, 0.08], [5, 0.1]];
            case 2: // Harbor
                return [[1, 0.1], [2, 0.1], [3, 0.08], [7, 0.1], [15, 0.18], [16, 0.08], [9, 0.1], [18, 0.08], [0, 0.08], [6, 0.1]];
            case 3: // Clockwork
                return [[1, 0.1], [2, 0.1], [10, 0.18], [17, 0.15], [7, 0.1], [4, 0.08], [19, 0.1], [18, 0.07], [0, 0.06], [3, 0.06]];
            case 4: // Industrial
                return [[9, 0.25], [18, 0.15], [19, 0.15], [7, 0.1], [1, 0.06], [2, 0.06], [0, 0.08], [17, 0.08], [3, 0.04], [6, 0.03]];
            case 5: // Sky City
                return [[1, 0.15], [2, 0.12], [7, 0.15], [8, 0.08], [14, 0.15], [0, 0.15], [3, 0.08], [4, 0.06], [5, 0.03], [6, 0.03]];
            case 6: // Machine Temple
                return [[17, 0.3], [19, 0.2], [7, 0.12], [10, 0.1], [9, 0.08], [0, 0.1], [18, 0.05], [1, 0.03], [2, 0.02]];
            default:
                return [[1, 0.2], [2, 0.2], [3, 0.15], [0, 0.15], [14, 0.1], [7, 0.1], [18, 0.1]];
        }
    },

    insertLandmarks(rand) {
        const theme = this.stageTheme;
        // place special clusters at intervals
        const interval = Math.floor(MAP_ROWS / 6);
        for (let section = 0; section < 5; section++) {
            const startRow = 10 + section * interval;
            const startCol = 1 + Math.floor(rand() * 4);
            switch (theme) {
                case 1: // cathedrals
                    if (section % 2 === 0) this.placeBlock(startRow, startCol, [[8, 8], [8, 8]]); break;
                case 2: // harbor - water stretches
                    this.placeBlock(startRow, 0, [[15, 15, 16, 15, 15, 15, 15, 15]]); break;
                case 3: // clock towers
                    this.placeBlock(startRow, startCol, [[10, 17], [17, 10]]); break;
                case 4: // factory complexes
                    this.placeBlock(startRow, startCol, [[9, 9, 9], [9, 9, 9]]); break;
                case 5: // parks
                    this.placeBlock(startRow, startCol, [[14, 14], [14, 14]]); break;
                case 6: // gear floors
                    this.placeBlock(startRow, startCol, [[17, 17, 17], [17, 17, 17], [17, 17, 17]]); break;
            }
        }
    },

    placeBlock(row, col, block) {
        for (let r = 0; r < block.length; r++) {
            for (let c = 0; c < block[r].length; c++) {
                const mr = row + r, mc = col + c;
                if (mr >= 0 && mr < MAP_ROWS && mc >= 0 && mc < COLS) {
                    this.tilemap[mr][mc] = block[r][c];
                }
            }
        }
    },

    /* ================ CLOUDS ================= */
    generateClouds() {
        this.clouds = [];
        for (let i = 0; i < 10; i++) {
            this.clouds.push({
                x: Math.random() * 520 - 20,
                y: Math.random() * 800,
                w: 50 + Math.random() * 100,
                h: 15 + Math.random() * 25,
                speed: 0.08 + Math.random() * 0.15,
                alpha: 0.04 + Math.random() * 0.08
            });
        }
    },

    /* ================ UPDATE & DRAW ================= */
    update() {
        this.scrollY += this.scrollSpeed;
    },

    draw(ctx) {
        if (!this.rendered) return;
        const P = this.palettes[this.stageTheme];

        // sky fill
        ctx.fillStyle = P.sky;
        ctx.fillRect(0, 0, 480, 720);

        // ---- draw tilemap (scrolling DOWNWARD) ----
        // scrollY increases => background moves down => player flies "forward"
        const totalH = MAP_ROWS * TILE;
        // We start from the END of the map and scroll toward the beginning
        const offsetY = totalH - this.scrollY - 720;
        const startRow = Math.floor(offsetY / TILE);
        const yOff = -(offsetY % TILE);

        const rowsVisible = Math.ceil(720 / TILE) + 1;
        for (let r = 0; r < rowsVisible; r++) {
            const mapRow = startRow + r;
            if (mapRow < 0 || mapRow >= MAP_ROWS) continue;
            for (let c = 0; c < COLS; c++) {
                const tileId = this.tilemap[mapRow][c];
                const tc = this.tileCanvases[tileId];
                if (tc) {
                    ctx.drawImage(tc, c * TILE, yOff + r * TILE);
                }
            }
        }

        // If scrolled past end, loop
        if (offsetY < -720) {
            this.scrollY = 0;
        }

        // ---- parallax clouds ----
        for (const cl of this.clouds) {
            cl.x += cl.speed;
            if (cl.x > 520) cl.x = -cl.w;
            ctx.globalAlpha = cl.alpha;
            ctx.fillStyle = this.stageTheme === 5 ? '#FFFFFF' : '#99aabb';
            ctx.beginPath();
            ctx.ellipse(cl.x + cl.w / 2, cl.y, cl.w / 2, cl.h / 2, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // ---- stage-specific ambient overlay ----
        if (this.stageTheme === 4) {
            ctx.globalAlpha = 0.04; ctx.fillStyle = '#FF2200'; ctx.fillRect(0, 0, 480, 720); ctx.globalAlpha = 1;
        } else if (this.stageTheme === 5) {
            ctx.globalAlpha = 0.03; ctx.fillStyle = '#AACCFF'; ctx.fillRect(0, 0, 480, 720); ctx.globalAlpha = 1;
        } else if (this.stageTheme === 6) {
            ctx.globalAlpha = 0.04; ctx.fillStyle = '#6622AA'; ctx.fillRect(0, 0, 480, 720); ctx.globalAlpha = 1;
        }
    }
};
