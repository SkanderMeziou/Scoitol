
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
import { ARENA_WIDTH, ARENA_HEIGHT, constrainToArena, arenaPath } from './Arena.js';


export class Game {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        document.getElementById('arena').prepend(this.canvas);
        this.canvas.setAttribute('aria-label', 'Village Defense playing field');

        this.resize();

        this.input = new Input(this.canvas);
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
            const { x, y } = this.resourcePosition();
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
        this.worldSize = ARENA_WIDTH;

        this.shakeDuration = 0;
        this.shakeIntensity = 0;
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        this.isRunning = false;
    }

    resize() {
        this.canvas.width = ARENA_WIDTH;
        this.canvas.height = ARENA_HEIGHT;
    }

    start() {
        this.isRunning = true;
        this.lastTime = performance.now();

        const overlay = document.getElementById('game-overlay');
        document.getElementById('start-button').addEventListener('click', () => {
            if (this.gameState === 'GAMEOVER') {
                location.reload();
                return;
            }
            this.gameState = 'PLAYING';
            this.isPaused = false;
            this.input.reset();
            overlay.hidden = true;
            document.getElementById('pause-button').textContent = 'Ⅱ Pause';
            document.getElementById('pause-button').setAttribute('aria-label', 'Pause game');
        });
        document.getElementById('pause-button').addEventListener('click', () => {
            if (this.gameState !== 'PLAYING' || this.encyclopedia.visible) return;
            this.isPaused = !this.isPaused;
            this.input.reset();
            overlay.hidden = !this.isPaused;
            overlay.querySelector('h2').hidden = false;
            overlay.querySelector('h2').textContent = 'Paused';
            overlay.querySelector('p').hidden = true;
            document.getElementById('start-button').textContent = 'Resume';
            document.getElementById('pause-button').textContent = this.isPaused ? '▶ Resume' : 'Ⅱ Pause';
            document.getElementById('pause-button').setAttribute('aria-label', this.isPaused ? 'Resume game' : 'Pause game');
        });
        this.hud.update();

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
        const side = Math.floor(Math.random() * 4);
        const edgeX = side === 0 ? 0 : side === 1 ? ARENA_WIDTH : Math.random() * ARENA_WIDTH;
        const edgeY = side === 2 ? 0 : side === 3 ? ARENA_HEIGHT : Math.random() * ARENA_HEIGHT;
        const { x, y } = constrainToArena(edgeX, edgeY, 30);

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
        const { x, y } = this.resourcePosition();

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

    resourcePosition() {
        let point;
        do {
            point = constrainToArena(45 + Math.random() * (ARENA_WIDTH - 90),
                45 + Math.random() * (ARENA_HEIGHT - 90), 45);
        } while (Math.hypot(point.x - ARENA_WIDTH / 2, point.y - ARENA_HEIGHT / 2) < 110);
        return point;
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        arenaPath(this.ctx);
        this.ctx.clip();
        this.ctx.fillStyle = '#cadbb5';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        // Shake the world inside its fixed clip; keep the UI and pointer coordinates steady.
        this.ctx.save();
        if (this.shakeDuration > 0 && this.gameState === 'PLAYING' && !this.isPaused && !this.reducedMotion?.matches) {
            this.ctx.translate(
                (Math.random() - 0.5) * this.shakeIntensity,
                (Math.random() - 0.5) * this.shakeIntensity
            );
        }
        this.drawGrid();
        this.entities.forEach(entity => entity.draw(this.ctx));
        this.particleSystem.draw(this.ctx);
        this.ctx.restore();
        if (this.gameState === 'PLAYING') this.drawTooltips();
        if (this.input.joystick) this.input.joystick.draw(this.ctx);
        this.ctx.restore();

        if (this.house.health <= 0 && this.gameState !== 'GAMEOVER') {
            this.gameState = 'GAMEOVER';
            this.input.reset();
            const overlay = document.getElementById('game-overlay');
            overlay.hidden = false;
            overlay.querySelector('h2').hidden = false;
            overlay.querySelector('h2').textContent = 'Game over';
            overlay.querySelector('p').hidden = false;
            overlay.querySelector('p').textContent = `Wave ${this.wave}`;
            document.getElementById('start-button').textContent = 'Play again';
            this.hud.update();
        }
    }

    drawGrid() {
        this.ctx.strokeStyle = '#bed0a9';
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
        if (!this.input.mouse.inside) return;
        const { x, y } = this.input.mouse;
        const entity = this.entities.find(entity =>
            ['turret', 'enemy'].includes(entity.type) && Math.hypot(x - entity.x, y - entity.y) < entity.radius + 15);
        if (!entity) return;
        const title = entity.type === 'turret' ? entity.turretType.replaceAll('_', ' ') : 'Incoming enemy';
        const detail = entity.type === 'turret'
            ? `Damage ${entity.damage}  ·  ${(entity.damage / entity.fireRate).toFixed(1)} DPS  ·  Range ${entity.range}`
            : `Health ${Math.ceil(entity.health)} / ${Math.ceil(entity.maxHealth)}`;
        this.ctx.save();
        this.ctx.font = '13px Arial';
        const width = Math.max(this.ctx.measureText(title).width, this.ctx.measureText(detail).width) + 28;
        const left = Math.max(30, Math.min(x + 18, ARENA_WIDTH - width - 30));
        const top = Math.max(30, Math.min(y - 76, ARENA_HEIGHT - 92));
        this.ctx.fillStyle = 'rgba(45, 48, 46, 0.18)';
        this.ctx.beginPath();
        this.ctx.roundRect(left, top + 4, width, 60, 14);
        this.ctx.fill();
        this.ctx.fillStyle = '#f7f6f0';
        this.ctx.beginPath();
        this.ctx.roundRect(left, top, width, 60, 14);
        this.ctx.fill();
        this.ctx.fillStyle = '#31533d';
        this.ctx.textAlign = 'left';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillText(title, left + 14, top + 23);
        this.ctx.font = '13px Arial';
        this.ctx.fillStyle = '#738068';
        this.ctx.fillText(detail, left + 14, top + 43);
        this.ctx.restore();
    }

    screenShake(intensity, duration) {
        // A small kill effect must not overwrite a stronger damage impact.
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
        this.shakeDuration = Math.max(this.shakeDuration, duration);
    }
}
