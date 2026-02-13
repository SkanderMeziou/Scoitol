import { Recipes } from '../game/Recipes.js';
import { Config } from '../game/Config.js';

export class BuildMenu {
    constructor(game) {
        this.game = game;
        this.width = 40; // Collapsed width (approx 1cm)
        this.expandedWidth = 400;
        this.isExpanded = false;
        this.hoverTime = 0;
        this.animSpeed = 10; // Speed of expansion

        this.categories = ['turret', 'building', 'collector', 'seed'];
        this.activeCategory = 'turret';
        
        // Prepare items list from Recipes
        this.items = {};
        for (const [key, recipe] of Object.entries(Recipes)) {
            if (!this.items[recipe.type]) this.items[recipe.type] = [];
            this.items[recipe.type].push({ ...recipe, id: key });
        }
        
        this.lastSortTime = 0;

        // Track hover and click states for animations
        this.hoveredItem = null;
        this.clickedItem = null;
        this.clickAnimTime = 0;
        this.hoveredCategory = null;
        
        // Scrolling support
        this.scrollOffset = 0;
        this.maxScroll = 0;
    }

    update(dt) {
        const mouseX = this.game.input.mouse.x;
        const mouseY = this.game.input.mouse.y;
        const screenWidth = this.game.canvas.width;

        // Check hover
        // Expand if hovering the collapsed strip (right edge)
        if (mouseX > screenWidth - 40) {
            this.isExpanded = true;
        } 
        // Collapse if mouse moves outside the expanded menu area
        else if (this.isExpanded && mouseX < screenWidth - this.expandedWidth) {
            this.isExpanded = false;
            this.hoveredItem = null;
            this.hoveredCategory = null;
            this.scrollOffset = 0; // Reset scroll when collapsed
        }

        // Animate width
        const targetWidth = this.isExpanded ? this.expandedWidth : 40;
        this.width += (targetWidth - this.width) * this.animSpeed * dt;

        // Update click animation
        if (this.clickAnimTime > 0) {
            this.clickAnimTime -= dt * 5; // Fast animation
        }

        // Track hovered item
        if (this.isExpanded && this.width > 100) {
            this.updateHoverState(mouseX, mouseY);
        }
        
        // Sort items periodically (e.g. every 10 frames or 0.2s)
        this.lastSortTime += dt;
        if (this.lastSortTime > 0.5) {
            this.sortItems();
            this.lastSortTime = 0;
        }
    }

    sortItems() {
        const player = this.game.player;
        if (!player) return;

        for (const category of Object.keys(this.items)) {
            this.items[category].sort((a, b) => {
                const readinessA = this.calculateReadiness(a.cost, player.inventory);
                const readinessB = this.calculateReadiness(b.cost, player.inventory);
                return readinessA - readinessB;
            });
        }
    }

    calculateReadiness(cost, inventory) {
        let missingDifficulty = 0;
        for (const [res, amount] of Object.entries(cost)) {
            const owned = inventory[res] || 0;
            if (owned < amount) {
                const missing = amount - owned;
                // If player has SOME, difficulty is 1 per missing unit
                // If player has NONE, difficulty is Rarity * missing unit?
                // User said: "si le joueur a deja la ressource en question mais en pas assez grande quantité, tu conscidere que la difficulté a obtenir est de 1"
                // "par exemple si un truc coute 10 diamant et 10 rubis et que le gars a deja 3 rubis bah tu compte 7 pour les 7 rubis restants + 10 fois la difficulté d'obtention des diamants"
                
                const hasResource = owned > 0; // Has unlocked/found it at least once? Or currently has > 0? "a deja la ressource" implies currently has > 0 usually, or has discovered it. Let's assume > 0.
                
                if (hasResource) {
                    missingDifficulty += missing * 1;
                } else {
                    const rarity = Config.MATERIAL_RARITY[res] || 1;
                    missingDifficulty += missing * rarity;
                }
            }
        }
        return missingDifficulty;
    }

    updateHoverState(mouseX, mouseY) {
        const screenWidth = this.game.canvas.width;
        const x = screenWidth - this.width;
        const padding = 20;
        let currentY = 20;

        // Check category hover
        this.hoveredCategory = null;
        if (mouseY >= currentY - 15 && mouseY <= currentY + 5) {
            if (mouseX >= x + padding && mouseX < x + padding + 70) this.hoveredCategory = 'turret';
            else if (mouseX >= x + padding + 80 && mouseX < x + padding + 170) this.hoveredCategory = 'building';
            else if (mouseX >= x + padding + 180 && mouseX < x + padding + 270) this.hoveredCategory = 'collector';
            else if (mouseX >= x + padding + 280) this.hoveredCategory = 'seed';
        }

        currentY += 40;

        // Check item hover (with scroll offset)
        this.hoveredItem = null;
        const items = this.items[this.activeCategory] || [];
        for (const item of items) {
            const boxHeight = 50;
            const itemY = currentY - this.scrollOffset;
            if (mouseY >= itemY && mouseY <= itemY + boxHeight) {
                if (mouseX >= x + padding && mouseX <= x + this.width - padding) {
                    this.hoveredItem = item.id;
                }
                break;
            }
            currentY += boxHeight + 10;
        }
    }

    draw(ctx) {
        const screenWidth = this.game.canvas.width;
        const screenHeight = this.game.canvas.height;
        const x = screenWidth - this.width;

        // Draw Sidebar Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(x, 0, this.width, screenHeight);
        
        // Draw Border
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, screenHeight);
        ctx.stroke();

        // If collapsed, just show icon or indicator
        if (this.width < 100) {
            ctx.fillStyle = 'white';
            ctx.font = '20px Arial';
            ctx.save();
            ctx.translate(x + 25, screenHeight / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText("BUILD MENU", 0, 0);
            ctx.restore();
            return;
        }

        // Draw Content when expanded
        const padding = 20;
        let currentY = 20;

        // Categories
        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        
        this.categories.forEach(cat => {
            const isSelected = this.activeCategory === cat;
            const isHovered = this.hoveredCategory === cat;
            
            // Apply hover effect
            if (isHovered) {
                ctx.fillStyle = isSelected ? '#ffd700' : '#aaa'; // Brighter on hover
            } else {
                ctx.fillStyle = isSelected ? '#f1c40f' : '#888';
            }
            
            const catX = x + padding + (cat === 'turret' ? 0 : cat === 'building' ? 80 : cat === 'collector' ? 180 : 280);
            
            // Add underline for selected category
            if (isSelected) {
                ctx.save();
                ctx.strokeStyle = '#f1c40f';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(catX, currentY + 5);
                ctx.lineTo(catX + 60, currentY + 5);
                ctx.stroke();
                ctx.restore();
            }
            
            ctx.fillText(cat.toUpperCase(), catX, currentY);
        });

        currentY += 40;
        
        const contentStartY = currentY;

        // Items in active category
        const items = this.items[this.activeCategory] || [];
        
        // Calculate max scroll based on content height
        const itemsHeight = items.length * 60; // 50 box + 10 gap
        const viewportHeight = screenHeight - contentStartY - 20;
        this.maxScroll = Math.max(0, itemsHeight - viewportHeight);
        
        // Clamp scroll offset
        this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, this.maxScroll));
        
        // Enable clipping for scrollable area
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, contentStartY, this.width, viewportHeight);
        ctx.clip();
        
        items.forEach(item => {
            // Item Box
            const boxHeight = 50;
            const itemY = currentY - this.scrollOffset;
            
            // Skip if outside viewport
            if (itemY + boxHeight < contentStartY || itemY > contentStartY + viewportHeight) {
                currentY += boxHeight + 10;
                return;
            }
            
            const isSelected = this.game.player.selectedBuild === item.id;
            const isHovered = this.hoveredItem === item.id;
            const isClicked = this.clickedItem === item.id && this.clickAnimTime > 0;
            
            // Check affordability
            const canAfford = this.game.player.canAfford(item.cost);
            
            // Apply click animation (scale down)
            const scale = isClicked ? 0.95 : 1.0;
            const scaleOffset = (1 - scale) * (this.width - padding * 2) / 2;
            
            ctx.save();
            
            // Background with hover brightness
            let bgAlpha = 0.05;
            if (isSelected) bgAlpha = 0.2;
            if (isHovered) bgAlpha += 0.1; // Brighter on hover
            
            if (canAfford) {
                ctx.fillStyle = isSelected ? `rgba(241, 196, 15, ${bgAlpha})` : `rgba(255, 255, 255, ${bgAlpha})`;
            } else {
                ctx.fillStyle = `rgba(231, 76, 60, ${bgAlpha})`;
            }
            
            // Apply scale for click animation
            ctx.fillRect(
                x + padding + scaleOffset, 
                itemY, 
                (this.width - padding * 2) * scale, 
                boxHeight
            );
            
            // Border with glow effect on hover
            if (isHovered) {
                ctx.shadowBlur = 10;
                ctx.shadowColor = isSelected ? '#f1c40f' : '#fff';
            }
            ctx.strokeStyle = isSelected ? '#f1c40f' : (isHovered ? '#aaa' : '#555');
            ctx.lineWidth = isSelected ? 2 : 1;
            ctx.strokeRect(
                x + padding + scaleOffset, 
                itemY, 
                (this.width - padding * 2) * scale, 
                boxHeight
            );
            ctx.shadowBlur = 0;

            // Icon/Color
            // Draw specific icon based on type
            this.drawItemIcon(ctx, item, x + padding + 5, itemY + 5, 40);

            // Name
            ctx.fillStyle = canAfford ? 'white' : '#e74c3c';
            ctx.font = isHovered ? 'bold 14px Arial' : '14px Arial'; // Bold on hover
            ctx.fillText(item.subType.replace('_', ' ').toUpperCase(), x + padding + 55, itemY + 20);

            // Cost (Simplified)
            ctx.font = '10px Arial';
            ctx.fillStyle = '#aaa';
            let costText = '';
            for (const [res, amount] of Object.entries(item.cost)) {
                costText += `${res.charAt(0).toUpperCase()}:${amount} `;
            }
            ctx.fillText(costText, x + padding + 55, itemY + 40);

            ctx.restore();
            currentY += boxHeight + 10;
        });
        
        ctx.restore(); // Restore clipping
    }
    
    // Helper to handle clicks
    handleClick(mouseX, mouseY) {
        const screenWidth = this.game.canvas.width;
        if (mouseX < screenWidth - this.width) return false; // Not clicking menu

        // Only handle clicks if expanded or clicking the bar to expand (if we add click-to-expand)
        if (!this.isExpanded && this.width < 100) return true; // Consumed but no action

        const padding = 20;
        let currentY = 20;

        // Check Categories
        // Categories are drawn at: x + padding + offsets
        // Simple hitboxes for categories
        const x = screenWidth - this.width;
        
        // Category hitboxes (approximate based on draw)
        if (mouseY >= currentY - 15 && mouseY <= currentY + 5) {
            if (mouseX >= x + padding && mouseX < x + padding + 70) {
                this.activeCategory = 'turret';
                this.clickAnimTime = 1.0;
            }
            else if (mouseX >= x + padding + 80 && mouseX < x + padding + 170) {
                this.activeCategory = 'building';
                this.clickAnimTime = 1.0;
            }
            else if (mouseX >= x + padding + 180 && mouseX < x + padding + 270) {
                this.activeCategory = 'collector';
                this.clickAnimTime = 1.0;
            }
            else if (mouseX >= x + padding + 280) {
                this.activeCategory = 'seed';
                this.clickAnimTime = 1.0;
            }
            return true;
        }

        currentY += 40;

        // Check Items (with scroll offset)
        const items = this.items[this.activeCategory] || [];
        for (const item of items) {
            const boxHeight = 50;
            const itemY = currentY - this.scrollOffset;
            if (mouseY >= itemY && mouseY <= itemY + boxHeight) {
                // Clicked item
                this.game.player.selectedBuild = item.id;
                this.clickedItem = item.id;
                this.clickAnimTime = 1.0;
                return true;
            }
            currentY += boxHeight + 10;
        }
        
        return true; // Click consumed by sidebar background
    }
    
    handleScroll(deltaY) {
        // Handle mouse wheel scrolling
        if (this.isExpanded && this.width > 100) {
            this.scrollOffset += deltaY * 0.5; // Scroll speed
            this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, this.maxScroll));
            return true;
        }
        return false;
    }

    drawItemIcon(ctx, item, x, y, size) {
        ctx.save();
        ctx.translate(x + size/2, y + size/2);
        const scale = size / 40; // Base size 40
        ctx.scale(scale, scale);

        if (item.type === 'turret') {
            // Draw Turret Icon
            let color = '#9b59b6';
            // Match color from Turret.js logic (simplified)
            if (item.subType === 'wood') color = '#a07f70';
            else if (item.subType === 'stone') color = '#95a5a6';
            else if (item.subType === 'iron') color = '#7f8c8d';
            else if (item.subType === 'gold') color = '#ffd700';
            else if (item.subType === 'crystal') color = '#9b59b6';
            else if (item.subType === 'obsidian') color = '#2c3e50';
            else if (item.subType === 'diamond') color = '#3498db';
            else if (item.subType === 'emerald') color = '#27ae60';
            else if (item.subType === 'ruby') color = '#c0392b';
            else if (item.subType === 'sapphire') color = '#2980b9';
            else if (item.subType === 'money') color = '#f1c40f';
            
            ctx.fillStyle = color;
            
            // Shape
            if (item.subType.includes('heavy') || item.subType === 'obsidian') {
                 ctx.fillRect(-10, -10, 20, 20);
            } else if (item.subType.includes('crystal') || item.subType.includes('diamond')) {
                 ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(10, 0); ctx.lineTo(0, 15); ctx.lineTo(-10, 0); ctx.fill();
            } else {
                 ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI*2); ctx.fill();
            }
            
            // Barrel
            ctx.fillStyle = '#444';
            if (item.subType === 'sniper' || item.subType === 'railgun') {
                ctx.fillRect(-2, -18, 4, 18);
            } else if (item.subType === 'shotgun') {
                ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-5, -15); ctx.lineTo(5, -15); ctx.fill();
            } else {
                ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(5, 0); ctx.lineTo(-5, 0); ctx.fill();
            }

        } else if (item.type === 'building') {
            // Generator or Building
            let color = '#3498db';
            if (item.subType.includes('wood')) color = '#2ecc71';
            else if (item.subType.includes('stone')) color = '#95a5a6';
            else if (item.subType.includes('iron')) color = '#7f8c8d';
            else if (item.subType.includes('crystal')) color = '#9b59b6';
            else if (item.subType.includes('gold') || item.subType === 'alchemy') color = '#f1c40f';
            
            ctx.fillStyle = color;
            
            // Hexagon for generators
            if (item.subType.includes('_gen')) {
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI / 3) * i;
                    ctx.lineTo(Math.cos(angle) * 15, Math.sin(angle) * 15);
                }
                ctx.fill();
                // Symbol
                ctx.fillStyle = 'white';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('G', 0, 0);
            } else {
                // Square for others
                ctx.fillRect(-12, -12, 24, 24);
            }

        } else if (item.type === 'collector') {
            // Collector Flag
            let color = '#27ae60';
            if (item.subType.includes('wood')) color = '#27ae60';
            else if (item.subType.includes('stone')) color = '#7f8c8d';
            else if (item.subType.includes('iron')) color = '#34495e';
            else if (item.subType === 'universal_col') color = '#f39c12';
            else if (item.subType === 'collector_novice') color = '#bdc3c7'; // Grey/Silver for novice
            
            // Pole
            ctx.fillStyle = 'white';
            ctx.fillRect(-2, -15, 4, 30);
            // Flag
            ctx.fillStyle = color;
            ctx.fillRect(0, -15, 15, 10);
            
        } else if (item.type === 'seed') {
            // Seed Icon
            let color = '#2ecc71';
            if (item.subType === 'tree') color = '#2ecc71';
            else if (item.subType === 'rock') color = '#95a5a6';
            else if (item.subType === 'iron') color = '#7f8c8d';
            
            ctx.fillStyle = color;
            ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI*2); ctx.fill();
            // Leaf
            ctx.fillStyle = '#27ae60';
            ctx.beginPath(); ctx.ellipse(5, -5, 5, 3, Math.PI/4, 0, Math.PI*2); ctx.fill();
        }

        ctx.restore();
    }
}
