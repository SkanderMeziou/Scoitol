import { Recipes } from './Recipes.js';

export class Encyclopedia {
    constructor(game) {
        this.game = game;
        this.visible = false;
        this.container = document.getElementById('field-guide');
        this.container.innerHTML = `<header><div><p class="eyebrow">A FEW FIELD NOTES</p><h2 id="guide-title">Make your village thrive.</h2></div><button class="quiet-button" aria-label="Close field guide">Close ×</button></header><p>Move with WASD, ZQSD or the arrow keys. On a touchscreen, drag on the left half of the field to move. Get close to trees and rocks to collect resources automatically. Choose a build in the shop, then click or tap the field to place it. Protect the house as long as you can.</p><div class="guide-recipes">${Object.values(Recipes).filter(recipe => Object.keys(recipe.cost).every(key => key in game.player.inventory)).map(recipe => `<article><h3>${recipe.subType.replaceAll('_', ' ')}</h3><p>${recipe.description}</p><small>${Object.entries(recipe.cost).map(([name, amount]) => `${amount} ${name}`).join(' · ')}</small></article>`).join('')}</div>`;
        document.getElementById('guide-button').addEventListener('click', () => this.toggle());
        this.container.querySelector('button').addEventListener('click', () => this.container.close());
        this.container.addEventListener('click', event => {
            if (event.target === this.container) this.container.close();
        });
        this.container.addEventListener('close', () => {
            this.visible = false;
            game.isPaused = this.wasPaused;
            game.input.reset();
        });
    }

    toggle() {
        if (this.visible) { this.container.close(); return; }
        this.wasPaused = this.game.isPaused;
        this.visible = true;
        this.game.isPaused = true;
        this.game.input.reset();
        this.container.showModal();
    }

    update() {}
}
