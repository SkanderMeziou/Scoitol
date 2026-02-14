import { Recipes } from '../game/Recipes.js';
import { Config } from '../game/Config.js';

export class BuildMenu {
    constructor(game) {
        this.game = game;
        this.width = 60; // Collapsed width
        this.expandedWidth = 220;
        this.isExpanded = false;
        this.animSpeed = 10;

        this.categories = ['turret', 'utility'];
        this.activeCategory = 'turret';

        // Prepare items list
        this.items = {
            turret: [],
            utility: []
        };

        for (const [key, recipe] of Object.entries(Recipes)) {
            const item = { ...recipe, id: key };
            if (recipe.type === 'turret') {
                this.items.turret.push(item);
            } else if (recipe.type === 'building' && !key.includes('col') && !key.includes('seed')) {
                this.items.utility.push(item);
            }
        }

        // Sort items by cost (cheap first)
        const getCost = (item) => Object.values(item.cost).reduce((a, b) => a + b, 0);
        this.items.turret.sort((a, b) => getCost(a) - getCost(b));
        this.items.utility.sort((a, b) => getCost(a) - getCost(b));

        this.scrollOffset = 0;
        this.maxScroll = 0;

        // Sort items periodically
        this.lastSortTime = 0;
    }

    update(dt) {
        const mouseX = this.game.input.mouse.x;
        const screenWidth = this.game.canvas.width;

        // Hover expand logic
        if (mouseX > screenWidth - 60) {
            this.isExpanded = true;
        } else if (this.isExpanded && mouseX < screenWidth - this.expandedWidth) {
            this.isExpanded = false;
            this.hoveredItem = null;
        }

        // Animate width
        const targetWidth = this.isExpanded ? this.expandedWidth : 60;
        this.width += (targetWidth - this.width) * this.animSpeed * dt;

        // Update Scroll
        if (this.game.input.wheelDelta !== 0 && this.isExpanded) {
            this.handleScroll(this.game.input.consumeWheel());
        }

        // Update hovered item
        if (this.isExpanded) {
            this.updateHoverState(this.game.input.mouse.x, this.game.input.mouse.y);
        }

        // Periodically sort items
        this.lastSortTime += dt;
        if (this.lastSortTime > 0.5) {
            this.sortItems();
            this.lastSortTime = 0;
        }
    }

    sortItems() {
        if (!this.game.player) return;
        const inventory = this.game.player.inventory;

        const sortFunc = (a, b) => {
            const readyA = this.calculateReadiness(a.cost, inventory);
            const readyB = this.calculateReadiness(b.cost, inventory);
            return readyA - readyB;
        };

        this.items.turret.sort(sortFunc);
        this.items.utility.sort(sortFunc);
    }

    calculateReadiness(cost, inventory) {
        let difficulty = 0;
        for (const [res, amount] of Object.entries(cost)) {
            const owned = inventory[res] || 0;
            if (owned < amount) {
                const missing = amount - owned;
                const hasResource = owned > 0;

                if (hasResource) {
                    difficulty += missing * 1;
                } else {
                    const rarity = Config.MATERIAL_RARITY[res] || 1;
                    difficulty += missing * rarity;
                }
            }
        }
        return difficulty;
    }

    handleScroll(deltaY) {
        this.scrollOffset += deltaY * 0.5;
        this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, this.maxScroll));
    }

    updateHoverState(mouseX, mouseY) {
        const screenWidth = this.game.canvas.width;
        const x = screenWidth - this.width;
        const startY = 100; // Below tabs

        const items = this.items[this.activeCategory];
        let currentY = startY - this.scrollOffset;

        this.hoveredItem = null;

        items.forEach(item => {
            if (currentY + 60 > startY && currentY < this.game.canvas.height) {
                if (mouseX > x && mouseX < screenWidth && mouseY > currentY && mouseY < currentY + 60) {
                    this.hoveredItem = item;
                }
            }
            currentY += 70;
        });
    }

    handleClick(mouseX, mouseY) {
        const screenWidth = this.game.canvas.width;
        if (mouseX < screenWidth - this.width) return false;

        const x = screenWidth - this.width;

        // Tabs
        if (mouseY < 80) {
            if (mouseX > x && mouseX < x + this.width / 2) this.activeCategory = 'turret';
            else this.activeCategory = 'utility';
            this.scrollOffset = 0;
            return true;
        }

        // Items
        if (this.hoveredItem) {
            this.game.player.selectedBuild = this.hoveredItem.id;
            return true;
        }

        return true;
    }

    draw(ctx) {
        const screenWidth = this.game.canvas.width;
        const screenHeight = this.game.canvas.height;
        const x = screenWidth - this.width;

        // Background
        ctx.fillStyle = 'rgba(20, 20, 20, 0.9)';
        ctx.fillRect(x, 0, this.width, screenHeight);

        // Border
        ctx.strokeStyle = '#444';
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, screenHeight); ctx.stroke();

        if (this.width < 100) {
            // Collapsed Icon
            ctx.fillStyle = '#fff';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('⚡', x + 30, 40);
            return;
        }

        // Tabs
        const tabWidth = this.width / 2;

        // Turret Tab
        ctx.fillStyle = this.activeCategory === 'turret' ? '#333' : '#111';
        ctx.fillRect(x, 0, tabWidth, 80);
        ctx.fillStyle = this.activeCategory === 'turret' ? '#f1c40f' : '#777';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⚔️', x + tabWidth / 2, 50); // Sword icon for turrets

        // Utility Tab
        ctx.fillStyle = this.activeCategory === 'utility' ? '#333' : '#111';
        ctx.fillRect(x + tabWidth, 0, tabWidth, 80);
        ctx.fillStyle = this.activeCategory === 'utility' ? '#3498db' : '#777';
        ctx.fillText('⚙️', x + tabWidth * 1.5, 50); // Gear icon

        // Separator
        ctx.strokeStyle = '#555';
        ctx.beginPath(); ctx.moveTo(x, 80); ctx.lineTo(screenWidth, 80); ctx.stroke();

        // Items
        const startY = 100;
        let currentY = startY - this.scrollOffset;
        const items = this.items[this.activeCategory];

        // Calc max scroll
        this.maxScroll = Math.max(0, (items.length * 70) - (screenHeight - startY));

        ctx.save();
        ctx.beginPath(); ctx.rect(x, 80, this.width, screenHeight - 80); ctx.clip();

        items.forEach(item => {
            const isSelected = this.game.player.selectedBuild === item.id;
            const isHovered = this.hoveredItem === item;
            const canAfford = this.game.player.canAfford(item.cost);

            if (currentY > screenHeight || currentY + 60 < 80) {
                currentY += 70;
                return;
            }

            // Item BG
            ctx.fillStyle = isSelected ? '#3a3a3a' : (isHovered ? '#2a2a2a' : 'transparent');
            if (isSelected) ctx.fillStyle = 'rgba(241, 196, 15, 0.2)';
            ctx.fillRect(x + 10, currentY, this.width - 20, 60);

            // Icon Placeholder
            // ctx.fillStyle = isSelected ? '#f1c40f' : '#555';
            if (item.type === 'turret') ctx.fillStyle = '#9b59b6';
            else ctx.fillStyle = '#3498db';

            // Dynamic color
            if (item.subType.includes('wood')) ctx.fillStyle = '#a07f70';
            if (item.subType.includes('stone')) ctx.fillStyle = '#95a5a6';
            if (item.subType.includes('iron')) ctx.fillStyle = '#7f8c8d';
            if (item.subType.includes('money')) ctx.fillStyle = '#f1c40f';

            ctx.beginPath(); ctx.arc(x + 40, currentY + 30, 20, 0, Math.PI * 2); ctx.fill();

            // Name
            ctx.fillStyle = canAfford ? '#fff' : '#e74c3c';
            ctx.textAlign = 'left';
            ctx.font = '14px Arial';
            ctx.fillText(item.subType.replace(/_/g, ' ').toUpperCase(), x + 70, currentY + 25);

            // Cost
            ctx.fillStyle = '#aaa';
            ctx.font = '10px Arial';
            const costStr = Object.entries(item.cost).map(([k, v]) => `${v}${k[0].toUpperCase()}`).join(' ');
            ctx.fillText(costStr, x + 70, currentY + 45);

            currentY += 70;
        });

        ctx.restore();

        // Description Panel (if item selected)
        const selectedId = this.game.player.selectedBuild;
        if (selectedId) {
            const recipe = Recipes[selectedId];
            if (recipe) {
                // Draw panel at bottom center of screen
                const panelW = 400;
                const panelH = 80;
                const panelX = (screenWidth - panelW) / 2;
                const panelY = screenHeight - panelH - 20;

                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.roundRect(panelX, panelY, panelW, panelH, 10);
                ctx.fill();
                ctx.strokeStyle = '#555';
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.fillStyle = '#f1c40f';
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(recipe.subType.replace(/_/g, ' ').toUpperCase(), panelX + panelW / 2, panelY + 25);

                ctx.fillStyle = '#ddd';
                ctx.font = '14px Arial';
                ctx.fillText(recipe.description || "No description available.", panelX + panelW / 2, panelY + 50);
            }
        }
    }
}
