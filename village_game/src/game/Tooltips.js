export class Tooltips {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        this.canvas = game.canvas;
        this.input = game.input;
    }

    drawTooltips() {
        const mouseX = this.input.mouse.x;
        const mouseY = this.input.mouse.y;

        // Transform mouse to world coordinates
        const scale = this.game.currentZoomScale || 1.0;
        const worldX = (mouseX - (this.canvas.width / 2)) / scale + this.game.centerX;
        const worldY = (mouseY - (this.canvas.height / 2)) / scale + this.game.centerY;

        // Check hover on turrets and enemies
        for (const entity of this.game.entities) {
            const dist = Math.hypot(worldX - entity.x, worldY - entity.y);

            if (entity.constructor.name === 'Turret' && dist < entity.radius + 15) {
                // Draw turret stats in yellow
                const dps = (entity.damage / entity.fireRate).toFixed(1);
                const text = `${entity.turretType.toUpperCase()} | DMG: ${entity.damage} | Rate: ${entity.fireRate.toFixed(2)}s | DPS: ${dps} | Range: ${entity.range}`;

                this.ctx.save();
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
                const textWidth = this.ctx.measureText(text).width + 20;
                this.ctx.fillRect(mouseX + 10, mouseY - 35, textWidth, 28);
                this.ctx.fillStyle = '#f1c40f'; // Yellow
                this.ctx.font = 'bold 14px monospace';
                this.ctx.fillText(text, mouseX + 15, mouseY - 14);
                this.ctx.restore();
                return; // Only show one tooltip
            } else if (entity.type === 'enemy' && dist < entity.radius + 15) {
                // Draw enemy HP in red
                const text = `HP: ${Math.ceil(entity.health)}/${Math.ceil(entity.maxHealth)}`;

                this.ctx.save();
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
                this.ctx.fillRect(mouseX + 10, mouseY - 35, 160, 28);
                this.ctx.fillStyle = '#e74c3c'; // Red
                this.ctx.font = 'bold 14px monospace';
                this.ctx.fillText(text, mouseX + 15, mouseY - 14);
                this.ctx.restore();
                return; // Only show one tooltip
            }
        }
    }
}
