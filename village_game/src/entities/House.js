import { Entity } from './Entity.js';

export class House extends Entity {
    constructor(x, y) {
        super(x, y, 40, '#8b4513'); // Brown house
        this.maxHealth = 2000; // Increased HP
        this.health = this.maxHealth;
    }

    update(dt) {
        if (this.health <= 0) {
            // Game Over logic will be handled by Game class checking this
            console.log("Game Over");
        }
    }

    draw(ctx) {
        ctx.save();
        
        // House base (rectangle)
        ctx.fillStyle = '#8b4513'; // Brown
        ctx.fillRect(this.x - 30, this.y - 10, 60, 40);
        
        // Roof (triangle)
        ctx.fillStyle = '#a0522d'; // Darker brown
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - 35); // Top
        ctx.lineTo(this.x - 40, this.y - 10); // Bottom left
        ctx.lineTo(this.x + 40, this.y - 10); // Bottom right
        ctx.fill();
        ctx.closePath();
        
        // Door
        ctx.fillStyle = '#654321';
        ctx.fillRect(this.x - 10, this.y + 5, 20, 25);
        
        // Windows
        ctx.fillStyle = '#87ceeb'; // Sky blue
        ctx.fillRect(this.x - 25, this.y, 12, 12);
        ctx.fillRect(this.x + 13, this.y, 12, 12);
        
        // Window frames
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x - 25, this.y, 12, 12);
        ctx.strokeRect(this.x + 13, this.y, 12, 12);
        
        ctx.restore();

        // Draw Health Bar
        const width = 80;
        const height = 8;
        const x = this.x - width / 2;
        const y = this.y - this.radius - 20;

        ctx.fillStyle = '#333';
        ctx.fillRect(x, y, width, height);

        const healthPct = Math.max(0, this.health / this.maxHealth);
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(x, y, width * healthPct, height);
    }

    takeDamage(amount) {
        this.health -= amount;
    }
}
