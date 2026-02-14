import { Entity } from './Entity.js';
import { Resource } from './Resource.js';
import { Worker } from './Worker.js';
import { Config } from '../game/Config.js';

export class Building extends Entity {
    constructor(x, y, type) {
        let color = '#3498db'; // Default Blue
        if (type === 'wood_gen') color = '#2ecc71';
        if (type === 'stone_gen') color = '#95a5a6';
        if (type === 'iron_gen') color = '#7f8c8d';
        if (type === 'crystal_gen') color = '#9b59b6';
        if (type === 'obsidian_gen') color = '#2c3e50';
        if (type === 'diamond_gen') color = '#3498db';
        if (type === 'emerald_gen') color = '#27ae60';
        if (type === 'ruby_gen') color = '#c0392b';
        if (type === 'sapphire_gen') color = '#2980b9';
        if (type === 'wood_col') color = '#27ae60';
        if (type === 'stone_col') color = '#7f8c8d';
        if (type === 'iron_col') color = '#34495e';
        if (type === 'universal_col') color = '#f39c12'; // Orange for universal
        if (type === 'collector_novice') color = '#bdc3c7'; // Silver/Grey
        if (type === 'alchemy') color = '#f1c40f';
        if (type === 'mega_wall') color = '#8b4513'; // Brown
        if (type === 'mega_fort') color = '#2c3e50'; // Dark grey
        if (type === 'super_col') color = '#9b59b6'; // Purple

        // Buff buildings
        if (type.startsWith('buff_attack')) color = '#e74c3c'; // Red for attack
        if (type.startsWith('buff_speed')) color = '#27ae60'; // Green for speed

        let radius = 25;
        if (type === 'mega_wall' || type === 'mega_fort' || type === 'super_col') {
            radius = 50; // Mega buildings are HUGE
        }

        super(x, y, radius, color);
        this.type = 'building';
        this.buildingType = type; // 'wood_gen', 'stone_gen', etc.
        this.productionTimer = Config.GENERATOR_PRODUCTION_TIME;
        this.maxProductionTimer = Config.GENERATOR_PRODUCTION_TIME;
        this.timer = this.productionTimer; // Initialize timer
        this.interval = this.productionTimer; // Default interval

        // Stats tracking
        this.generatedCount = 0; // For generators

        if (type === 'alchemy') {
            this.interval = 50.0; // Gold is precious
            this.timer = this.interval;
        }

        // Worker Logic
        this.worker = null;
        if (type === 'wood_col' || type === 'stone_col' || type === 'iron_col' || type === 'universal_col' || type === 'collector_novice') {
            this.interval = 1.0; // Check worker status often
            this.timer = this.interval;
        }

        // Mega buildings - tanky and powerful
        if (type === 'mega_wall' || type === 'mega_fort') {
            this.interval = 0.5; // Active defense
            this.timer = this.interval;
            this.health = 5000; // Very tanky
            this.maxHealth = 5000;
        }

        // Spawn animation disabled for performance
        this.spawnScale = 1;
        this.targetScale = 1;
    }

    update(dt, entities) {
        this.timer -= dt;
        if (this.timer <= 0) {
            this.performAction(entities);
            this.timer = this.interval;
        }

        // Update owned worker if any
        if (this.worker) {
            this.worker.update(dt, entities);
        }

        // Check and apply buffs
        this.checkBuffs(entities);
    }

    performAction(entities) {
        if (this.buildingType === 'wood_gen') {
            this.spawnResource(entities, 'tree');
            this.generatedCount++;
        } else if (this.buildingType === 'stone_gen') {
            this.spawnResource(entities, 'rock');
            this.generatedCount++;
        } else if (this.buildingType === 'iron_gen') {
            this.spawnResource(entities, 'iron');
            this.generatedCount++;
        } else if (this.buildingType === 'crystal_gen') {
            this.spawnResource(entities, 'crystal');
            this.generatedCount++;
        } else if (this.buildingType === 'obsidian_gen') {
            this.spawnResource(entities, 'obsidian');
            this.generatedCount++;
        } else if (this.buildingType === 'diamond_gen') {
            this.spawnResource(entities, 'diamond');
            this.generatedCount++;
        } else if (this.buildingType === 'emerald_gen') {
            this.spawnResource(entities, 'emerald');
            this.generatedCount++;
        } else if (this.buildingType === 'ruby_gen') {
            this.spawnResource(entities, 'ruby');
            this.generatedCount++;
        } else if (this.buildingType === 'sapphire_gen') {
            this.spawnResource(entities, 'sapphire');
            this.generatedCount++;
        } else if (this.buildingType === 'wood_col') {
            if (!this.worker) {
                this.worker = new Worker(this.x, this.y, this, 'tree');
            }
        } else if (this.buildingType === 'stone_col') {
            if (!this.worker) {
                this.worker = new Worker(this.x, this.y, this, 'rock');
            }
        } else if (this.buildingType === 'iron_col') {
            if (!this.worker) {
                this.worker = new Worker(this.x, this.y, this, 'iron');
            }
        } else if (this.buildingType === 'universal_col') {
            if (!this.worker) {
                this.worker = new Worker(this.x, this.y, this, 'all'); // Collects all resources
            }
        } else if (this.buildingType === 'collector_novice') {
            if (!this.worker) {
                this.worker = new Worker(this.x, this.y, this, 'all');
                this.worker.maxInventory = 1; // Only 1 item
                this.worker.speed = 50; // Slow
            }
        } else if (this.buildingType === 'alchemy') {
            const player = entities.find(e => e.type === 'player');
            if (player) {
                player.inventory.gold += 1;
                player.addResourceDelta('gold', 1);
                this.flashTime = 0.5;
            }
        } else if (this.buildingType === 'mega_wall') {
            // Mega Wall: Damages nearby enemies
            entities.forEach(e => {
                if (e.type === 'enemy') {
                    const dist = Math.hypot(e.x - this.x, e.y - this.y);
                    if (dist < 150) {
                        e.takeDamage(50); // Heavy damage in range
                    }
                }
            });
        } else if (this.buildingType === 'mega_fort') {
            // Mega Fort: Spawns resources AND damages enemies
            this.spawnResource(entities, 'tree');
            this.spawnResource(entities, 'rock');
            entities.forEach(e => {
                if (e.type === 'enemy') {
                    const dist = Math.hypot(e.x - this.x, e.y - this.y);
                    if (dist < 200) {
                        e.takeDamage(30);
                    }
                }
            });
        }
    }

    // Check if this is a buff building and apply buffs to nearby player
    checkBuffs(entities) {
        if (!this.buildingType.startsWith('buff_')) return;

        const player = entities.find(e => e.type === 'player');
        if (!player) return;

        const dist = Math.hypot(player.x - this.x, player.y - this.y);
        const buffRange = 200;

        if (dist < buffRange) {
            if (this.buildingType === 'buff_attack_1') {
                if (!player.buffSources.attack || player.buffSources.attack === this) {
                    player.buffs.attackDamage = 1.5;
                    player.buffSources.attack = this;
                }
            } else if (this.buildingType === 'buff_attack_2') {
                if (!player.buffSources.attack || player.buffSources.attack === this) {
                    player.buffs.attackDamage = 2.0;
                    player.buffSources.attack = this;
                }
            } else if (this.buildingType === 'buff_attack_3') {
                if (!player.buffSources.attack || player.buffSources.attack === this) {
                    player.buffs.attackDamage = 3.0;
                    player.buffSources.attack = this;
                }
            } else if (this.buildingType === 'buff_speed_1') {
                if (!player.buffSources.speed || player.buffSources.speed === this) {
                    player.buffs.speed = 1.5;
                    player.buffSources.speed = this;
                }
            } else if (this.buildingType === 'buff_speed_2') {
                if (!player.buffSources.speed || player.buffSources.speed === this) {
                    player.buffs.speed = 2.0;
                    player.buffSources.speed = this;
                }
            } else if (this.buildingType === 'buff_speed_3') {
                if (!player.buffSources.speed || player.buffSources.speed === this) {
                    player.buffs.speed = 2.5;
                    player.buffSources.speed = this;
                }
            }
        } else {
            // Out of range, remove buff if this building was providing it
            if (player.buffSources.attack === this) {
                player.buffs.attackDamage = 1.0;
                player.buffSources.attack = null;
            }
            if (player.buffSources.speed === this) {
                player.buffs.speed = 1.0;
                player.buffSources.speed = null;
            }
        }
    }

    spawnResource(entities, type) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 40 + Math.random() * 40;
        const x = this.x + Math.cos(angle) * dist;
        const y = this.y + Math.sin(angle) * dist;
        entities.push(new Resource(x, y, type));
    }

    draw(ctx) {
        // Draw Hexagon for buildings
        ctx.fillStyle = this.color;
        if (this.flashTime > 0) {
            ctx.fillStyle = 'white';
            this.flashTime -= 0.016;
        }

        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const x = this.x + Math.cos(angle) * this.radius;
            const y = this.y + Math.sin(angle) * this.radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.fill();
        ctx.closePath();

        // Draw production timer for generators
        if (this.buildingType.includes('_gen')) {
            const progress = 1 - (this.timer / this.maxProductionTimer);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 5, -Math.PI / 2, -Math.PI / 2 + (progress * Math.PI * 2));
            ctx.stroke();
        }

        // Draw Flag for collectors
        if (this.buildingType.includes('_col')) {
            ctx.fillStyle = 'white';
            ctx.fillRect(this.x - 2, this.y - 20, 4, 20);
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x, this.y - 20, 15, 10);
        }

        // Draw Worker
        if (this.worker) {
            this.worker.draw(ctx);
        }
    }
}
