import { Recipes } from '../game/Recipes.js';

export class BuildMenu {
    constructor(game) {
        this.game = game;
        this.activeCategory = 'turret';
        this.container = document.getElementById('shop');
        this.container.innerHTML = `
            <div class="shop-tabs" role="group" aria-label="Building category"><button data-category="turret" aria-pressed="true">Defenses</button><button data-category="building" aria-pressed="false">Production</button></div>
            <div class="shop-list" tabindex="0" aria-label="Available buildings"></div>`;
        this.list = this.container.querySelector('.shop-list');
        this.buttons = new Map();
        this.container.querySelectorAll('[data-category]').forEach(button => {
            button.addEventListener('click', () => {
                this.activeCategory = button.dataset.category;
                this.container.querySelectorAll('[data-category]').forEach(tab =>
                    tab.setAttribute('aria-pressed', String(tab === button)));
                this.renderItems();
            });
        });
        this.renderItems();
    }

    renderItems() {
        this.list.replaceChildren();
        this.buttons.clear();
        // Stable ordering keeps cards from moving under the pointer while gathering.
        const items = Object.entries(Recipes)
            .filter(([, recipe]) => recipe.type === this.activeCategory &&
                Object.keys(recipe.cost).every(resource => resource in this.game.player.inventory))
            .sort((a, b) => a[1].craftDifficulty - b[1].craftDifficulty);
        for (const [id, recipe] of items) {
            const button = document.createElement('button');
            button.className = 'shop-item';
            const name = recipe.subType.replaceAll('_', ' ');
            const material = Object.keys(recipe.cost)[0];
            button.innerHTML = `<span class="item-top"><span class="item-icon material-${material}" aria-hidden="true">${recipe.type === 'turret' ? '⌖' : '▧'}</span><span class="item-name">${name}</span><span class="item-check" aria-hidden="true">✓</span></span><span class="item-description">${recipe.description}</span><span class="item-cost">${Object.entries(recipe.cost).map(([resource, amount]) => `<span data-resource="${resource}">${amount} ${resource}</span>`).join('')}</span>`;
            button.addEventListener('click', () => {
                this.game.player.selectedBuild = id;
                this.game.input.mouse.left = false;
                this.update();
            });
            this.list.appendChild(button);
            this.buttons.set(id, button);
        }
        this.lastState = null;
        this.list.scrollTop = 0;
        this.update();
    }

    update() {
        const state = `${this.game.player.selectedBuild}:${Object.values(this.game.player.inventory).join(',')}`;
        if (state === this.lastState) return;
        this.lastState = state;
        for (const [id, button] of this.buttons) {
            const recipe = Recipes[id];
            const selected = this.game.player.selectedBuild === id;
            button.setAttribute('aria-pressed', String(selected));
            button.classList.toggle('is-selected', selected);
            button.classList.toggle('is-affordable', this.game.player.canAfford(recipe.cost));
            button.querySelectorAll('[data-resource]').forEach(cost => {
                const resource = cost.dataset.resource;
                cost.classList.toggle('is-missing', this.game.player.inventory[resource] < recipe.cost[resource]);
            });
        }
    }
}
