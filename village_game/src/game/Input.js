import { Joystick } from './Joystick.js';
import { isInsideArena } from './Arena.js';

export class Input {
    constructor(canvas) {
        this.canvas = canvas;
        this.keys = new Set();
        this.mouse = { x: 0, y: 0, left: false, right: false, inside: false };
        this.joystick = new Joystick(100, canvas.height - 100, 50);
        this.movePointer = null;
        this.buildPoint = null;
        window.addEventListener('keydown', event => {
            if (event.target.closest('input, textarea, dialog')) return;
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) event.preventDefault();
            this.keys.add(event.code);
        });
        window.addEventListener('keyup', event => this.keys.delete(event.code));
        window.addEventListener('blur', () => this.reset());
        document.addEventListener('visibilitychange', () => { if (document.hidden) this.reset(); });
        canvas.addEventListener('pointermove', event => {
            const point = this.position(event);
            if (event.pointerId === this.movePointer) {
                if (Math.hypot(point.x - this.joystick.baseX, point.y - this.joystick.baseY) > 10) this.touchMoved = true;
                this.joystick.updateStickPosition(point.x, point.y);
            } else this.updateMouse(point);
        });
        canvas.addEventListener('pointerdown', event => {
            const point = this.position(event);
            if (!isInsideArena(point.x, point.y)) return;
            canvas.setPointerCapture(event.pointerId);
            if (event.pointerType === 'touch' && point.x < canvas.width / 2 && this.movePointer === null) {
                this.movePointer = event.pointerId;
                this.touchMoved = false;
                Object.assign(this.joystick, { baseX: point.x, baseY: point.y, stickX: point.x, stickY: point.y, active: true });
            } else {
                this.updateMouse(point);
                if (event.button === 0) this.mouse.left = true;
            }
        });
        const release = event => {
            if (event.type === 'pointerup' && event.pointerType === 'touch' &&
                (event.pointerId !== this.movePointer || !this.touchMoved)) {
                this.buildPoint = this.position(event);
            }
            if (event.pointerId === this.movePointer) {
                this.movePointer = null;
                this.joystick.active = false;
                this.joystick.value = { x: 0, y: 0 };
            } else this.mouse.left = false;
        };
        canvas.addEventListener('pointerup', release);
        canvas.addEventListener('pointercancel', release);
        canvas.addEventListener('lostpointercapture', release);
        canvas.addEventListener('pointerleave', () => { this.mouse.inside = false; });
        canvas.addEventListener('contextmenu', event => event.preventDefault());
    }

    position(event) {
        const rect = this.canvas.getBoundingClientRect();
        return { x: (event.clientX - rect.left) * this.canvas.width / rect.width,
            y: (event.clientY - rect.top) * this.canvas.height / rect.height };
    }

    updateMouse(point) {
        Object.assign(this.mouse, point, { inside: isInsideArena(point.x, point.y) });
    }

    reset() {
        this.keys.clear();
        this.buildPoint = null;
        this.mouse.left = false;
        this.mouse.inside = false;
        this.movePointer = null;
        this.joystick.active = false;
        this.joystick.value = { x: 0, y: 0 };
    }

    isDown(code) { return this.keys.has(code); }

    getMovement() {
        let x = 0, y = 0;
        if (this.isDown('KeyW') || this.isDown('KeyZ') || this.isDown('ArrowUp')) y--;
        if (this.isDown('KeyS') || this.isDown('ArrowDown')) y++;
        if (this.isDown('KeyA') || this.isDown('KeyQ') || this.isDown('ArrowLeft')) x--;
        if (this.isDown('KeyD') || this.isDown('ArrowRight')) x++;
        if (this.joystick.active) ({ x, y } = this.joystick.value);
        for (const gp of navigator.getGamepads?.() || []) {
            if (!gp) continue;
            if (Math.abs(gp.axes[0]) > 0.1) x = gp.axes[0];
            if (Math.abs(gp.axes[1]) > 0.1) y = gp.axes[1];
            if (gp.buttons[12]?.pressed) y--;
            if (gp.buttons[13]?.pressed) y++;
            if (gp.buttons[14]?.pressed) x--;
            if (gp.buttons[15]?.pressed) x++;
            break;
        }
        const length = Math.hypot(x, y);
        return length > 1 ? { x: x / length, y: y / length } : { x, y };
    }
}
