export class Encyclopedia {
    constructor(game) {
        this.game = game;
        this.visible = false;

        this.container = document.createElement('div');
        this.container.id = 'encyclopedia';
        this.container.style.position = 'absolute';
        this.container.style.top = '10%';
        this.container.style.left = '10%';
        this.container.style.width = '80%';
        this.container.style.height = '80%';
        this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
        this.container.style.border = '2px solid #f1c40f';
        this.container.style.borderRadius = '10px';
        this.container.style.display = 'none';
        this.container.style.zIndex = '200';
        this.container.style.padding = '20px';
        this.container.style.color = 'white';
        this.container.style.overflowY = 'auto';
        this.container.style.fontFamily = 'monospace';

        document.getElementById('app').appendChild(this.container);

        // Pause Button
        this.btn = document.createElement('button');
        this.btn.innerText = '⏸ Encyclopedia';
        this.btn.style.position = 'absolute';
        this.btn.style.top = '10px';
        this.btn.style.right = '10px';
        this.btn.style.padding = '10px';
        this.btn.style.zIndex = '150';
        this.btn.onclick = () => this.toggle();
        document.getElementById('app').appendChild(this.btn);
    }

    toggle() {
        this.visible = !this.visible;
        this.container.style.display = this.visible ? 'block' : 'none';
        this.game.isPaused = this.visible;

        if (this.visible) {
            this.renderContent();
        }
    }

    update() {
        // Move button left when sidebar menu is expanded
        const buildMenu = this.game.buildMenu;
        if (buildMenu && buildMenu.width > 100) {
            // Sidebar is expanded, move button to the left
            this.btn.style.right = `${buildMenu.width + 10}px`;
        } else {
            // Sidebar is collapsed, button at normal position
            this.btn.style.right = '10px';
        }
    }

    renderContent() {
        let html = '<h1>Encyclopedia</h1>';
        html += '<p>Click anywhere outside or the button to close.</p>';
        html += '<hr>';

        html += '<h2>Turrets & Buildings</h2>';
        html += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">';

        this.game.player.buildOptions.forEach(opt => {
            const costStr = [];
            for (const [res, amount] of Object.entries(opt.cost)) {
                costStr.push(`${amount} ${res}`);
            }

            html += `
            <div style="border: 1px solid #555; padding: 10px; border-radius: 5px;">
                <strong style="color: #f1c40f;">${opt.name}</strong><br>
                <small>${opt.type} - ${opt.subType}</small><br>
                <div style="margin-top: 5px; color: #ccc;">Cost: ${costStr.join(', ')}</div>
            </div>
        `;
        });

        html += '</div>';
        this.container.innerHTML = html;
    }
}
