/* ============================================
   Input Handler - Keyboard + Touch Support
   ============================================ */
const Input = {
    keys: {},
    pressed: {},
    touchActive: false,
    touchUI: null,

    // Virtual joystick state
    vjoy: { active: false, startX: 0, startY: 0, dx: 0, dy: 0, id: null },
    // Action buttons
    touchButtons: { fire: false, bomb: false, slow: false, bombPressed: false, firePressed: false },

    init() {
        // Keyboard
        window.addEventListener('keydown', e => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyZ', 'KeyX', 'KeyA', 'KeyS', 'KeyD', 'KeyW', 'ShiftLeft', 'ShiftRight', 'Enter', 'Escape'].includes(e.code)) {
                e.preventDefault();
            }
            if (!this.keys[e.code]) {
                this.pressed[e.code] = true;
            }
            this.keys[e.code] = true;
            // Hide touch UI when keyboard used
            if (this.touchUI) this.touchUI.style.display = 'none';
        });
        window.addEventListener('keyup', e => {
            this.keys[e.code] = false;
        });

        // Touch - detect and initialize
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
            this.initTouch();
        }
    },

    initTouch() {
        this.touchActive = true;
        this.createTouchUI();

        const canvas = document.getElementById('gameCanvas');
        const container = document.getElementById('game-container');

        // Prevent default touch behaviors
        container.addEventListener('touchstart', e => e.preventDefault(), { passive: false });
        container.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
        container.addEventListener('touchend', e => e.preventDefault(), { passive: false });

        // Touch events on the whole document for virtual joystick
        document.addEventListener('touchstart', e => {
            if (this.touchUI) this.touchUI.style.display = '';
            for (const touch of e.changedTouches) {
                const x = touch.clientX;
                const y = touch.clientY;
                const w = window.innerWidth;

                // Left half = joystick
                if (x < w * 0.45 && !this.vjoy.active) {
                    this.vjoy.active = true;
                    this.vjoy.id = touch.identifier;
                    this.vjoy.startX = x;
                    this.vjoy.startY = y;
                    this.vjoy.dx = 0;
                    this.vjoy.dy = 0;
                    this.updateJoystickVisual();
                }
            }
        }, { passive: false });

        document.addEventListener('touchmove', e => {
            for (const touch of e.changedTouches) {
                if (touch.identifier === this.vjoy.id && this.vjoy.active) {
                    this.vjoy.dx = touch.clientX - this.vjoy.startX;
                    this.vjoy.dy = touch.clientY - this.vjoy.startY;
                    this.updateJoystickVisual();
                }
            }
        }, { passive: false });

        document.addEventListener('touchend', e => {
            for (const touch of e.changedTouches) {
                if (touch.identifier === this.vjoy.id) {
                    this.vjoy.active = false;
                    this.vjoy.dx = 0;
                    this.vjoy.dy = 0;
                    this.vjoy.id = null;
                    this.updateJoystickVisual();
                }
            }
        }, { passive: false });
    },

    createTouchUI() {
        // Create overlay for touch controls
        const ui = document.createElement('div');
        ui.id = 'touch-controls';
        ui.innerHTML = `
            <div id="touch-joystick-area">
                <div id="touch-joystick-base">
                    <div id="touch-joystick-knob"></div>
                </div>
            </div>
            <div id="touch-buttons">
                <button id="btn-fire" class="touch-btn fire-btn">FIRE<br><span class="key-hint">Z</span></button>
                <button id="btn-bomb" class="touch-btn bomb-btn">BOMB<br><span class="key-hint">X</span></button>
                <button id="btn-slow" class="touch-btn slow-btn">SLOW<br><span class="key-hint">Shift</span></button>
            </div>
        `;
        document.body.appendChild(ui);
        this.touchUI = ui;

        // Style
        const style = document.createElement('style');
        style.textContent = `
            #touch-controls {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                pointer-events: none; z-index: 1000;
                display: none;
            }
            @media (pointer: coarse), (max-width: 768px) {
                #touch-controls { display: block !important; }
            }
            #touch-joystick-area {
                position: absolute; bottom: 20px; left: 20px;
                width: 140px; height: 140px; pointer-events: auto;
            }
            #touch-joystick-base {
                width: 120px; height: 120px;
                border-radius: 50%;
                background: rgba(139,105,20,0.2);
                border: 2px solid rgba(139,105,20,0.4);
                position: relative;
                display: flex; align-items: center; justify-content: center;
            }
            #touch-joystick-knob {
                width: 44px; height: 44px;
                border-radius: 50%;
                background: radial-gradient(circle, rgba(221,184,102,0.7), rgba(139,105,20,0.5));
                border: 2px solid rgba(221,184,102,0.6);
                position: absolute;
                transition: transform 0.05s;
            }
            #touch-buttons {
                position: absolute; bottom: 20px; right: 12px;
                display: flex; flex-direction: column; gap: 8px;
                pointer-events: auto;
            }
            .touch-btn {
                width: 72px; height: 72px;
                border-radius: 50%;
                border: 2px solid rgba(221,184,102,0.5);
                color: #DDB866;
                font-family: 'Cinzel', serif;
                font-size: 11px; font-weight: bold;
                text-align: center; line-height: 1.1;
                cursor: pointer;
                -webkit-tap-highlight-color: transparent;
                user-select: none;
                display: flex; align-items: center; justify-content: center;
                flex-direction: column;
            }
            .touch-btn .key-hint {
                font-size: 8px; opacity: 0.5; font-family: sans-serif;
            }
            .fire-btn {
                background: radial-gradient(circle, rgba(100,180,220,0.4), rgba(50,100,150,0.3));
                width: 84px; height: 84px;
            }
            .fire-btn:active, .fire-btn.active {
                background: radial-gradient(circle, rgba(100,180,220,0.7), rgba(50,100,150,0.5));
                box-shadow: 0 0 15px rgba(100,180,220,0.5);
            }
            .bomb-btn {
                background: radial-gradient(circle, rgba(220,100,50,0.3), rgba(150,50,20,0.2));
                width: 60px; height: 60px; font-size: 10px;
                align-self: flex-end;
            }
            .bomb-btn:active, .bomb-btn.active {
                background: radial-gradient(circle, rgba(220,100,50,0.6), rgba(150,50,20,0.4));
                box-shadow: 0 0 15px rgba(220,100,50,0.5);
            }
            .slow-btn {
                background: radial-gradient(circle, rgba(100,220,100,0.3), rgba(50,150,50,0.2));
                width: 56px; height: 56px; font-size: 9px;
                align-self: flex-end;
            }
            .slow-btn:active, .slow-btn.active {
                background: radial-gradient(circle, rgba(100,220,100,0.6), rgba(50,150,50,0.4));
                box-shadow: 0 0 15px rgba(100,220,100,0.5);
            }
        `;
        document.head.appendChild(style);

        // Button events
        const fireBtn = document.getElementById('btn-fire');
        const bombBtn = document.getElementById('btn-bomb');
        const slowBtn = document.getElementById('btn-slow');

        // Fire button (continuous while held)
        fireBtn.addEventListener('touchstart', e => {
            e.preventDefault(); e.stopPropagation();
            this.touchButtons.fire = true;
            this.touchButtons.firePressed = true;
            fireBtn.classList.add('active');
        });
        fireBtn.addEventListener('touchend', e => {
            e.preventDefault(); e.stopPropagation();
            this.touchButtons.fire = false;
            fireBtn.classList.remove('active');
        });
        fireBtn.addEventListener('touchcancel', e => {
            this.touchButtons.fire = false;
            fireBtn.classList.remove('active');
        });

        // Bomb button (single press)
        bombBtn.addEventListener('touchstart', e => {
            e.preventDefault(); e.stopPropagation();
            this.touchButtons.bombPressed = true;
            bombBtn.classList.add('active');
        });
        bombBtn.addEventListener('touchend', e => {
            e.preventDefault(); e.stopPropagation();
            bombBtn.classList.remove('active');
        });
        bombBtn.addEventListener('touchcancel', e => {
            bombBtn.classList.remove('active');
        });

        // Slow button (toggle while held)
        slowBtn.addEventListener('touchstart', e => {
            e.preventDefault(); e.stopPropagation();
            this.touchButtons.slow = true;
            slowBtn.classList.add('active');
        });
        slowBtn.addEventListener('touchend', e => {
            e.preventDefault(); e.stopPropagation();
            this.touchButtons.slow = false;
            slowBtn.classList.remove('active');
        });
        slowBtn.addEventListener('touchcancel', e => {
            this.touchButtons.slow = false;
            slowBtn.classList.remove('active');
        });
    },

    updateJoystickVisual() {
        const knob = document.getElementById('touch-joystick-knob');
        if (!knob) return;
        if (this.vjoy.active) {
            const limit = 35;
            const len = Math.sqrt(this.vjoy.dx * this.vjoy.dx + this.vjoy.dy * this.vjoy.dy);
            const scale = len > limit ? limit / len : 1;
            const tx = this.vjoy.dx * scale;
            const ty = this.vjoy.dy * scale;
            knob.style.transform = `translate(${tx}px, ${ty}px)`;
        } else {
            knob.style.transform = 'translate(0, 0)';
        }
    },

    isDown(code) {
        // Keyboard
        if (this.keys[code]) return true;
        // Touch mappings
        if (!this.touchActive) return false;
        const deadzone = 20;
        switch (code) {
            case 'ArrowLeft': case 'KeyA': return this.vjoy.active && this.vjoy.dx < -deadzone;
            case 'ArrowRight': case 'KeyD': return this.vjoy.active && this.vjoy.dx > deadzone;
            case 'ArrowUp': case 'KeyW': return this.vjoy.active && this.vjoy.dy < -deadzone;
            case 'ArrowDown': case 'KeyS': return this.vjoy.active && this.vjoy.dy > deadzone;
            case 'KeyZ': return this.touchButtons.fire;
            case 'ShiftLeft': case 'ShiftRight': return this.touchButtons.slow;
        }
        return false;
    },

    // Returns -1 to +1 for analog touch joystick axis
    // axis: 'x' or 'y'
    touchAxis(axis) {
        if (!this.touchActive || !this.vjoy.active) return 0;
        const raw = axis === 'x' ? this.vjoy.dx : this.vjoy.dy;
        const deadzone = 20;
        const maxRange = 50;
        if (Math.abs(raw) < deadzone) return 0;
        const sign = raw > 0 ? 1 : -1;
        const magnitude = Math.min(Math.abs(raw) - deadzone, maxRange - deadzone) / (maxRange - deadzone);
        return sign * magnitude;
    },

    wasPressed(code) {
        if (this.pressed[code]) {
            this.pressed[code] = false;
            return true;
        }
        // Touch mappings for single-press actions
        if (this.touchActive) {
            switch (code) {
                case 'KeyX':
                    if (this.touchButtons.bombPressed) {
                        this.touchButtons.bombPressed = false;
                        return true;
                    }
                    break;
                case 'Enter': case 'KeyZ':
                    if (this.touchButtons.firePressed) {
                        this.touchButtons.firePressed = false;
                        return true;
                    }
                    break;
            }
        }
        return false;
    },

    clearPressed() {
        this.pressed = {};
        this.touchButtons.bombPressed = false;
        this.touchButtons.firePressed = false;
    },

    isSlow() {
        return this.isDown('ShiftLeft') || this.isDown('ShiftRight');
    }
};
