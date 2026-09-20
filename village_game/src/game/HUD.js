const symbols = { wood: '▥', stone: '⬡', gold: '●', iron: '▪', crystal: '◇', obsidian: '◆', diamond: '◇', emerald: '◆', ruby: '◆', sapphire: '◆' };

export class HUD {
    constructor(player) {
        this.player = player;
        this.div = document.getElementById('hud');
        this.div.innerHTML = `<div class="wave-status"><span class="status-dot"></span><strong id="wave-label">Wave 01</strong><span id="wave-timer"></span></div><div class="village-health"><span>HP</span><meter min="0" max="2000" value="2000" aria-label="Village health"></meter><strong id="health-label">100%</strong></div><div class="inventory" aria-label="Resources">${Object.entries(player.inventory).map(([name]) => `<div class="resource-chip" data-resource="${name}" title="${name}"><span class="resource-symbol material-${name}">${symbols[name]}</span><span class="resource-name">${name}</span><strong>0</strong><small></small></div>`).join('')}</div>`;
        this.updateCounter = 0;
        this.notificationTimer = 0;
    }

    showNotification(message, duration = 3) {
        document.getElementById('notification').textContent = message;
        this.notificationTimer = duration;
    }

    update() {
        if (this.notificationTimer > 0) {
            this.notificationTimer -= 1 / 60;
            if (this.notificationTimer <= 0) document.getElementById('notification').textContent = '';
        }
        if (this.updateCounter++ % 5 !== 0) return;
        const game = this.player.game;
        this.div.querySelector('#wave-label').textContent = `Wave ${String(game.wave).padStart(2, '0')}`;
        this.div.querySelector('#wave-timer').textContent = `${Math.ceil(game.waveTimer)}s`;
        const health = Math.max(0, game.house.health);
        const meter = this.div.querySelector('meter');
        meter.max = game.house.maxHealth;
        meter.value = health;
        this.div.querySelector('#health-label').textContent = `${Math.ceil(health / game.house.maxHealth * 100)}%`;
        this.div.querySelectorAll('[data-resource]').forEach(chip => {
            const name = chip.dataset.resource;
            const amount = this.player.inventory[name];
            chip.hidden = !['wood', 'stone', 'gold'].includes(name) && amount === 0;
            chip.querySelector('strong').textContent = amount;
            const delta = this.player.resourceDeltas[name] || 0;
            chip.querySelector('small').textContent = delta ? `${delta > 0 ? '+' : ''}${delta}` : '';
        });
    }
}
