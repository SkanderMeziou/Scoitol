export class Particle {
    constructor(x, y, color, velocity, life, size, decay = true) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.velocity = velocity || { x: 0, y: 0 };
        this.life = life;
        this.maxLife = life;
        this.size = size;
        this.decay = decay;
        this.markedForDeletion = false;
    }

    update(dt) {
        this.x += this.velocity.x * dt;
        this.y += this.velocity.y * dt;
        this.life -= dt;

        if (this.decay) {
            this.size *= 0.95; // Shrink over time
        }

        if (this.life <= 0 || this.size < 0.1) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life / this.maxLife;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

export class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    emit(x, y, color, count = 1, options = {}) {
        const {
            speed = 50,
            life = 1.0,
            size = 5,
            spread = Math.PI * 2
        } = options;

        for (let i = 0; i < count; i++) {
            const angle = (Math.random() - 0.5) * spread; // Spread around center? Or random direction?
            // Actually, let's just do random angle for explosion
            const dir = Math.random() * Math.PI * 2;
            const velX = Math.cos(dir) * (Math.random() * speed);
            const velY = Math.sin(dir) * (Math.random() * speed);

            this.particles.push(new Particle(
                x, y, color,
                { x: velX, y: velY },
                life * (0.5 + Math.random() * 0.5),
                size * (0.5 + Math.random() * 0.5)
            ));
        }
    }

    createTrail(x, y, color, size, life) {
        this.particles.push(new Particle(
            x, y, color,
            { x: 0, y: 0 },
            life,
            size,
            true
        ));
    }

    createExplosion(x, y, color, count = 10, size = 5) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 100;
            const velX = Math.cos(angle) * speed;
            const velY = Math.sin(angle) * speed;
            const life = 0.5 + Math.random() * 0.5;

            this.particles.push(new Particle(
                x, y, color,
                { x: velX, y: velY },
                life,
                size,
                true
            ));
        }
    }

    update(dt) {
        this.particles.forEach(p => p.update(dt));
        this.particles = this.particles.filter(p => !p.markedForDeletion);
    }

    draw(ctx) {
        this.particles.forEach(p => p.draw(ctx));
    }
}
