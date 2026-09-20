export class Joystick {
    constructor(x, y, radius) {
        this.baseX = x;
        this.baseY = y;
        this.radius = radius;
        this.stickX = x;
        this.stickY = y;
        this.stickRadius = radius / 2;
        this.active = false;
        this.touchId = null;
        this.value = { x: 0, y: 0 };

    }

    updateStickPosition(x, y) {
        const dx = x - this.baseX;
        const dy = y - this.baseY;
        const dist = Math.hypot(dx, dy);

        if (dist > this.radius) {
            const angle = Math.atan2(dy, dx);
            this.stickX = this.baseX + Math.cos(angle) * this.radius;
            this.stickY = this.baseY + Math.sin(angle) * this.radius;
            this.value.x = Math.cos(angle);
            this.value.y = Math.sin(angle);
        } else {
            this.stickX = x;
            this.stickY = y;
            if (this.radius > 0) {
                this.value.x = dx / this.radius;
                this.value.y = dy / this.radius;
            } else {
                this.value.x = 0;
                this.value.y = 0;
            }
        }
    }

    draw(ctx) {
        if (!this.active) return; // Only show when active? Or always show faintly

        ctx.save();

        // Base
        ctx.beginPath();
        ctx.arc(this.baseX, this.baseY, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();

        // Stick
        ctx.beginPath();
        ctx.arc(this.stickX, this.stickY, this.stickRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fill();

        ctx.restore();
    }
}
