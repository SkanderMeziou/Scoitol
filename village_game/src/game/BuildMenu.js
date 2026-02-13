export class BuildMenu {
    constructor(player) {
        this.player = player;
        this.lastBuildMode = false; // Track if build mode changed

        this.container = document.createElement('div');
        this.container.id = 'build-menu';
        this.container.style.position = 'fixed'; // Fixed to viewport
        this.container.style.bottom = '0';
        this.container.style.left = '0';
        this.container.style.right = '0';
        this.container.style.width = '100%';
        this.container.style.maxHeight = '200px';
        this.container.style.backgroundColor = 'rgba(30, 30, 30, 0.95)';
        this.container.style.border = '2px solid #444';
        this.container.style.borderBottom = 'none';
        this.container.style.display = 'none'; // Hidden by default
        this.container.style.overflowY = 'auto'; // Vertical scrolling
        this.container.style.overflowX = 'hidden';
        this.container.style.padding = '10px';
        this.container.style.zIndex = '100';
        this.container.style.boxSizing = 'border-box';

        // Inner container for flex layout
        this.innerContainer = document.createElement('div');
        this.innerContainer.style.display = 'flex';
        this.innerContainer.style.flexWrap = 'wrap';
        this.innerContainer.style.gap = '10px';
        this.innerContainer.style.justifyContent = 'flex-start';
        this.innerContainer.style.alignItems = 'flex-start';
        
        this.container.appendChild(this.innerContainer);
        document.getElementById('app').appendChild(this.container);
    }

    update() {
        if (!this.player.buildMode) {
            this.container.style.display = 'none';
            this.lastBuildMode = false;
            return;
        }

        this.container.style.display = 'flex'; // Use flex for proper layout
        this.container.style.flexDirection = 'column';

        // Rebuild menu if build mode was just activated
        if (!this.lastBuildMode || this.innerContainer.children.length === 0) {
            this.renderMenu();
            this.lastBuildMode = true;
        } else {
            this.updateMenuStatus();
        }
    }

    renderMenu() {
        this.innerContainer.innerHTML = '';
        // Sort options: Affordable first
        const options = [...this.player.buildOptions];
        options.sort((a, b) => {
            const aAfford = this.canAfford(a);
            const bAfford = this.canAfford(b);
            if (aAfford === bAfford) return 0;
            return aAfford ? -1 : 1;
        });

        options.forEach(opt => {
            const hasIngredients = this.hasIngredients(opt);
            if (!hasIngredients) return;

            const card = document.createElement('div');
            card.className = 'build-card';
            card.dataset.id = opt.id; // Store ID for updates
            card.style.border = '1px solid #555';
            card.style.borderRadius = '5px';
            card.style.padding = '8px';
            card.style.cursor = 'pointer';
            card.style.color = 'white';
            card.style.fontSize = '12px';
            card.style.textAlign = 'center';
            card.style.transition = 'transform 0.2s ease, background-color 0.2s ease, filter 0.2s ease';
            card.style.filter = 'brightness(1)';
            card.style.minWidth = '120px';
            card.style.maxWidth = '150px';
            card.style.flex = '0 0 auto';

            // Hover effect - scale up and brighten
            card.onmouseenter = () => { 
                card.style.transform = 'scale(1.08)'; 
                card.style.filter = 'brightness(1.2)';
            };
            card.onmouseleave = () => { 
                card.style.transform = 'scale(1)'; 
                card.style.filter = 'brightness(1)';
            };

            // Click to select
            card.onclick = () => {
                this.player.selectedBuild = opt.id;
                this.updateMenuStatus(); // Refresh visuals
            };

            const costStr = [];
            for (const [res, amount] of Object.entries(opt.cost)) {
                costStr.push(`${amount} ${res.charAt(0).toUpperCase() + res.slice(1)}`);
            }

            card.innerHTML = `
            <div style="font-weight:bold; margin-bottom:5px;">${opt.name}</div>
            <div style="font-size:10px; color:#ccc;">${costStr.join('<br>')}</div>
        `;

            this.innerContainer.appendChild(card);
        });

        this.updateMenuStatus();
    }

    updateMenuStatus() {
        // Update colors and borders without rebuilding
        const cards = this.innerContainer.children;
        for (let card of cards) {
            const id = card.dataset.id;
            const opt = this.player.buildOptions.find(o => o.id === id);
            if (!opt) continue;

            const canAfford = this.canAfford(opt);
            card.style.backgroundColor = canAfford ? '#2c3e50' : '#c0392b';
            card.style.border = this.player.selectedBuild === id ? '2px solid #f1c40f' : '1px solid #555';
        }
    }

    canAfford(opt) {
        for (const [res, amount] of Object.entries(opt.cost)) {
            if ((this.player.inventory[res] || 0) < amount) return false;
        }
        return true;
    }

    hasIngredients(opt) {
        // Return true if player has AT LEAST ONE of the required ingredients
        // Only hide if player has ZERO of ALL required ingredients
        for (const [res, amount] of Object.entries(opt.cost)) {
            if (amount > 0 && (this.player.inventory[res] || 0) > 0) {
                return true; // Player has at least some of this ingredient
            }
        }
        return false; // Player has NONE of ANY required ingredients
    }
}
