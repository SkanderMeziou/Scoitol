import { Entity } from './Entity.js';
import { Projectile } from './Projectile.js';
import { Recipes } from '../game/Recipes.js';
import { Config } from '../game/Config.js';

export class Turret extends Entity {
    constructor(x, y, type) {
        let color = '#9b59b6'; // Default Purple
        let range = 200;
        let fireRate = 1.0;
        let damage = 10;
        let specialEffect = null;

        // Get recipe and craft difficulty
        const recipeName = `turret_${type}`;
        const recipe = Recipes[recipeName];

        // Calculate DPS based on craft difficulty
        const basicDifficulty = Recipes.turret_basic?.craftDifficulty || 28.4;
        const craftDifficulty = recipe?.craftDifficulty || basicDifficulty;
        const targetDPS = (craftDifficulty / basicDifficulty) * 10;

        // --- Configuration per Type ---
        switch (type) {
            case 'wood': color = '#a07f70'; fireRate = 0.3; break;
            case 'stone': color = '#95a5a6'; fireRate = 2.0; break;
            case 'aoe': color = '#e74c3c'; range = 150; fireRate = 2.0; damage = targetDPS * fireRate * 0.8; break;
            case 'iron': color = '#7f8c8d'; fireRate = 0.5; break;
            case 'gold': color = '#ffd700'; fireRate = 0.8; break;
            case 'crystal': color = '#9b59b6'; fireRate = 0.75; break;
            case 'obsidian': color = '#2c3e50'; fireRate = 1.0; break;
            case 'diamond': color = '#3498db'; range = 300; fireRate = 0.8; break;
            case 'emerald': color = '#27ae60'; fireRate = 1.0; specialEffect = 'poison'; break;
            case 'ruby': color = '#c0392b'; fireRate = 0.75; specialEffect = 'fire'; break;
            case 'sapphire': color = '#2980b9'; fireRate = 1.2; specialEffect = 'ice'; break;

            // Advanced
            case 'sniper': color = '#2c3e50'; range = 600; fireRate = 3.0; break;
            case 'gatling': color = '#7f8c8d'; range = 150; fireRate = 0.1; break;
            case 'shotgun': color = '#95a5a6'; range = 150; fireRate = 1.5; break;
            case 'flamethrower': color = '#e74c3c'; range = 100; fireRate = 0.05; specialEffect = 'fire'; break;
            case 'tesla': color = '#3498db'; range = 200; fireRate = 0.5; break;
            case 'laser': color = '#e74c3c'; range = 400; fireRate = 2.0; break; // Instant hit beam
            case 'mortar': color = '#2c3e50'; range = 400; fireRate = 3.0; break; // AoE projectile
            case 'missile': color = '#444'; range = 500; fireRate = 2.5; break;
            case 'railgun': color = '#8e44ad'; range = 800; fireRate = 4.0; break; // Piercing

            // Gimmick
            case 'money': color = '#f1c40f'; fireRate = 1.0; damage = targetDPS * 0.5; break; // Low damage, generates gold
            case 'pushback': color = '#ecf0f1'; fireRate = 1.0; damage = 5; break; // Low damage, high knockback
            case 'slow_field': color = '#3498db'; range = 200; fireRate = 0.5; damage = 2; specialEffect = 'ice'; break;
            case 'executioner': color = '#000'; fireRate = 2.0; break;
            case 'teleport': color = '#9b59b6'; fireRate = 5.0; damage = 0; break; // No damage, just teleport
            case 'poison_cloud': color = '#2ecc71'; range = 150; fireRate = 2.0; specialEffect = 'poison'; break;

            // High Tier
            case 'heavy_wood': color = '#8d6e63'; fireRate = 0.4; break;
            case 'heavy_stone': color = '#7f8c8d'; fireRate = 2.5; break;
            case 'alloy': color = '#bdc3c7'; fireRate = 0.6; break;
            case 'gem_core': color = '#e67e22'; fireRate = 0.5; break;
            case 'obsidian_wall': color = '#000'; fireRate = 1.0; damage = targetDPS * 2; break; // High damage but short range?
            case 'crystal_spire': color = '#9b59b6'; fireRate = 0.2; break;

            // Expensive
            case 'king': color = '#f1c40f'; range = 250; fireRate = 1.0; break;
            case 'queen': color = '#e74c3c'; range = 250; fireRate = 0.5; break;
            case 'void': color = '#000'; range = 300; fireRate = 1.5; break;
            case 'sun': color = '#f39c12'; range = 300; fireRate = 0.2; specialEffect = 'fire'; break;
            case 'moon': color = '#bdc3c7'; range = 300; fireRate = 1.0; specialEffect = 'ice'; break;

            // Combos
            case 'fire_ice': color = '#8e44ad'; fireRate = 0.8; break; // Both effects?
            case 'poison_stone': color = '#27ae60'; fireRate = 1.5; specialEffect = 'poison'; break;

            // Ultimate
            case 'ultimate': color = '#fff'; range = 400; fireRate = 0.1; break;
            case 'omega': color = '#000'; range = 1000; fireRate = 5.0; break; // Nuke
            case 'alpha': color = '#fff'; range = 500; fireRate = 0.05; break; // Laser stream
            case 'chaos': color = '#ff00ff'; range = 300; fireRate = 0.5; break;

            // Legacy
            case 'gold_mini': color = '#ffd700'; range = 150; fireRate = 0.4; break;
            case 'gold_canon': color = '#ffd700'; range = 500; fireRate = 3.0; break;

            default: // Basic
                fireRate = 1.0;
                break;
        }

        // Calculate damage if not manually set
        if (damage === 10 && type !== 'basic') { // If still default
            damage = targetDPS * fireRate;
        }

        super(x, y, 20, color);
        this.type = 'turret';
        this.turretType = type || 'basic';
        this.range = range;
        this.cooldown = 0;
        this.fireRate = fireRate;
        this.damage = damage;
        this.paralyzedTime = 0;
        this.specialEffect = specialEffect;

        // Stats tracking
        this.killCount = 0;
    }

    update(dt, entities) {
        if (this.paralyzedTime > 0) {
            this.paralyzedTime -= dt;
            return;
        }

        if (this.cooldown > 0) {
            this.cooldown -= dt;
        }

        if (this.cooldown <= 0) {
            // --- Special Targeting Logic ---

            if (this.turretType === 'aoe' || this.turretType === 'poison_cloud' || this.turretType === 'slow_field') {
                // AoE Logic
                let hit = false;
                entities.forEach(entity => {
                    if (entity.type === 'enemy') {
                        const dist = Math.hypot(entity.x - this.x, entity.y - this.y);
                        if (dist < this.range) {
                            if (entity.takeDamage) entity.takeDamage(this.damage);
                            if (this.specialEffect) entity.applyEffect(this.specialEffect, 2.0, this.damage * 0.2);
                            hit = true;
                        }
                    }
                });
                if (hit) {
                    this.cooldown = this.fireRate;
                    this.fireAnim = 0.2;
                }
            } else if (this.turretType === 'tesla') {
                // Chain Lightning
                // Find nearest
                let nearest = this.findNearest(entities);
                if (nearest) {
                    this.shoot(nearest, entities);
                    // Chain to 2 more
                    let current = nearest;
                    for (let i = 0; i < 2; i++) {
                        let next = this.findNearest(entities, current, 150, [nearest, ...entities.filter(e => e.id === current.id)]); // Exclude current
                        if (next) {
                            // Visual chain (hacky via projectile for now, or just instant damage)
                            if (next.takeDamage) next.takeDamage(this.damage * 0.8);
                            current = next;
                        } else break;
                    }
                    this.cooldown = this.fireRate;
                }
            } else if (this.turretType === 'shotgun') {
                // Fire 5 projectiles in spread
                let nearest = this.findNearest(entities);
                if (nearest) {
                    const angle = Math.atan2(nearest.y - this.y, nearest.x - this.x);
                    for (let i = -2; i <= 2; i++) {
                        const spread = angle + (i * 0.15); // 0.15 radians spread
                        entities.push(new Projectile(this.x, this.y, null, this.damage, 'bullet', {
                            color: this.color, speed: 600, source: this, angle: spread
                        }));
                    }
                    this.cooldown = this.fireRate;
                }
            } else if (this.turretType === 'railgun') {
                // Piercing projectile
                let nearest = this.findNearest(entities);
                if (nearest) {
                    const angle = Math.atan2(nearest.y - this.y, nearest.x - this.x);
                    entities.push(new Projectile(this.x, this.y, null, this.damage, 'bullet', {
                        color: 'cyan', speed: 2000, source: this, angle: angle, piercing: true
                    }));
                    this.cooldown = this.fireRate;
                }
            } else if (this.turretType === 'teleport') {
                let nearest = this.findNearest(entities);
                if (nearest) {
                    // Teleport enemy back 200 units away from house
                    const dx = nearest.x - this.x; // Relative to turret? No, relative to house?
                    // Just push them away from turret
                    const angle = Math.atan2(nearest.y - this.y, nearest.x - this.x);
                    nearest.x += Math.cos(angle) * 200;
                    nearest.y += Math.sin(angle) * 200;
                    this.cooldown = this.fireRate;
                }
            } else if (this.turretType === 'money') {
                let nearest = this.findNearest(entities);
                if (nearest) {
                    this.shoot(nearest, entities);
                    this.cooldown = this.fireRate;
                }
            } else {
                // Standard Single Target
                let nearest = this.findNearest(entities);
                if (nearest) {
                    this.shoot(nearest, entities);
                    this.cooldown = this.fireRate;
                }
            }
        }
    }

    findNearest(entities, exclude = null, rangeOverride = null, ignoreList = []) {
        let nearest = null;
        let minDist = rangeOverride || this.range;
        for (const entity of entities) {
            if (entity.type === 'enemy' && entity !== exclude && !ignoreList.includes(entity)) {
                const dist = Math.hypot(entity.x - this.x, entity.y - this.y);
                if (dist < minDist) {
                    minDist = dist;
                    nearest = entity;
                }
            }
        }
        return nearest;
    }

    shoot(target, entities) {
        // Spawn Projectile
        const projectile = new Projectile(this.x, this.y, target, this.damage, 'bullet', {
            color: this.color,
            speed: this.turretType === 'sniper' ? 1500 : 800,
            effect: this.specialEffect,
            source: this,
            type: this.turretType === 'missile' || this.turretType === 'mortar' ? 'missile' : 'bullet'
        });
        entities.push(projectile);

        this.lastTarget = target;
    }

    draw(ctx) {
        ctx.save();
        const paralyzed = this.paralyzedTime > 0;
        ctx.fillStyle = paralyzed ? '#555' : this.color;

        // --- Draw Logic based on Type ---

        // Base
        ctx.beginPath();
        if (this.turretType.includes('heavy') || this.turretType === 'obsidian' || this.turretType === 'tank') {
            ctx.fillRect(this.x - 18, this.y - 18, 36, 36);
        } else {
            ctx.arc(this.x, this.y, 15, 0, Math.PI * 2);
            ctx.fill();
        }

        // Barrel / Top Feature
        ctx.fillStyle = this.color; // Reset fill
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;

        if (this.turretType === 'sniper' || this.turretType === 'railgun') {
            // Long Barrel
            ctx.fillStyle = '#444';
            ctx.fillRect(this.x - 4, this.y - 35, 8, 35);
        } else if (this.turretType === 'gatling') {
            // Multi Barrel
            ctx.fillStyle = '#444';
            ctx.fillRect(this.x - 8, this.y - 25, 4, 25);
            ctx.fillRect(this.x + 4, this.y - 25, 4, 25);
            ctx.fillRect(this.x - 2, this.y - 28, 4, 28);
        } else if (this.turretType === 'shotgun') {
            // Wide Barrel
            ctx.fillStyle = '#444';
            ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(this.x - 10, this.y - 25); ctx.lineTo(this.x + 10, this.y - 25); ctx.fill();
        } else if (this.turretType === 'tesla') {
            // Coil
            ctx.strokeStyle = '#3498db'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(this.x, this.y, 20, 0, Math.PI * 2); ctx.stroke();
            // Sparks
            if (Math.random() > 0.5) {
                ctx.beginPath(); ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.x + (Math.random() - 0.5) * 30, this.y + (Math.random() - 0.5) * 30);
                ctx.stroke();
            }
        } else if (this.turretType === 'money' || this.turretType.includes('gold')) {
            // Gold Ring
            ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(this.x, this.y, 12, 0, Math.PI * 2); ctx.stroke();
            ctx.fillStyle = '#f1c40f';
            ctx.fillText('$', this.x - 4, this.y + 4);
        } else if (this.turretType === 'crystal' || this.turretType === 'diamond') {
            // Crystal Spire
            ctx.fillStyle = this.turretType === 'diamond' ? '#3498db' : '#9b59b6';
            ctx.beginPath(); ctx.moveTo(this.x, this.y - 20); ctx.lineTo(this.x + 10, this.y); ctx.lineTo(this.x, this.y + 20); ctx.lineTo(this.x - 10, this.y); ctx.fill();
        } else if (this.turretType === 'emerald' || this.turretType === 'poison') {
            // Poison Gas Vent
            ctx.fillStyle = '#2ecc71';
            ctx.beginPath(); ctx.arc(this.x, this.y, 10, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(46, 204, 113, 0.3)';
            ctx.beginPath(); ctx.arc(this.x, this.y, 25, 0, Math.PI * 2); ctx.fill();
        } else if (this.turretType === 'ruby' || this.turretType === 'fire' || this.turretType === 'flamethrower') {
            // Fire Core
            ctx.fillStyle = '#e74c3c';
            ctx.beginPath(); ctx.moveTo(this.x, this.y - 15); ctx.lineTo(this.x + 10, this.y + 10); ctx.lineTo(this.x - 10, this.y + 10); ctx.fill();
            // Flame
            ctx.fillStyle = '#f39c12';
            ctx.beginPath(); ctx.arc(this.x, this.y - 5, 5, 0, Math.PI * 2); ctx.fill();
        } else if (this.turretType === 'sapphire' || this.turretType === 'ice' || this.turretType === 'slow_field') {
            // Ice Shard
            ctx.fillStyle = '#3498db';
            ctx.beginPath(); ctx.moveTo(this.x, this.y - 20); ctx.lineTo(this.x + 5, this.y + 10); ctx.lineTo(this.x - 5, this.y + 10); ctx.fill();
            ctx.strokeStyle = 'white'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(this.x - 10, this.y); ctx.lineTo(this.x + 10, this.y); ctx.stroke();
        } else {
            // Default Triangle Pointer
            ctx.fillStyle = '#555';
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - 20);
            ctx.lineTo(this.x + 8, this.y);
            ctx.lineTo(this.x - 8, this.y);
            ctx.fill();
        }

        // Paralyzed indicator
        if (paralyzed) {
            ctx.strokeStyle = 'yellow'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(this.x - 10, this.y - 10); ctx.lineTo(this.x + 10, this.y + 10);
            ctx.moveTo(this.x + 10, this.y - 10); ctx.lineTo(this.x - 10, this.y + 10); ctx.stroke();
        }

        // Fire animation (AoE only)
        if (this.fireAnim > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, 0.3)`;
            ctx.beginPath(); ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2); ctx.fill();
            this.fireAnim -= 0.016;
        }

        ctx.restore();
    }
}
