import { Joystick } from './Joystick.js';

export class Input {
    constructor() {
        this.keys = new Set();
        this.mouse = { x: 0, y: 0, left: false, right: false };
        this.wheelDelta = 0;

        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('mousedown', (e) => this.onMouseDown(e));
        window.addEventListener('mouseup', (e) => this.onMouseUp(e));
        window.addEventListener('contextmenu', (e) => e.preventDefault());
        window.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });

        // Virtual Joystick
        this.joystick = new Joystick(100, window.innerHeight - 100, 50);
        // Resize listener to update joystick position? 
        // We'll handle resize in Game.js/resize likely, or just fixed position for now based on initial window
    }

    onKeyDown(e) {
        this.keys.add(e.code);
    }

    onKeyUp(e) {
        this.keys.delete(e.code);
    }

    onMouseMove(e) {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
    }

    onMouseDown(e) {
        if (e.button === 0) this.mouse.left = true;
        if (e.button === 2) this.mouse.right = true;
    }

    onMouseUp(e) {
        if (e.button === 0) this.mouse.left = false;
        if (e.button === 2) this.mouse.right = false;
    }

    onWheel(e) {
        this.wheelDelta = e.deltaY;
    }

    consumeWheel() {
        const delta = this.wheelDelta;
        this.wheelDelta = 0;
        return delta;
    }

    isDown(code) {
        return this.keys.has(code);
    }

    getMovement() {
        let x = 0;
        let y = 0;

        // Up
        if (this.isDown('KeyW') || this.isDown('KeyZ') || this.isDown('ArrowUp')) y -= 1;
        // Down
        if (this.isDown('KeyS') || this.isDown('ArrowDown')) y += 1;
        // Left
        if (this.isDown('KeyA') || this.isDown('KeyQ') || this.isDown('ArrowLeft')) x -= 1;
        // Right
        // Right
        if (this.isDown('KeyD') || this.isDown('ArrowRight')) x += 1;

        // Joystick
        if (this.joystick.active) {
            x = this.joystick.value.x;
            y = this.joystick.value.y;
        }

        // Gamepad
        const gamepads = navigator.getGamepads();
        if (gamepads) {
            for (const gp of gamepads) {
                if (gp) {
                    // Axis 0: Left Stick X
                    // Axis 1: Left Stick Y
                    if (Math.abs(gp.axes[0]) > 0.1) x = gp.axes[0];
                    if (Math.abs(gp.axes[1]) > 0.1) y = gp.axes[1];
                    // D-Pad usually mapped to axes or buttons depending on browser/pad
                    // Button 12, 13, 14, 15 are Up, Down, Left, Right usually
                    if (gp.buttons[12].pressed) y -= 1;
                    if (gp.buttons[13].pressed) y += 1;
                    if (gp.buttons[14].pressed) x -= 1;
                    if (gp.buttons[15].pressed) x += 1;
                    break; // Use first gamepad
                }
            }
        }

        const len = Math.hypot(x, y);
        if (len > 1.0) {
            x /= len;
            y /= len;
        }

        return { x, y };
    }
}
