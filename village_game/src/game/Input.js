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
        if (this.isDown('KeyD') || this.isDown('ArrowRight')) x += 1;

        return { x, y };
    }
}
