import { Entity } from './Entity.js';

export class Projectile extends Entity {
    constructor(x, y, target, damage, type, options = {}) {
        super(x, y, 4, options.color || '#fff');
        this.target = target;
        this.damage = damage;
        this.type = type; // 'missile', 'bullet', etc.
        this.speed = options.speed || 800; // Faster default speed
        this.aoeRange = options.aoeRange || 0;
        this.effect = options.effect || null; // 'fire', 'ice', 'poison'
        this.effect = options.effect || null; // 'fire', 'ice', 'poison'
        this.source = options.source || null; // Who fired this?
        this.piercing = options.piercing || false;
        this.hitList = [];
        
        this.markedForDeletion = false;
        
        // Calculate initial velocity for line drawing
        if (this.target) {
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const dist = Math.hypot(dx, dy);
            this.vx = (dx / dist) * this.speed;
            this.vy = (dy / dist) * this.speed;
        } else if (options.angle !== undefined) {
            this.vx = Math.cos(options.angle) * this.speed;
            this.vy = Math.sin(options.angle) * this.speed;
        } else {
            this.vx = 0;
            this.vy = 0;
        }
    }

    update(dt, entities) {
        // Homing Logic if target exists
        if (this.target) {
            if (this.target.health <= 0) {
                this.target = null; // Stop tracking
            } else {
                const dx = this.target.x - this.x;
                const dy = this.target.y - this.y;
                const dist = Math.hypot(dx, dy);
                
                // Update velocity to home in
                this.vx = (dx / dist) * this.speed;
                this.vy = (dy / dist) * this.speed;

                if (dist < 20) {
                    this.hit(entities);
                    if (!this.piercing) this.markedForDeletion = true;
                    return;
                }
            }
        }

        // Apply Velocity
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Collision Check for non-homing or piercing
        if (!this.target || this.piercing) {
            for (const entity of entities) {
                if (entity.type === 'enemy' && !this.hitList.includes(entity.id)) {
                    const dist = Math.hypot(entity.x - this.x, entity.y - this.y);
                    if (dist < (entity.radius + 10)) {
                        // Hit
                        if (this.piercing) {
                            entity.takeDamage(this.damage, this.source);
                            if (this.effect) entity.applyEffect(this.effect);
                            this.hitList.push(entity.id);
                        } else {
                            // Standard hit (e.g. shotgun)
                            entity.takeDamage(this.damage, this.source);
                            if (this.effect) entity.applyEffect(this.effect);
                            this.markedForDeletion = true;
                            return;
                        }
                    }
                }
            }
            
            // Bounds check
            if (Math.abs(this.x) > 5000 || Math.abs(this.y) > 5000) this.markedForDeletion = true;
        }
    }

    hit(entities) {
        if (this.type === 'missile') {
            // AOE Explosion
            entities.forEach(e => {
                if (e.type === 'enemy') {
                    const dist = Math.hypot(e.x - this.x, e.y - this.y);
                    if (dist < this.aoeRange) {
                        const wasAlive = e.health > 0;
                        e.takeDamage(this.damage, this.source);
                        if (wasAlive && e.health <= 0 && this.source) {
                            this.source.killCount++;
                        }
                    }
                }
            });
            // Visual explosion could be triggered here (e.g. spawn particles)
        } else {
            // Single target hit
            const wasAlive = this.target.health > 0;
            
            // For piercing, target might be null or we hit something else
            // If we have a target and we hit it:
            if (this.target && this.target.takeDamage) {
                 this.target.takeDamage(this.damage, this.source);
                 if (this.effect) this.target.applyEffect(this.effect);
                 if (wasAlive && this.target.health <= 0 && this.source) this.source.killCount++;
                 if (!this.piercing) this.markedForDeletion = true;
            } else {
                // Collision with non-target entities (for piercing)
                // This requires collision check in update(), not just here.
                // But wait, hit() is called when dist < 20.
                // For piercing, we need to check ALL entities in path?
                // The current update() only checks distance to THIS.target.
                // If piercing, we might not have a single target, or we want to hit things on the way.
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        if (this.type === 'missile') {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Trail for missile
            ctx.beginPath();
            ctx.moveTo(0, 0);
            // Draw trail backwards
            const trailLen = 20;
            const angle = Math.atan2(this.vy, this.vx);
            ctx.lineTo(-Math.cos(angle) * trailLen, -Math.sin(angle) * trailLen);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.stroke();
        } else {
            // Short fast line for normal projectiles
            const angle = Math.atan2(this.vy, this.vx);
            ctx.rotate(angle);
            
            ctx.fillStyle = this.color;
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            
            ctx.beginPath();
            ctx.moveTo(-10, 0); // Tail
            ctx.lineTo(10, 0);  // Head
            ctx.stroke();
            
            // Glow
            ctx.shadowBlur = 5;
            ctx.shadowColor = this.color;
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
        
        ctx.restore();
    }
}
