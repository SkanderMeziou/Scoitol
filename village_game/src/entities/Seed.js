import { Entity } from './Entity.js';
import { Resource } from './Resource.js';

export class Seed extends Entity {
    constructor(x, y, type) {
        // Seeds are small clusters
        super(x, y, 15, '#95a5a6'); // Grey by default

        this.seedType = type; // 'iron', 'crystal', etc.
        this.timer = 60.0; // 1 minute (was 3)
        this.maxTimer = 60.0;

        // Set color based on type
        if (type === 'iron') this.color = '#7f8c8d';
        if (type === 'crystal') this.color = '#9b59b6';
        if (type === 'obsidian') this.color = '#2c3e50';
        if (type === 'diamond') this.color = '#3498db';
        if (type === 'emerald') this.color = '#27ae60';
        if (type === 'ruby') this.color = '#c0392b';
        if (type === 'sapphire') this.color = '#2980b9';

        // Spawn animation disabled for performance
        this.spawnScale = 1;
        this.targetScale = 1;
    }

    update(dt, entities, game) {
        this.timer -= dt;

        if (this.timer <= 0) {
            // Particle Effect: Explosion/Reassemble
            if (game && game.particleSystem) {
                game.particleSystem.emit(this.x, this.y, this.color, 20, { speed: 100, life: 1.0, size: 6 });
                // Add some white sparkles
                game.particleSystem.emit(this.x, this.y, '#ffffff', 10, { speed: 150, life: 0.5, size: 3 });
            }

            // Spawn 5 resources
            for (let i = 0; i < 5; i++) {
                const angle = (Math.PI * 2 / 5) * i;
                const dist = 30 + Math.random() * 20;
                const x = this.x + Math.cos(angle) * dist;
                const y = this.y + Math.sin(angle) * dist;
                entities.push(new Resource(x, y, this.seedType));
            }

            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        // Draw cluster of small dots (reduced from 7 to 5 for performance)
        const dotCount = 5;
        const clusterRadius = 10;

        for (let i = 0; i < dotCount; i++) {
            const angle = (Math.PI * 2 / dotCount) * i;
            const dist = i === 0 ? 0 : clusterRadius;
            const x = this.x + Math.cos(angle) * dist;
            const y = this.y + Math.sin(angle) * dist;
            const dotRadius = i === 0 ? 4 : 3;

            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw timer indicator (progress circle)
        const progress = this.timer / this.maxTimer;
        ctx.strokeStyle = '#2ecc71';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 2, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * (1 - progress)), false);
        ctx.stroke();
    }
}
