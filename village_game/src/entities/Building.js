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

        if (type.startsWith('buff_attack')) color = '#e74c3c';
        if (type.startsWith('buff_speed')) color = '#27ae60';

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


        if (type === 'mega_wall' || type === 'mega_fort') {
            this.interval = 0.5; // Active defense
            this.timer = this.interval;
            this.health = 5000; // Very tanky
            this.maxHealth = 5000;
        }

        this.spawnScale = 1;
        this.targetScale = 1;
    }

    update(dt, entities) {
        this.timer -= dt;
        if (this.timer <= 0) {
            this.performAction(entities);
            this.timer = this.interval;
        }


        // Check and apply buffs
        this.checkBuffs(entities);
    }

    performAction(entities) {
        const player = entities.find(e => e.type === 'player');
        if (!player) return;

        if (this.buildingType === 'wood_gen') {
            player.inventory.wood += 5;
            player.addResourceDelta('wood', 5);
            this.generatedCount++;
        } else if (this.buildingType === 'stone_gen') {
            player.inventory.stone += 5;
            player.addResourceDelta('stone', 5);
            this.generatedCount++;
        } else if (this.buildingType === 'iron_gen') {
            player.inventory.iron += 2;
            player.addResourceDelta('iron', 2);
            this.generatedCount++;
        } else if (this.buildingType === 'crystal_gen') {
            player.inventory.crystal += 2;
            player.addResourceDelta('crystal', 2);
            this.generatedCount++;
        } else if (this.buildingType === 'obsidian_gen') {
            player.inventory.obsidian += 2;
            player.addResourceDelta('obsidian', 2);
            this.generatedCount++;
        } else if (this.buildingType === 'diamond_gen') {
            player.inventory.diamond += 1;
            player.addResourceDelta('diamond', 1);
            this.generatedCount++;
        } else if (this.buildingType === 'emerald_gen') {
            player.inventory.emerald += 1;
            player.addResourceDelta('emerald', 1);
            this.generatedCount++;
        } else if (this.buildingType === 'ruby_gen') {
            player.inventory.ruby += 1;
            player.addResourceDelta('ruby', 1);
            this.generatedCount++;
        } else if (this.buildingType === 'sapphire_gen') {
            player.inventory.sapphire += 1;
            player.addResourceDelta('sapphire', 1);
            this.generatedCount++;
        } else if (this.buildingType === 'alchemy') {
            const player = entities.find(e => e.type === 'player');
            if (player) {
                player.inventory.gold += 1;
                player.addResourceDelta('gold', 1);
                this.flashTime = 0.5;
            }
        } else if (this.buildingType === 'mega_wall') {
            entities.forEach(e => {
                if (e.type === 'enemy') {
                    const dist = Math.hypot(e.x - this.x, e.y - this.y);
                    if (dist < 150) {
                        e.takeDamage(50);
                    }
                }
            });
        } else if (this.buildingType === 'mega_fort') {
            if (player) {
                player.inventory.wood += 5;
                player.addResourceDelta('wood', 5);
                player.inventory.stone += 5;
                player.addResourceDelta('stone', 5);
            }
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

    }
}
