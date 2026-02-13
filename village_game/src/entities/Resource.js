import { Entity } from './Entity.js';
import { Config } from '../game/Config.js';

export class Resource extends Entity {
    constructor(x, y, type) {
        let color = '#2ecc71'; // Tree (Green)
        if (type === 'rock') color = '#95a5a6'; // Grey
        if (type === 'iron') color = '#7f8c8d'; // Dark Grey
        if (type === 'crystal') color = '#9b59b6'; // Purple
        if (type === 'obsidian') color = '#2c3e50'; // Black
        if (type === 'diamond') color = '#3498db'; // Blue
        if (type === 'emerald') color = '#27ae60'; // Dark Green
        if (type === 'ruby') color = '#c0392b'; // Red
        if (type === 'sapphire') color = '#2980b9'; // Dark Blue

        super(x, y, 15, color);
        this.type = type;
        this.maxHealth = 5;
        this.health = this.maxHealth;
        this.flashTime = 0;
        this.baseColor = color;
    }

    takeDamage(amount) {
        this.health -= amount;
        this.flashTime = 0.1;
    }

    update(dt) {
        if (this.health <= 0) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        const healthPct = this.health / this.maxHealth;
        const brightness = 0.4 + (0.6 * healthPct);

        ctx.save();
        
        // Flash white when hit
        if (this.flashTime > 0) {
            ctx.filter = 'brightness(200%)';
            this.flashTime -= 0.016;
        } else {
            ctx.filter = `brightness(${brightness * 100}%)`;
        }

        const scale = this.type === 'tree' ? (Config.TREE_SIZE_MULTIPLIER || 1.0) : (Config.RESOURCE_SIZE_MULTIPLIER || 1.0);
        ctx.translate(this.x, this.y);
        ctx.scale(scale, scale);
        ctx.translate(-this.x, -this.y);

        if (this.type === 'tree') {
            // Trunk
            ctx.fillStyle = '#a07464ff'; // Brown
            ctx.fillRect(this.x - 5, this.y, 10, 15);
            
            // Foliage (3 circles)
            ctx.fillStyle = '#83cf50ff';
            ctx.beginPath();
            ctx.arc(this.x, this.y - 10, 15, 0, Math.PI * 2);
            ctx.arc(this.x - 10, this.y, 12, 0, Math.PI * 2);
            ctx.arc(this.x + 10, this.y, 12, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'rock') {
            ctx.fillStyle = '#95a5a6';
            ctx.beginPath();
            // Irregular shape
            ctx.moveTo(this.x - 10, this.y + 10);
            ctx.lineTo(this.x - 15, this.y - 5);
            ctx.lineTo(this.x - 5, this.y - 15);
            ctx.lineTo(this.x + 10, this.y - 10);
            ctx.lineTo(this.x + 15, this.y + 5);
            ctx.lineTo(this.x + 5, this.y + 15);
            ctx.fill();
            ctx.closePath();
            
            // Highlight
            ctx.fillStyle = '#bdc3c7';
            ctx.beginPath();
            ctx.arc(this.x - 5, this.y - 5, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.closePath();
        } else {
            // Gems / Ores (Diamond shape)
            ctx.fillStyle = this.baseColor;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - 15);
            ctx.lineTo(this.x + 15, this.y);
            ctx.lineTo(this.x, this.y + 15);
            ctx.lineTo(this.x - 15, this.y);
            ctx.fill();
            ctx.closePath();
            
            // Shine
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - 15);
            ctx.lineTo(this.x + 5, this.y - 5);
            ctx.lineTo(this.x, this.y);
            ctx.lineTo(this.x - 5, this.y - 5);
            ctx.fill();
            ctx.closePath();
        }
        
        ctx.restore();
    }
}
