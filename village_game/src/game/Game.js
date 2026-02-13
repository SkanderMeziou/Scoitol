
import { Input } from './Input.js';
import { Player } from '../entities/Player.js';
import { House } from '../entities/House.js';
import { HUD } from './HUD.js';
import { BuildMenu } from '../ui/BuildMenu.js';
import { Encyclopedia } from './Encyclopedia.js';
import { Enemy } from '../entities/Enemy.js';
import { ParticleSystem } from './ParticleSystem.js';
import { Config } from './Config.js';
import { Resource } from '../entities/Resource.js';
import { WaveConfig } from './WaveConfig.js';


export class Game {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        document.getElementById('app').appendChild(this.canvas);

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.input = new Input();

        // Center of the map
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        this.house = new House(centerX, centerY);
        this.player = new Player(centerX + 100, centerY + 100, this.input);
        this.player.game = this; // Link game to player for HUD access
        this.hud = new HUD(this.player);
        this.buildMenu = new BuildMenu(this); // Initialize BuildMenu with game instance
        this.encyclopedia = new Encyclopedia(this);
        this.particleSystem = new ParticleSystem();
        this.isPaused = false;

        // Center and zoom tracking
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.currentZoomScale = 1.0;

        this.entities = [this.house, this.player];
        
        // Optimization: Separate lists for faster logic lookups
        this.enemies = [];
        this.turrets = [];
        this.resources = [];

        // Spawn resources
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 200 + Math.random() * 400; // Away from house
            const x = centerX + Math.cos(angle) * dist;
            const y = centerY + Math.sin(angle) * dist;
            const type = Math.random() > 0.5 ? 'tree' : 'rock';
            const res = new Resource(x, y, type);
            this.entities.push(res);
            this.resources.push(res);
        }

        this.lastTime = 0;
        this.accumulatedTime = 0;
        this.step = 1 / 60;

        this.gameState = 'START'; // START, PLAYING, GAMEOVER
        this.wave = 1;
        this.waveTimer = Config.WAVE_TIMER;
        this.spawnTimer = Config.SPAWN_TIMER_START;

        // Resource spawning
        this.resourceSpawnTimer = Config.RESOURCE_SPAWN_TIMER;
        
        // World Boundaries
        this.worldSize = Config.WORLD_SIZE;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        this.isRunning = false;
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    start() {
        this.isRunning = true;
        this.lastTime = performance.now();

        // Handle clicks for state transitions
        this.canvas.addEventListener('click', () => {
            if (this.gameState === 'START') {
                this.gameState = 'PLAYING';
            } else if (this.gameState === 'GAMEOVER') {
                // Reset game
                location.reload();
            }
        });

        requestAnimationFrame((time) => this.loop(time));
    }

    loop(time) {
        if (!this.isRunning) return;

        let now = performance.now();
        let dt = (now - this.lastTime) / 1000;
        this.lastTime = now;

        // Prevent Spiral of Death (cap dt)
        if (dt > 0.1) dt = 0.1;

        if (this.gameState === 'PLAYING' && !this.isPaused) {
            this.accumulatedTime += dt;
            while (this.accumulatedTime > this.step) {
                this.update(this.step);
                this.accumulatedTime -= this.step;
            }
        }

        this.render();

        requestAnimationFrame(() => this.loop());
    }

    update(dt) {
        // Wave System
        this.waveTimer -= dt;
        if (this.waveTimer <= 0) {
            this.wave++;
            this.waveTimer = Config.WAVE_TIMER;
            // Heal house slightly?
            this.house.health = Math.min(this.house.maxHealth, this.house.health + 100);
        }

        // Debug: Press 'P' to spawn visual showcase
        // Debug: Press 'P' to spawn visual showcase
        if (this.input.isDown('KeyP') && !this.pKeyPressed) {
            this.spawnVisualShowcase();
            this.pKeyPressed = true;
        }
        if (!this.input.isDown('KeyP')) {
            this.pKeyPressed = false;
        }

        // Spawn Enemies
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
            this.spawnEnemy();

            // Calculate spawn rate based on wave
            let spawnRate = Math.max(Config.SPAWN_RATE_MIN, 1.5 - (this.wave * Config.SPAWN_RATE_SCALING));

            // Swarm Wave (Every 3rd)
            if (this.wave % 3 === 0) {
                spawnRate /= 2; // Double spawn rate
            }

            this.spawnTimer = spawnRate;
        }

        // Resource Respawning (with cap to prevent lag)
        if (this.resources.length < 50) { // Only spawn if below 50
            this.resourceSpawnTimer -= dt;
            if (this.resourceSpawnTimer <= 0) {
                this.spawnResource();
                this.resourceSpawnTimer = 2.0 + Math.random() * 2.0; // Spawn every 2-4 seconds
            }
        }

        // Update Entities
        this.entities.forEach(entity => {
            // Pass specific lists if needed to avoid full iteration
            const newEntity = entity.update(dt, this.entities, this); 
            if (newEntity) {
                this.addEntity(newEntity);
            }
        });

        this.particleSystem.update(dt);

        // Remove dead entities
        this.entities = this.entities.filter(entity => {
            if (entity.markedForDeletion) {
                this.handleEntityDeath(entity);
                return false;
            }
            return true;
        });

        // Sync optimization lists
        this.enemies = this.entities.filter(e => e.constructor.name === 'Enemy');
        this.turrets = this.entities.filter(e => e.constructor.name === 'Turret');
        this.resources = this.entities.filter(e => e.constructor.name === 'Resource');

        // Sort entities by Y for simple depth sorting
        // Optimization: Only sort if necessary? No, depth is dynamic.
        // But we can optimize by using insertion sort if mostly sorted? 
        // Native sort is usually fine for < 1000 elements.
        this.entities.sort((a, b) => a.y - b.y);

        this.hud.update();
        
        // Handle scroll for build menu
        const wheelDelta = this.input.consumeWheel();
        if (wheelDelta !== 0) {
            this.buildMenu.handleScroll(wheelDelta);
        }
        
        this.buildMenu.update(dt);
        this.encyclopedia.update();
    }

    addEntity(entity) {
        this.entities.push(entity);
        if (entity.constructor.name === 'Enemy') this.enemies.push(entity);
        if (entity.constructor.name === 'Turret') this.turrets.push(entity);
        if (entity.constructor.name === 'Resource') this.resources.push(entity);
    }

    handleEntityDeath(entity) {
        // Particle Effects
        if (entity.constructor.name === 'Resource' || entity.type === 'tree' || entity.type === 'rock') {
             this.particleSystem.emit(entity.x, entity.y, entity.color || '#8e44ad', 8, { speed: 100, life: 0.5 });
        }
        if (entity.constructor.name === 'Enemy') {
             this.particleSystem.emit(entity.x, entity.y, '#c0392b', 10, { speed: 150, life: 0.8 });
             
             // Money Turret Reward
             if (entity.lastHitSource && entity.lastHitSource.turretType === 'money') {
                 const reward = Math.random() > 0.5 ? 'iron' : 'gold'; // We don't have gold, let's use iron/crystal
                 // Actually let's give random resources
                 const types = ['wood', 'stone', 'iron', 'crystal'];
                 const type = types[Math.floor(Math.random() * types.length)];
                 const amount = 5;
                 this.player.inventory[type] = (this.player.inventory[type] || 0) + amount;
                 this.player.addResourceDelta(type, amount);
             }
        }

        if (entity.type === 'tree') {
            this.player.inventory.wood += 5;
            this.player.addResourceDelta('wood', 5);
        }
        if (entity.type === 'rock') {
            this.player.inventory.stone += 5;
            this.player.addResourceDelta('stone', 5);
        }
        // New Resources
        if (entity.type === 'iron') {
            this.player.inventory.iron += 2;
            this.player.addResourceDelta('iron', 2);
        }
        if (entity.type === 'crystal') {
            this.player.inventory.crystal += 2;
            this.player.addResourceDelta('crystal', 2);
        }
        if (entity.type === 'obsidian') {
            this.player.inventory.obsidian += 2;
            this.player.addResourceDelta('obsidian', 2);
        }
        if (entity.type === 'diamond') {
            this.player.inventory.diamond += 1;
            this.player.addResourceDelta('diamond', 1);
        }
        if (entity.type === 'emerald') {
            this.player.inventory.emerald += 1;
            this.player.addResourceDelta('emerald', 1);
        }
        if (entity.type === 'ruby') {
            this.player.inventory.ruby += 1;
            this.player.addResourceDelta('ruby', 1);
        }
        if (entity.type === 'sapphire') {
            this.player.inventory.sapphire += 1;
            this.player.addResourceDelta('sapphire', 1);
        }
    }



    spawnEnemy() {
        const angle = Math.random() * Math.PI * 2;
        // Adjust spawn distance based on zoom
        const baseDistance = Math.max(this.canvas.width, this.canvas.height) / 2 + 100;
        // If zoomed out, increase spawn distance
        const zoomFactor = this.currentZoomScale || 1.0;
        const dist = baseDistance / zoomFactor; // Smaller scale = more zoom out = larger distance

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const x = centerX + Math.cos(angle) * dist;
        const y = centerY + Math.sin(angle) * dist;

        // Determine Round Type
        // We pick a round type for the current wave if not already picked?
        // Or just pick a random enemy based on the round config?
        // Let's say the round type is determined at the start of the wave.
        // But here we are just spawning one enemy.
        // We should store currentRoundType on the Game instance.
        
        if (!this.currentRoundType || this.currentRoundWave !== this.wave) {
            this.currentRoundWave = this.wave;
            // Pick a round type based on weights
            const totalWeight = WaveConfig.rounds.reduce((sum, r) => sum + r.weight, 0);
            let random = Math.random() * totalWeight;
            for (const round of WaveConfig.rounds) {
                random -= round.weight;
                if (random <= 0) {
                    this.currentRoundType = round;
                    // Notify user of round type?
                    this.hud.showNotification(`Wave ${this.wave}: ${round.description}`);
                    break;
                }
            }
        }

        const round = this.currentRoundType || WaveConfig.rounds[0];

        // Pick enemy type from round config
        const enemies = round.enemies;
        const totalEnemyWeight = Object.values(enemies).reduce((sum, w) => sum + w, 0);
        let randomEnemy = Math.random() * totalEnemyWeight;
        let type = 'normal';
        for (const [eType, weight] of Object.entries(enemies)) {
            randomEnemy -= weight;
            if (randomEnemy <= 0) {
                type = eType;
                break;
            }
        }
        
        // Calculate base power for this wave
        let basePower = Config.ENEMY_BASE_POWER * Math.pow(Config.ENEMY_POWER_SCALING, this.wave - 1);
        
        // Apply Round Multipliers
        if (round.powerMultiplier) basePower *= round.powerMultiplier;
        
        // Apply power variance formula: f(t) = (k/n) + (kn - (k/n)) * t^k
        // where t ∈ [0,1], k = variance factor, n = base power
        const t = Math.random(); // Random value between 0 and 1
        const k = Config.ENEMY_POWER_VARIANCE;
        const n = basePower;
        
        const power = (n / k) + (k * n - (n / k)) * Math.pow(t, k);
        
        const enemy = new Enemy(x, y, type, this.house, power);

        this.addEntity(enemy);
    }

    spawnVisualShowcase() {
        console.log("Spawning Visual Showcase");
        const startX = this.player.x - 300;
        const startY = this.player.y + 200;
        
        for (let i = 0; i < 10; i++) {
            // Calculate power for this tier: 4^i
            const power = Math.pow(4, i);
            const x = startX + i * 60;
            const y = startY;
            
            const enemy = new Enemy(x, y, 'normal', this.house, power);
            // Disable AI for showcase
            enemy.speed = 0; 
            enemy.update = function() {}; // Freeze update
            this.addEntity(enemy);
        }
    }

    spawnResource() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const angle = Math.random() * Math.PI * 2;
        const dist = 200 + Math.random() * 400;
        const x = centerX + Math.cos(angle) * dist;
        const y = centerY + Math.sin(angle) * dist;

        // Weighted random for resources - gated by wave
        const rand = Math.random();
        let type = 'tree';

        // Always available
        if (rand > 0.4) type = 'rock';

        // Wave 2+
        if (this.wave >= 2 && rand > 0.7) type = 'iron';

        // Wave 3+
        if (this.wave >= 3 && rand > 0.8) type = 'crystal';

        // Wave 4+
        if (this.wave >= 4 && rand > 0.85) type = 'obsidian';

        // Wave 5+
        if (this.wave >= 5 && rand > 0.9) type = 'diamond';
        if (this.wave >= 5 && rand > 0.93) type = 'emerald';
        if (this.wave >= 5 && rand > 0.96) type = 'ruby';
        if (this.wave >= 5 && rand > 0.98) type = 'sapphire';

        this.addEntity(new Resource(x, y, type));
    }

    render() {
        this.ctx.fillStyle = Config.BACKGROUND_COLOR;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.gameState === 'START') {
            this.ctx.fillStyle = 'white';
            this.ctx.font = '48px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('VILLAGE DEFENSE', this.canvas.width / 2, this.canvas.height / 2 - 100);

            this.ctx.font = '24px monospace';
            this.ctx.fillText('Click to Start', this.canvas.width / 2, this.canvas.height / 2 + 100);

            this.ctx.textAlign = 'left';
            const instructions = [
                "Controls:",
                "- WASD / ZQSD / Arrows to Move",
                "- Click Resources to Gather",
                "- Press 'B' to Build",
                "- Protect the House!"
            ];

            let y = this.canvas.height / 2 - 20;
            instructions.forEach(line => {
                this.ctx.fillText(line, this.canvas.width / 2 - 250, y);
                y += 30;
            });
            return;
        }

        // Dynamic Zoom Logic
        // Count buildings (Turrets + Buildings)
        const buildingCount = this.turrets.length + this.entities.filter(e => e.constructor.name === 'Building').length;

        // Base scale 1.0
        // At 20 buildings, start zooming out.
        // At 100 buildings, max zoom out.
        // Curve: Sqrt

        let targetScale = 1.0;
        if (buildingCount > 20) {
            const progress = Math.min(1.0, (buildingCount - 20) / 80); // 0 to 1
            // Sqrt curve for smooth start
            const curve = Math.sqrt(progress);
            // Max zoom out to 0.5x (viewing 2x area)
            targetScale = 1.0 - (curve * 0.5);
        }

        // Smooth zoom transition (lerp)
        if (!this.currentZoomScale) this.currentZoomScale = targetScale;
        const lerpSpeed = 2.0; // Smooth transition
        this.currentZoomScale += (targetScale - this.currentZoomScale) * lerpSpeed * this.step;

        const scale = this.currentZoomScale;

        this.ctx.save();

        // Center zoom on House (Center of screen)
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        // Store center for world coordinate calculations
        this.centerX = centerX;
        this.centerY = centerY;

        this.ctx.translate(centerX, centerY);
        this.ctx.scale(scale, scale);
        this.ctx.translate(-centerX, -centerY);

        // Draw grid
        this.drawGrid();

        // CULLING OPTIMIZATION
        const viewportPadding = 100;
        // Calculate visible world bounds
        // Screen (0,0) -> World
        const viewLeft = centerX - (centerX / scale) - viewportPadding;
        const viewTop = centerY - (centerY / scale) - viewportPadding;
        const viewRight = centerX + ((this.canvas.width - centerX) / scale) + viewportPadding;
        const viewBottom = centerY + ((this.canvas.height - centerY) / scale) + viewportPadding;

        this.entities.forEach(entity => {
            // Simple AABB check
            if (entity.x + entity.radius > viewLeft &&
                entity.x - entity.radius < viewRight &&
                entity.y + entity.radius > viewTop &&
                entity.y - entity.radius < viewBottom) {
                entity.draw(this.ctx);
            }
        });

        // Draw particles in world space
        this.particleSystem.draw(this.ctx);
        
        this.ctx.restore(); // Restore for UI overlay

        // Draw UI elements (Screen Space)
        this.buildMenu.draw(this.ctx);

        // Draw tooltips on top (UI layer)
        this.drawTooltips();

        if (this.house.health <= 0) {
            this.gameState = 'GAMEOVER';
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            this.ctx.fillStyle = 'white';
            this.ctx.font = '48px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = '24px monospace';
            this.ctx.fillText('Click to Restart', this.canvas.width / 2, this.canvas.height / 2 + 50);
        }

        // Tooltip Logic (Needs to handle zoom? Or just draw on top?)
        // Tooltips are UI, so they should be drawn on top of everything, unscaled.
        // BUT, mouse coordinates are screen coordinates.
        // Entity coordinates are world coordinates.
        // If we zoom, the visual position of entities changes.
        // We need to project entity position to screen space to check hover.

        // ... Refined Tooltip Logic ...
        const mouseX = this.input.mouse.x;
        const mouseY = this.input.mouse.y;
        let hoveredEntity = null;

        for (const entity of this.entities) {
             // Culling for tooltip check too!
             if (entity.x + entity.radius < viewLeft || entity.x - entity.radius > viewRight ||
                 entity.y + entity.radius < viewTop || entity.y - entity.radius > viewBottom) {
                 continue;
             }

            // Project entity to screen space
            // World -> Screen: (World - Center) * Scale + Center
            const screenX = (entity.x - centerX) * scale + centerX;
            const screenY = (entity.y - centerY) * scale + centerY;
            const screenRadius = entity.radius * scale;

            const dist = Math.hypot(screenX - mouseX, screenY - mouseY);
            if (dist < screenRadius) {
                hoveredEntity = entity;
                break;
            }
        }

        if (hoveredEntity) {
            let name = hoveredEntity.constructor.name;
            let stats = [];

            if (name === 'Turret') {
                name = hoveredEntity.turretType.charAt(0).toUpperCase() + hoveredEntity.turretType.slice(1) + ' Turret';
                stats.push(`Kills: ${hoveredEntity.killCount}`);
                stats.push(`Damage: ${Math.round(hoveredEntity.damage)}`);
            } else if (name === 'Building') {
                name = hoveredEntity.buildingType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                if (hoveredEntity.generatedCount !== undefined) {
                    stats.push(`Generated: ${hoveredEntity.generatedCount}`);
                }
            } else if (name === 'Resource') {
                name = hoveredEntity.type.charAt(0).toUpperCase() + hoveredEntity.type.slice(1);
            } else if (name === 'Enemy') {
                name = hoveredEntity.enemyType.charAt(0).toUpperCase() + hoveredEntity.enemyType.slice(1);
                stats.push(`HP: ${Math.round(hoveredEntity.health)}/${Math.round(hoveredEntity.maxHealth)}`);
                stats.push(`Speed: ${Math.round(hoveredEntity.speed)}`);
                
                if (hoveredEntity.effects) {
                    if (hoveredEntity.effects.frozen.duration > 0) stats.push(`Frozen (${hoveredEntity.effects.frozen.duration.toFixed(1)}s)`);
                    if (hoveredEntity.effects.burning.duration > 0) stats.push(`Burning (${hoveredEntity.effects.burning.duration.toFixed(1)}s)`);
                    if (hoveredEntity.effects.poisoned.duration > 0) stats.push(`Poisoned (${hoveredEntity.effects.poisoned.duration.toFixed(1)}s)`);
                }
            }

            // Draw Tooltip Box
            const padding = 10;
            const lineHeight = 20;
            this.ctx.font = '14px Arial';
            const nameWidth = this.ctx.measureText(name).width;
            let boxWidth = nameWidth + padding * 2;
            
            // Calculate width based on stats
            stats.forEach(stat => {
                const w = this.ctx.measureText(stat).width;
                if (w + padding * 2 > boxWidth) boxWidth = w + padding * 2;
            });

            const boxHeight = 30 + (stats.length * lineHeight);
            const boxX = mouseX + 15;
            const boxY = mouseY + 15;

            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 1;
            this.ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
            this.ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

            this.ctx.fillStyle = 'white';
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'top';
            this.ctx.fillText(name, boxX + padding, boxY + padding);
            
            // Draw stats
            stats.forEach((stat, index) => {
                this.ctx.fillText(stat, boxX + padding, boxY + padding + 20 + (index * lineHeight));
            });
        }
    }

    drawGrid() {
        this.ctx.strokeStyle = Config.GRID_COLOR;
        this.ctx.lineWidth = 1;
        const gridSize = 50;

        // Optimization: Only draw grid lines that are visible
        const scale = this.currentZoomScale || 1.0;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        const viewLeft = centerX - (centerX / scale);
        const viewTop = centerY - (centerY / scale);
        const viewRight = centerX + ((this.canvas.width - centerX) / scale);
        const viewBottom = centerY + ((this.canvas.height - centerY) / scale);

        // Offset by half grid to align with building placement
        const offset = gridSize / 2;
        const startX = Math.floor((viewLeft - offset) / gridSize) * gridSize + offset;
        const endX = Math.ceil((viewRight - offset) / gridSize) * gridSize + offset;
        const startY = Math.floor((viewTop - offset) / gridSize) * gridSize + offset;
        const endY = Math.ceil((viewBottom - offset) / gridSize) * gridSize + offset;

        for (let x = startX; x <= endX; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, viewTop);
            this.ctx.lineTo(x, viewBottom);
            this.ctx.stroke();
        }

        for (let y = startY; y <= endY; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(viewLeft, y);
            this.ctx.lineTo(viewRight, y);
            this.ctx.stroke();
        }
    }

    drawTooltips() {
        const mouseX = this.input.mouse.x;
        const mouseY = this.input.mouse.y;

        // Transform mouse to world coordinates
        const scale = this.currentZoomScale || 1.0;
        const worldX = (mouseX - (this.canvas.width / 2)) / scale + this.centerX;
        const worldY = (mouseY - (this.canvas.height / 2)) / scale + this.centerY;

        // Check hover on turrets and enemies
        for (const entity of this.entities) {
            const dist = Math.hypot(worldX - entity.x, worldY - entity.y);

            if (entity.constructor.name === 'Turret' && dist < entity.radius + 15) {
                // Draw turret stats in yellow
                const dps = (entity.damage / entity.fireRate).toFixed(1);
                const text = `${entity.turretType.toUpperCase()} | DMG: ${entity.damage} | Rate: ${entity.fireRate.toFixed(2)}s | DPS: ${dps} | Range: ${entity.range}`;

                this.ctx.save();
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
                const textWidth = this.ctx.measureText(text).width + 20;
                this.ctx.fillRect(mouseX + 10, mouseY - 35, Math.min(textWidth, 500), 28);
                this.ctx.fillStyle = '#f1c40f'; // Yellow
                this.ctx.font = 'bold 14px monospace';
                this.ctx.fillText(text, mouseX + 15, mouseY - 14);
                this.ctx.restore();
                return; // Only show one tooltip
            } else if (entity.type === 'enemy' && dist < entity.radius + 15) {
                // Draw enemy HP in red
                const text = `HP: ${Math.ceil(entity.health)}/${Math.ceil(entity.maxHealth)}`;

                this.ctx.save();
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
                this.ctx.fillRect(mouseX + 10, mouseY - 35, 160, 28);
                this.ctx.fillStyle = '#e74c3c'; // Red
                this.ctx.font = 'bold 14px monospace';
                this.ctx.fillText(text, mouseX + 15, mouseY - 14);
                this.ctx.restore();
                return; // Only show one tooltip
            } else if (entity.constructor.name === 'Player' && dist < entity.radius + 15) {
                // Draw player buffs
                const buffs = [];
                if (entity.buffs.attackDamage > 1.0) {
                    buffs.push(`ATK: x${entity.buffs.attackDamage.toFixed(1)}`);
                }
                if (entity.buffs.speed > 1.0) {
                    buffs.push(`SPD: x${entity.buffs.speed.toFixed(1)}`);
                }

                if (buffs.length > 0) {
                    const text = buffs.join(' | ');

                    this.ctx.save();
                    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
                    const textWidth = this.ctx.measureText(text).width + 20;
                    this.ctx.fillRect(mouseX + 10, mouseY - 35, textWidth, 28);
                    this.ctx.fillStyle = '#f39c12'; // Orange
                    this.ctx.font = 'bold 14px monospace';
                    this.ctx.fillText(text, mouseX + 15, mouseY - 14);
                    this.ctx.restore();
                    return;
                }
            }
        }
    }
}
