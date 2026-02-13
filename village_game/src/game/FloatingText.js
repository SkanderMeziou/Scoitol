export class FloatingText {
    constructor(text, x, y, color = '#2ecc71') {
        this.text = text;
        this.x = x;
        this.y = y;
        this.startX = x;
        this.startY = y;
        this.color = color;
        this.lifetime = 1.5; // 1.5 seconds
        this.maxLifetime = 1.5;
        this.velocity = { x: 50, y: -30 }; // Move right and up
    }

    update(dt) {
        this.lifetime -= dt;
        this.x += this.velocity.x * dt;
        this.y += this.velocity.y * dt;
        
        return this.lifetime > 0; // Return false when dead
    }

    draw(ctx) {
        const alpha = this.lifetime / this.maxLifetime; // Fade out
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}

export class FloatingTextManager {
    constructor() {
        this.texts = [];
    }

    add(text, x, y, isGain = true) {
        const color = isGain ? '#2ecc71' : '#e74c3c'; // Green for gain, red for loss
        const prefix = isGain ? '+' : '-';
        const displayText = `${prefix}${Math.abs(text)}`;
        
        this.texts.push(new FloatingText(displayText, x, y, color));
    }

    update(dt) {
        this.texts = this.texts.filter(text => text.update(dt));
    }

    draw(ctx) {
        this.texts.forEach(text => text.draw(ctx));
    }

    clear() {
        this.texts = [];
    }
}
