
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

        this.house = new House(centerX, centerY, this);
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

        this.enemies = [];
        this.turrets = [];
        this.resources = [];
        this.buildings = [];

        // Spawn resources
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 200 + Math.random() * 400;
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

        this.gameState = 'START';
        this.wave = 1;
        this.waveTimer = Config.WAVE_TIMER;
        this.spawnTimer = Config.SPAWN_TIMER_START;

        // Resource spawning
        this.resourceSpawnTimer = Config.RESOURCE_SPAWN_TIMER;

        // World Boundaries
        this.worldSize = Config.WORLD_SIZE;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        this.shakeDuration = 0;
        this.shakeIntensity = 0;
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
        // Update Screen Shake
        if (this.shakeDuration > 0) {
            this.shakeDuration -= dt;
            if (this.shakeDuration <= 0) {
                this.shakeDuration = 0;
                this.shakeIntensity = 0;
            }
        }

        // Wave System
        this.waveTimer -= dt;
        if (this.waveTimer <= 0) {
            this.wave++;
            this.waveTimer = Config.WAVE_TIMER;
            this.house.health = Math.min(this.house.maxHealth, this.house.health + 100);
        }

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
        this.enemies = this.entities.filter(e => e.type === 'enemy');
        this.turrets = this.entities.filter(e => e.type === 'turret');
        this.resources = this.entities.filter(e => e.type === 'resource');
        this.buildings = this.entities.filter(e => e.type === 'building');

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
        if (entity.enemyType) this.enemies.push(entity);
        if (entity.type === 'turret') this.turrets.push(entity);
        if (entity.type === 'resource') this.resources.push(entity);
        if (entity.type === 'building') this.buildings.push(entity);
    }

    handleEntityDeath(entity) {
        // Particle Effects
        if (entity.type === 'resource') {
            this.particleSystem.createExplosion(entity.x, entity.y, entity.color || '#8e44ad', 12, 4);
        }
        if (entity.type === 'enemy') {
            this.particleSystem.createExplosion(entity.x, entity.y, '#c0392b', 20, 6);
            this.screenShake(2, 0.2); // Small shake on enemy death

            if (entity.lastHitSource && entity.lastHitSource.turretType === 'money') {

                const types = ['wood', 'stone', 'iron', 'crystal'];
                const type = types[Math.floor(Math.random() * types.length)];
                const amount = 5;
                this.player.inventory[type] = (this.player.inventory[type] || 0) + amount;
                this.player.addResourceDelta(type, amount);
            }
        }

        if (entity.resourceType === 'tree') {
            this.player.inventory.wood += 5;
            this.player.addResourceDelta('wood', 5);
        }
        if (entity.resourceType === 'rock') {
            this.player.inventory.stone += 5;
            this.player.addResourceDelta('stone', 5);
        }
        // New Resources
        if (entity.resourceType === 'iron') {
            this.player.inventory.iron += 2;
            this.player.addResourceDelta('iron', 2);
        }
        if (entity.resourceType === 'crystal') {
            this.player.inventory.crystal += 2;
            this.player.addResourceDelta('crystal', 2);
        }
        if (entity.resourceType === 'obsidian') {
            this.player.inventory.obsidian += 2;
            this.player.addResourceDelta('obsidian', 2);
        }
        if (entity.resourceType === 'diamond') {
            this.player.inventory.diamond += 1;
            this.player.addResourceDelta('diamond', 1);
        }
        if (entity.resourceType === 'emerald') {
            this.player.inventory.emerald += 1;
            this.player.addResourceDelta('emerald', 1);
        }
        if (entity.resourceType === 'ruby') {
            this.player.inventory.ruby += 1;
            this.player.addResourceDelta('ruby', 1);
        }
        if (entity.resourceType === 'sapphire') {
            this.player.inventory.sapphire += 1;
            this.player.addResourceDelta('sapphire', 1);
        }
    }

    spawnEnemy() {
        const angle = Math.random() * Math.PI * 2;
        // Adjust spawn distance based on zoom
        const baseDistance = Math.max(this.canvas.width, this.canvas.height) / 2 + 100;

        const zoomFactor = this.currentZoomScale || 1.0;
        const dist = baseDistance / zoomFactor;

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const x = centerX + Math.cos(angle) * dist;
        const y = centerY + Math.sin(angle) * dist;

        if (!this.currentRoundType || this.currentRoundWave !== this.wave) {
            this.currentRoundWave = this.wave;
            // Pick a round type based on weights
            const totalWeight = WaveConfig.rounds.reduce((sum, r) => sum + r.weight, 0);
            let random = Math.random() * totalWeight;
            for (const round of WaveConfig.rounds) {
                random -= round.weight;
                if (random <= 0) {
                    this.currentRoundType = round;
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

        // Apply power variance formula
        const t = Math.random();
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
            const power = Math.pow(4, i);
            const x = startX + i * 60;
            const y = startY;

            const enemy = new Enemy(x, y, 'normal', this.house, power);
            enemy.speed = 0;
            enemy.update = function () { }; // Freeze update
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

        if (rand > 0.4) type = 'rock';
        if (this.wave >= 2 && rand > 0.7) type = 'iron';
        if (this.wave >= 3 && rand > 0.8) type = 'crystal';
        if (this.wave >= 4 && rand > 0.85) type = 'obsidian';

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
                "- Build menu on the right border",
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
        const buildingCount = this.turrets.length + this.buildings.length;

        let targetScale = 1.0;
        if (buildingCount > 20) {
            const progress = Math.min(1.0, (buildingCount - 20) / 80);
            const curve = Math.sqrt(progress);
            targetScale = 1.0 - (curve * 0.5);
        }

        // Smooth zoom transition
        if (!this.currentZoomScale) this.currentZoomScale = targetScale;
        const lerpSpeed = 2.0;
        this.currentZoomScale += (targetScale - this.currentZoomScale) * lerpSpeed * this.step;

        const scale = this.currentZoomScale;

        this.ctx.save();

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        this.centerX = centerX;
        this.centerY = centerY;

        this.ctx.translate(centerX, centerY);

        // Apply Screen Shake
        if (this.shakeDuration > 0) {
            const dx = (Math.random() - 0.5) * this.shakeIntensity;
            const dy = (Math.random() - 0.5) * this.shakeIntensity;
            this.ctx.translate(dx, dy);
        }

        this.ctx.scale(scale, scale);
        this.ctx.translate(-centerX, -centerY);

        this.drawGrid();

        // CULLING OPTIMIZATION
        const viewportPadding = 100;
        const viewLeft = centerX - (centerX / scale) - viewportPadding;
        const viewTop = centerY - (centerY / scale) - viewportPadding;
        const viewRight = centerX + ((this.canvas.width - centerX) / scale) + viewportPadding;
        const viewBottom = centerY + ((this.canvas.height - centerY) / scale) + viewportPadding;

        this.entities.forEach(entity => {
            if (entity.x + entity.radius > viewLeft &&
                entity.x - entity.radius < viewRight &&
                entity.y + entity.radius > viewTop &&
                entity.y - entity.radius < viewBottom) {
                entity.draw(this.ctx);
            }
        });

        this.particleSystem.draw(this.ctx);

        this.ctx.restore();

        // Draw UI
        this.buildMenu.draw(this.ctx);
        this.drawTooltips();

        if (this.input.joystick) {
            this.input.joystick.draw(this.ctx);
        }

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
    }

    drawGrid() {
        this.ctx.strokeStyle = Config.GRID_COLOR;
        this.ctx.lineWidth = 1;
        const gridSize = 50;

        const scale = this.currentZoomScale || 1.0;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        const viewLeft = centerX - (centerX / scale);
        const viewTop = centerY - (centerY / scale);
        const viewRight = centerX + ((this.canvas.width - centerX) / scale);
        const viewBottom = centerY + ((this.canvas.height - centerY) / scale);

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

        const scale = this.currentZoomScale || 1.0;
        const worldX = (mouseX - (this.canvas.width / 2)) / scale + this.centerX;
        const worldY = (mouseY - (this.canvas.height / 2)) / scale + this.centerY;

        for (const entity of this.entities) {
            const dist = Math.hypot(worldX - entity.x, worldY - entity.y);

            if (entity.type === 'turret' && dist < entity.radius + 15) {
                const dps = (entity.damage / entity.fireRate).toFixed(1);
                const text = `${entity.turretType.toUpperCase()} | DMG: ${entity.damage} | Rate: ${entity.fireRate.toFixed(2)}s | DPS: ${dps} | Range: ${entity.range}`;

                this.ctx.save();
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
                const textWidth = this.ctx.measureText(text).width + 20;
                this.ctx.fillRect(mouseX + 10, mouseY - 35, Math.min(textWidth, 500), 28);
                this.ctx.fillStyle = '#f1c40f';
                this.ctx.font = 'bold 14px monospace';
                this.ctx.fillText(text, mouseX + 15, mouseY - 14);
                this.ctx.restore();
                return;
            } else if (entity.type === 'enemy' && dist < entity.radius + 15) {
                const text = `HP: ${Math.ceil(entity.health)}/${Math.ceil(entity.maxHealth)}`;

                this.ctx.save();
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
                this.ctx.fillRect(mouseX + 10, mouseY - 35, 160, 28);
                this.ctx.fillStyle = '#e74c3c';
                this.ctx.font = 'bold 14px monospace';
                this.ctx.fillText(text, mouseX + 15, mouseY - 14);
                this.ctx.restore();
                return;
            } else if (entity.type === 'player' && dist < entity.radius + 15) {
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
                    this.ctx.fillStyle = '#f39c12';
                    this.ctx.font = 'bold 14px monospace';
                    this.ctx.fillText(text, mouseX + 15, mouseY - 14);
                    this.ctx.restore();
                    return;
                }
            }
        }
    }

    screenShake(intensity, duration) {
        this.shakeIntensity = intensity;
        this.shakeDuration = duration;
    }
}
