export class HUD {
  constructor(player) {
    this.player = player;
    this.div = document.createElement('div');
    this.div.id = 'hud';
    this.div.style.position = 'absolute';
    this.div.style.top = '10px';
    this.div.style.left = '10px';
    this.div.style.color = 'white';
    this.div.style.fontFamily = 'monospace';
    this.div.style.fontSize = '14px';
    document.getElementById('app').appendChild(this.div);

    this.lastInventory = null;
    this.updateCounter = 0;
    
    this.notification = null;
    this.notificationTimer = 0;
  }

  showNotification(message, duration = 3) {
      this.notification = message;
      this.notificationTimer = duration;
  }

  update() {
    // Only update HUD every 5 frames to save performance, unless there are deltas
    this.updateCounter++;
    const hasDeltas = Object.keys(this.player.resourceDeltas).length > 0;

    if (!hasDeltas && this.updateCounter % 5 !== 0 && this.notificationTimer <= 0) {
      return; // Skip update
    }
    
    if (this.notificationTimer > 0) {
        this.notificationTimer -= 0.1; // Approx dt since called every frame? No, update is called in Game loop with dt?
        // Wait, HUD.update() in Game.js is called without dt?
        // Game.js line 204: this.hud.update();
        // It's called every frame. Let's assume 60fps, so subtract 1/60.
        this.notificationTimer -= 1/60;
        if (this.notificationTimer <= 0) this.notification = null;
    }

    const formatResource = (name, amount) => {
      const delta = this.player.resourceDeltas[name.toLowerCase()] || 0;
      const timer = this.player.deltaTimers[name.toLowerCase()] || 0;
      const opacity = Math.min(1, timer / 2.0);

      let deltaHTML = '';
      if (delta !== 0) {
        const color = delta > 0 ? '#2ecc71' : '#e74c3c';
        const sign = delta > 0 ? '+' : '';
        deltaHTML = ` <span style="color: ${color}; opacity: ${opacity}; margin-left: 5px;">${sign}${delta}</span>`;
      }

      return `${name}: ${amount}${deltaHTML}`;
    };

    this.div.innerHTML = `
      <div style="font-size: 18px; color: #e74c3c; margin-bottom: 10px;">
        <strong>Wave ${this.player.game.wave}</strong> (${Math.ceil(this.player.game.waveTimer)}s)
      </div>
      ${this.notification ? `<div style="background: rgba(0,0,0,0.7); color: #f1c40f; padding: 5px; margin-bottom: 10px; border-radius: 4px;">${this.notification}</div>` : ''}
      <div><strong>Inventory</strong></div>
      ${formatResource('Wood', this.player.inventory.wood)}<br>
      ${formatResource('Stone', this.player.inventory.stone)}<br>
      ${formatResource('Gold', this.player.inventory.gold)}<br>
      <div style="margin-top: 5px; color: #9b59b6;">
        ${formatResource('Iron', this.player.inventory.iron || 0)}<br>
        ${formatResource('Crystal', this.player.inventory.crystal || 0)}<br>
        ${formatResource('Obsidian', this.player.inventory.obsidian || 0)}<br>
      </div>
      <div style="margin-top: 5px; color: #3498db;">
        ${formatResource('Diamond', this.player.inventory.diamond || 0)}<br>
        ${formatResource('Emerald', this.player.inventory.emerald || 0)}<br>
        ${formatResource('Ruby', this.player.inventory.ruby || 0)}<br>
        ${formatResource('Sapphire', this.player.inventory.sapphire || 0)}
      </div>
      <div style="margin-top: 10px;">
        ${this.player.buildMode ? '<strong style="color: #2ecc71;">BUILD MODE ACTIVE</strong>' : 'Press \'B\' to Build'}
      </div>
    `;
  }
}
