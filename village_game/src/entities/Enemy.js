import { Entity } from './Entity.js';

export class Enemy extends Entity {
    constructor(x, y, type, target, power = 1.0) {
        let color = '#e74c3c'; // Red (Normal)
        let radius = 15;
        let speed = 50;
        let healthMult = 1.0;
        
        // Type configuration
        switch(type) {
            case 'fast': color = '#f1c40f'; speed = 100; radius = 10; healthMult = 0.6; break;
            case 'tank': color = '#2c3e50'; speed = 25; radius = 25; healthMult = 3.0; break;
            case 'disruptor': color = '#e67e22'; break;
            case 'spiral': color = '#9b59b6'; speed = 60; break;
            case 'stopgo': color = '#3498db'; break;
            case 'zigzag': color = '#1abc9c'; speed = 60; break;
            case 'boss': color = '#8e44ad'; speed = 20; radius = 40; healthMult = 10.0; break;
            case 'stealth': color = 'rgba(100, 100, 100, 0.3)'; speed = 40; break;
            case 'regenerator': color = '#2ecc71'; healthMult = 1.5; break;
            case 'splitter': color = '#d35400'; radius = 20; healthMult = 1.2; break;
            case 'shielded': color = '#95a5a6'; healthMult = 2.0; break;
            case 'kamikaze': color = '#c0392b'; speed = 80; healthMult = 0.5; break;
            case 'glass_cannon': color = '#ecf0f1'; speed = 70; healthMult = 0.3; break;
            case 'vampire': color = '#7f8c8d'; break;
            case 'teleporter': color = '#8e44ad'; speed = 0; break; // Teleports instead of moving
            case 'orbital': color = '#2980b9'; speed = 60; break;
            case 'glitch': color = '#ff00ff'; speed = 100; break;
            case 'void': color = '#000000'; speed = 30; healthMult = 4.0; break;
        }

        super(x, y, radius, color);
        this.type = 'enemy';
        this.enemyType = type;
        this.target = target;
        this.baseSpeed = speed;
        this.speed = speed;
        
        // Power-based stats
        this.power = power;
        this.maxHealth = this.calculateHealth(power) * healthMult;
        this.health = this.maxHealth;
        this.damage = this.calculateDamage(power);
        this.attackCooldown = 0;
        
        // Behavior State
        this.stateTimer = 0;
        this.state = 0; // For stopgo, teleport, etc.
        this.initialAngle = Math.atan2(y - target.y, x - target.x);
        this.orbitAngle = this.initialAngle;
        
        // Status Effects
        this.effects = {
            frozen: { duration: 0, amount: 0 },
            burning: { duration: 0, dps: 0 },
            poisoned: { duration: 0, dps: 0 }
        };
    }

    calculateHealth(power) {
        return power * 20;
    }

    calculateDamage(power) {
        return 10 * Math.log2(power + 1);
    }

    applyEffect(type, duration, amount = 0) {
        if (type === 'frozen') {
            this.effects.frozen.duration = duration;
        } else if (type === 'burning') {
            this.effects.burning.duration = duration;
            this.effects.burning.dps = amount;
        } else if (type === 'poisoned') {
            this.effects.poisoned.duration = duration;
            this.effects.poisoned.dps = amount;
        }
    }

    update(dt, entities, game) {
        if (this.health <= 0) {
            this.markedForDeletion = true;
            // Splitter logic
            if (this.enemyType === 'splitter' && this.radius > 10) {
                // Spawn 2 smaller enemies
                for(let i=0; i<2; i++) {
                    const child = new Enemy(this.x + (Math.random()-0.5)*20, this.y + (Math.random()-0.5)*20, 'fast', this.target, this.power * 0.4);
                    child.radius = 10;
                    game.addEntity(child);
                }
            }
            return;
        }

        // Handle Effects
        let currentSpeed = this.speed;
        if (this.effects.frozen.duration > 0) {
            this.effects.frozen.duration -= dt;
            currentSpeed *= 0.5;
        }
        if (this.effects.burning.duration > 0) {
            this.effects.burning.duration -= dt;
            this.takeDamage(this.effects.burning.dps * dt);
        }
        if (this.effects.poisoned.duration > 0) {
            this.effects.poisoned.duration -= dt;
            this.takeDamage(this.effects.poisoned.dps * dt);
        }
        
        // Regenerator logic
        if (this.enemyType === 'regenerator') {
            this.health = Math.min(this.maxHealth, this.health + (this.maxHealth * 0.05 * dt));
        }

        if (this.health <= 0) return;

        let target = this.target;

        // Disruptors target turrets
        if (this.enemyType === 'disruptor') {
            let nearestTurret = null;
            let minDist = Infinity;
            const potentialTargets = (game && game.turrets) ? game.turrets : entities;
            for (const entity of potentialTargets) {
                if (entity.constructor.name === 'Turret') {
                    const dist = Math.hypot(entity.x - this.x, entity.y - this.y);
                    if (dist < minDist) {
                        minDist = dist;
                        nearestTurret = entity;
                    }
                }
            }
            if (nearestTurret) target = nearestTurret;
        }

        if (!target) return;

        // Movement Logic
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.hypot(dx, dy);
        
        let moveX = 0;
        let moveY = 0;

        // Special Movement Patterns
        if (this.enemyType === 'stopgo') {
            this.stateTimer += dt;
            if (this.state === 0) { // Stop
                currentSpeed = 0;
                if (this.stateTimer > 1.5) {
                    this.state = 1;
                    this.stateTimer = 0;
                }
            } else { // Go Fast
                currentSpeed = this.baseSpeed * 4;
                if (this.stateTimer > 0.5) {
                    this.state = 0;
                    this.stateTimer = 0;
                }
            }
        } else if (this.enemyType === 'teleporter') {
            this.stateTimer += dt;
            if (this.stateTimer > 2.0) {
                // Teleport closer
                const angle = Math.atan2(dy, dx);
                this.x += Math.cos(angle) * 100;
                this.y += Math.sin(angle) * 100;
                this.stateTimer = 0;
                // Flash effect
                if (game && game.particleSystem) game.particleSystem.emit(this.x, this.y, this.color, 10, {speed: 100, life: 0.5});
            }
            currentSpeed = 0; // Don't move normally
        } else if (this.enemyType === 'spiral') {
            // Spiral approach
            const angle = Math.atan2(dy, dx);
            const spiralAngle = angle + Math.PI / 4; // 45 degrees offset
            moveX = Math.cos(spiralAngle);
            moveY = Math.sin(spiralAngle);
        } else if (this.enemyType === 'zigzag') {
            this.stateTimer += dt;
            const angle = Math.atan2(dy, dx);
            const offset = Math.sin(this.stateTimer * 5) * (Math.PI / 2);
            moveX = Math.cos(angle + offset);
            moveY = Math.sin(angle + offset);
        } else if (this.enemyType === 'orbital') {
            this.orbitAngle += dt * 0.5;
            const orbitDist = Math.max(200, dist - 50 * dt); // Slowly close in
            const targetX = target.x + Math.cos(this.orbitAngle) * orbitDist;
            const targetY = target.y + Math.sin(this.orbitAngle) * orbitDist;
            const odx = targetX - this.x;
            const ody = targetY - this.y;
            const odist = Math.hypot(odx, ody);
            if (odist > 0) {
                moveX = odx / odist;
                moveY = ody / odist;
            }
        } else if (this.enemyType === 'glitch') {
             if (Math.random() > 0.9) {
                 this.x += (Math.random() - 0.5) * 50;
                 this.y += (Math.random() - 0.5) * 50;
             }
        }

        // Default direct movement if no special move vector set
        if (moveX === 0 && moveY === 0 && this.enemyType !== 'teleporter') {
            if (dist > 0) {
                moveX = dx / dist;
                moveY = dy / dist;
            }
        }
        
        // Apply movement
        if (dist > target.radius + this.radius) {
            this.x += moveX * currentSpeed * dt;
            this.y += moveY * currentSpeed * dt;
        } else {
            // Attack
            if (this.attackCooldown <= 0) {
                this.attack(target);
                this.attackCooldown = 1.0;
            }
        }

        if (this.attackCooldown > 0) this.attackCooldown -= dt;
    }

    attack(target) {
        if (this.enemyType === 'disruptor' && target.constructor.name === 'Turret') {
            target.paralyzedTime = 5.0;
            this.markedForDeletion = true;
        } else if (this.enemyType === 'kamikaze') {
            // AoE damage
            if (target.takeDamage) target.takeDamage(this.damage * 3);
            this.markedForDeletion = true;
        } else if (this.enemyType === 'vampire') {
            if (target.takeDamage) {
                target.takeDamage(this.damage);
                this.health = Math.min(this.maxHealth, this.health + this.damage);
            }
        } else {
            if (target.takeDamage) target.takeDamage(this.damage);
        }
    }

    takeDamage(amount, source = null) {
        if (this.enemyType === 'shielded' && Math.random() > 0.5) {
            amount *= 0.1; // 50% chance to block 90% damage
        }
        this.health -= amount;
        this.flashTime = 0.1;
        if (source) {
            this.lastHitSource = source;
        }
    }

    getTier() {
        if (this.power < 4) return 0;
        return Math.min(9, Math.floor(Math.log(this.power) / Math.log(4)));
    }

    draw(ctx) {
        ctx.save();
        
        // Translate to position
        ctx.translate(this.x, this.y);
        
        // Rotate to face target/movement
        if (this.target) {
            const angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
            ctx.rotate(angle + Math.PI / 2); // Face "up" relative to draw orientation
        }

        // Scale based on Tier (Power)
        const tier = this.getTier();
        const scale = 1 + (tier * 0.15); // Slightly reduced scaling to avoid them getting too huge
        ctx.scale(scale, scale);

        if (this.flashTime > 0) {
            ctx.filter = 'brightness(200%)';
            this.flashTime -= 0.016;
        }

        // Effect Visuals
        if (this.effects.frozen.duration > 0) {
            ctx.fillStyle = 'rgba(52, 152, 219, 0.5)';
            ctx.beginPath(); ctx.arc(0, 0, this.radius + 5, 0, Math.PI * 2); ctx.fill();
        }
        
        // Glitch effect
        if (this.enemyType === 'glitch') {
            ctx.translate((Math.random()-0.5)*5, (Math.random()-0.5)*5);
        }

        // Tier Visuals (Aura for high tiers)
        if (tier >= 4) {
            ctx.shadowBlur = 10 + (tier - 3) * 5;
            ctx.shadowColor = this.color;
        }

        ctx.fillStyle = this.color;
        
        // --- Dynamic Shape Generation based on Tier ---
        // Tier 0 = Triangle (3 sides)
        // Tier 1 = Square (4 sides)
        // Tier 2 = Pentagon (5 sides)
        // ...
        // Tier 5+ = Spiky
        
        ctx.beginPath();
        
        // Special shapes for specific types override the tier shape
        if (this.enemyType === 'spiral' || this.enemyType === 'orbital') {
             // Shuriken / Star shape
            const spikes = 4;
            const outerRadius = this.radius;
            const innerRadius = this.radius / 2;
            for (let i = 0; i < spikes * 2; i++) {
                const r = (i % 2 === 0) ? outerRadius : innerRadius;
                const a = (Math.PI * i) / spikes;
                ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
            }
        } else if (this.enemyType === 'stealth') {
             ctx.setLineDash([5, 5]);
             ctx.strokeStyle = 'white';
             ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
             ctx.stroke();
        } else {
            // Default Evolution Logic
            const sides = 3 + Math.min(tier, 5); // Cap at 8 sides (octagon)
            
            if (tier >= 5 || this.enemyType === 'boss') {
                // Spiky Shape for high tiers
                const spikes = sides + 2;
                const outerRadius = this.radius;
                const innerRadius = this.radius * 0.7;
                for (let i = 0; i < spikes * 2; i++) {
                    const r = (i % 2 === 0) ? outerRadius : innerRadius;
                    const a = (Math.PI * i) / spikes;
                    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
                }
            } else {
                // Regular Polygon
                for (let i = 0; i < sides; i++) {
                    const angle = (i * 2 * Math.PI) / sides - (Math.PI / 2); // Start at top
                    ctx.lineTo(Math.cos(angle) * this.radius, Math.sin(angle) * this.radius);
                }
            }
        }
        ctx.closePath();
        ctx.fill();
        
        // Eyes (Points)
        ctx.fillStyle = 'white';
        // Adjust eye position based on shape? 
        // Standard eyes at top-ish
        const eyeY = -this.radius * 0.3;
        const eyeX = this.radius * 0.3;
        
        // Left Eye
        ctx.beginPath(); ctx.arc(-eyeX, eyeY, this.radius * 0.2, 0, Math.PI * 2); ctx.fill();
        // Right Eye
        ctx.beginPath(); ctx.arc(eyeX, eyeY, this.radius * 0.2, 0, Math.PI * 2); ctx.fill();
        
        // Pupils
        // Red pupils for high tier
        ctx.fillStyle = tier >= 3 ? '#e74c3c' : 'black';
        if (tier >= 6) ctx.fillStyle = '#ff0000'; // Glowing red for very high tier
        
        ctx.beginPath(); ctx.arc(-eyeX, eyeY, this.radius * 0.1, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(eyeX, eyeY, this.radius * 0.1, 0, Math.PI * 2); ctx.fill();
        
        // Angry Eyebrows for high tier
        if (tier >= 2) {
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.beginPath();
            // Left eyebrow
            ctx.moveTo(-eyeX - 5, eyeY - 5);
            ctx.lineTo(-eyeX + 2, eyeY - 2);
            // Right eyebrow
            ctx.moveTo(eyeX + 5, eyeY - 5);
            ctx.lineTo(eyeX - 2, eyeY - 2);
            ctx.stroke();
        }
        
        ctx.restore();
    }
}
