import { Entity } from './Entity.js';
import { Turret } from './Turret.js';
import { Building } from './Building.js';
import { Seed } from './Seed.js';
import { Config } from '../game/Config.js';
import { Recipes } from '../game/Recipes.js';

export class Player extends Entity {
    constructor(x, y, input) {
        super(x, y, 15, '#ffffffff'); // Yellow player
        this.input = input;
        this.speed = Config.PLAYER_SPEED;
        this.inventory = {
            wood: 0, stone: 0, gold: 0,
            iron: 0, crystal: 0, obsidian: 0,
            diamond: 0, emerald: 0, ruby: 0, sapphire: 0
        };

        // Track resource changes for HUD display
        this.resourceDeltas = {};
        this.deltaTimers = {};

        this.attackCooldown = 0;
        this.morphTime = 0;
        this.buildCooldown = 0;
        this.selectedBuild = 'turret_basic'; // Default

        // Buff system
        this.buffs = {
            attackDamage: 1.0, // Multiplier
            speed: 1.0 // Multiplier
        };
        this.buffSources = {
            attack: null, // Which building is providing attack buff
            speed: null // Which building is providing speed buff
        };
        this.blinkTime = 0; // For visual feedback when buffed

        // Sprite Animation
        this.sprite = new Image();
        this.sprite.src = './assets/player_spritesheet.png';
        this.frameWidth = 256;
        this.frameHeight = 256;
        this.totalFrames = 13;
        this.currentFrame = 0;
        this.frameTimer = 0;
        this.frameInterval = 0.08; // Adjust for animation speed
        this.facingRight = true;

        // Floating Animation
        this.floatTime = 0;
    }

    update(dt, entities) {
        // Transform mouse to world coordinates if zoomed
        const mouseWorldX = this.game ? this.getWorldX(this.input.mouse.x) : this.input.mouse.x;
        const mouseWorldY = this.game ? this.getWorldY(this.input.mouse.y) : this.input.mouse.y;

        // Handle Sidebar Clicks
        if (this.input.mouse.left && this.game && this.game.buildMenu) {
            // Check if click is consumed by UI
            if (this.game.buildMenu.handleClick(this.input.mouse.x, this.input.mouse.y)) {
                // Click consumed by UI, do not build or move
                return null;
            }
        }

        const movement = this.input.getMovement();

        const effectiveSpeed = this.speed * this.buffs.speed;

        // Update Animation (Always animate)
        this.frameTimer += dt;
        if (this.frameTimer >= this.frameInterval) {
            this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
            this.frameTimer = 0;
        }

        // Update Floating
        this.floatTime += dt * 2; // Speed of float

        if (movement.x !== 0 || movement.y !== 0) {
            const len = Math.sqrt(movement.x * movement.x + movement.y * movement.y);
            this.x += (movement.x / len) * effectiveSpeed * dt;
            this.y += (movement.y / len) * effectiveSpeed * dt;

            // Update facing direction
            if (movement.x > 0) this.facingRight = true;
            if (movement.x < 0) this.facingRight = false;

            // World Boundaries Clamp
            if (this.game && this.game.worldSize) {
                const limit = this.game.worldSize / 2;
                this.x = Math.max(-limit, Math.min(limit, this.x));
                this.y = Math.max(-limit, Math.min(limit, this.y));
            }

            // Trail Effect with Offset
            if (this.game && this.game.particleSystem && Math.random() > 0.7) {
                // Calculate perpendicular vector
                const dirX = movement.x / len;
                const dirY = movement.y / len;
                const perpX = -dirY;
                const perpY = dirX;

                // Random offset [-radius, radius]
                const offset = (Math.random() - 0.5) * 2 * this.radius;

                this.game.particleSystem.emit(
                    this.x + perpX * offset,
                    this.y + perpY * offset,
                    this.color, 4,
                    { life: 0.4, size: 2 }
                );
            }
        }

        if (this.buildCooldown > 0) this.buildCooldown -= dt;

        // Update delta timers (for HUD fade animation)
        for (const res in this.deltaTimers) {
            this.deltaTimers[res] -= dt;
            if (this.deltaTimers[res] <= 0) {
                delete this.resourceDeltas[res];
                delete this.deltaTimers[res];
            }
        }

        // Auto-Attack Logic
        if (this.attackCooldown > 0) {
            this.attackCooldown -= dt;
        } else {
            // Auto-attack nearest valid target
            this.autoAttack(entities);
        }

        // Build on Click
        if (this.input.mouse.left && this.selectedBuild) {
            // Check if mouse is over DOM elements (build menu, etc)
            // Also check if over Sidebar (BuildMenu)
            const mouseOverUI = this.isMouseOverUI() || (this.game && this.game.buildMenu && this.game.buildMenu.handleClick(this.input.mouse.x, this.input.mouse.y));

            if (!mouseOverUI && this.buildCooldown <= 0) {
                const newEntity = this.tryBuild(entities, mouseWorldX, mouseWorldY);
                if (newEntity) return newEntity;
            }
        }

        return null;
    }

    getWorldX(screenX) {
        if (!this.game || !this.game.currentZoomScale) return screenX;
        return (screenX - this.game.centerX) / this.game.currentZoomScale + this.game.centerX;
    }

    getWorldY(screenY) {
        if (!this.game || !this.game.currentZoomScale) return screenY;
        return (screenY - this.game.centerY) / this.game.currentZoomScale + this.game.centerY;
    }

    isMouseOverUI() {
        // Simple check if mouse is on the right side where the menu is
        // But BuildMenu handles its own hit detection now
        return false;
    }

    tryBuild(entities, mouseX, mouseY) {
        if (!this.selectedBuild) return null;

        const recipe = Recipes[this.selectedBuild];
        if (!recipe) return null;

        // Grid Snapping
        const gridSize = 50;
        const gridX = Math.round(mouseX / gridSize) * gridSize;
        const gridY = Math.round(mouseY / gridSize) * gridSize;

        // Collision Check (Strict Grid Occupancy)
        for (const entity of entities) {
            if (entity.constructor.name === 'Turret' || entity.constructor.name === 'Building' || entity.constructor.name === 'House') {
                // Check if grid cell is occupied
                // Simple distance check is often enough if radius ~ grid/2
                const dist = Math.hypot(entity.x - gridX, entity.y - gridY);
                if (dist < 10) { // Overlap
                    return null; // Cannot build here
                }
            }
        }

        const cost = recipe.cost;

        // Check all resources
        for (const [res, amount] of Object.entries(cost)) {
            if ((this.inventory[res] || 0) < amount) return null;
        }

        // Deduct resources and track deltas
        for (const [res, amount] of Object.entries(cost)) {
            this.inventory[res] -= amount;
            this.addResourceDelta(res, -amount);
        }

        this.buildCooldown = Config.PLAYER_BUILD_COOLDOWN;

        if (recipe.type === 'turret') {
            return new Turret(gridX, gridY, recipe.subType);
        } else if (recipe.type === 'seed') {
            return new Seed(gridX, gridY, recipe.subType);
        } else {
            return new Building(gridX, gridY, recipe.subType);
        }
    }

    addResourceDelta(resource, amount) {
        // Track resource change for HUD display
        this.resourceDeltas[resource] = (this.resourceDeltas[resource] || 0) + amount;
        this.deltaTimers[resource] = 2.0; // Show for 2 seconds
    }

    canAfford(cost) {
        // Check if player has enough resources for the given cost
        for (const [res, amount] of Object.entries(cost)) {
            if ((this.inventory[res] || 0) < amount) return false;
        }
        return true;
    }

    draw(ctx) {
        // Determine if buffed
        const isBuffed = this.buffs.attackDamage > 1.0 || this.buffs.speed > 1.0;

        // Calculate floating offset
        const floatY = Math.sin(this.floatTime) * 5; // +/- 5 pixels

        // Draw Sprite
        if (this.sprite && this.sprite.complete) {
            ctx.save();
            ctx.translate(this.x, this.y + floatY); // Apply float here
            if (!this.facingRight) {
                ctx.scale(-1, 1);
            }

            // Draw centered
            // Scale down the sprite? 256x256 is huge compared to radius 15
            // Radius 15 means diameter 30.
            // Let's scale it to be roughly 60x60 visual size?
            const baseSize = 64;
            const drawSize = baseSize * (Config.PLAYER_SIZE_MULTIPLIER || 1.0);

            ctx.drawImage(
                this.sprite,
                this.currentFrame * this.frameWidth, 0, this.frameWidth, this.frameHeight,
                -drawSize / 2, -drawSize / 2, drawSize, drawSize
            );

            ctx.restore();
        } else {
            // Fallback to circle if sprite not loaded
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y + floatY, this.radius * (Config.PLAYER_SIZE_MULTIPLIER || 1.0), 0, Math.PI * 2);
            ctx.fill();
            ctx.closePath();
        }

        // Player morph effect or buffed blink (Overlay)
        if (this.morphTime > 0) {
            ctx.fillStyle = '#e67e22'; // Orange
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.arc(this.x, this.y + floatY, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
            this.morphTime -= 0.016;
        } else if (isBuffed) {
            // Blink if buffed
            this.blinkTime += 0.1;
            const blink = Math.sin(this.blinkTime * 10) > 0;
            if (blink) {
                ctx.strokeStyle = '#f39c12';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(this.x, this.y + floatY, this.radius + 5, 0, Math.PI * 2);
                ctx.stroke();
            }
        }

        // Build Mode Preview - draw at WORLD coordinates
        if (this.selectedBuild) {
            // Get world coordinates for mouse
            const worldX = this.game ? this.getWorldX(this.input.mouse.x) : this.input.mouse.x;
            const worldY = this.game ? this.getWorldY(this.input.mouse.y) : this.input.mouse.y;

            // Snap to grid
            const gridSize = 50;
            const gridX = Math.round(worldX / gridSize) * gridSize;
            const gridY = Math.round(worldY / gridSize) * gridSize;

            ctx.strokeStyle = '#2ecc71';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(gridX, gridY, 25, 0, Math.PI * 2);
            ctx.stroke();
            ctx.closePath();

            // Draw grid cell
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.strokeRect(gridX - 25, gridY - 25, 50, 50);
        }
    }

    autoAttack(entities) {
        // Find nearest resource or enemy within range
        const range = 60; // Slightly larger than visual range
        let nearest = null;
        let minDist = range;

        // Prioritize enemies
        if (this.game && this.game.enemies) {
            for (const enemy of this.game.enemies) {
                const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                if (dist < range + enemy.radius && dist < minDist) {
                    minDist = dist;
                    nearest = enemy;
                }
            }
        }

        // If no enemy, check resources
        if (!nearest && this.game && this.game.resources) {
            for (const res of this.game.resources) {
                const dist = Math.hypot(res.x - this.x, res.y - this.y);
                if (dist < range + res.radius && dist < minDist) {
                    minDist = dist;
                    nearest = res;
                }
            }
        }

        if (nearest && nearest.takeDamage) {
            nearest.takeDamage(1);
            this.attackCooldown = Config.PLAYER_ATTACK_COOLDOWN;

            // Visual feedback for attack?
            // Maybe a small "slash" particle towards target
            if (this.game && this.game.particleSystem) {
                const dx = nearest.x - this.x;
                const dy = nearest.y - this.y;
                const len = Math.hypot(dx, dy);
                this.game.particleSystem.emit(
                    this.x + (dx / len) * 20,
                    this.y + (dy / len) * 20,
                    '#ffffff', 1,
                    { speed: 50, life: 0.2, size: 3 }
                );
            }
        }
    }
}
