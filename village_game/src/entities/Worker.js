import { Entity } from './Entity.js';

export class Worker extends Entity {
    constructor(x, y, post, type) {
        super(x, y, 8, '#ecf0f1'); // Small white circle
        this.post = post;
        this.resourceType = type; // 'tree', 'rock', 'iron', or 'all'
        this.inventory = 0;
        this.inventoryByType = {}; // For 'all' type workers
        this.maxInventory = 3;
        this.state = 'IDLE'; // IDLE, GATHERING, RETURNING
        this.target = null;
        this.speed = 100;
    }

    update(dt, entities) {
        if (this.state === 'IDLE') {
            // Find resource
            if (this.inventory < this.maxInventory) {
                this.findResource(entities);
            } else {
                this.state = 'RETURNING';
            }
        } else if (this.state === 'GATHERING') {
            if (!this.target || this.target.markedForDeletion) {
                this.state = 'IDLE';
                return;
            }

            const dist = Math.hypot(this.target.x - this.x, this.target.y - this.y);
            if (dist < 20) {
                // Harvest
                if (this.target.takeDamage) this.target.takeDamage(10); // Fast harvest
                
                // Track by type if universal collector
                if (this.resourceType === 'all') {
                    const resType = this.target.type;
                    this.inventoryByType[resType] = (this.inventoryByType[resType] || 0) + 1;
                }
                
                this.inventory++;
                this.state = 'IDLE'; // Look for next or return
            } else {
                this.moveTowards(this.target, dt);
            }
        } else if (this.state === 'RETURNING') {
            const dist = Math.hypot(this.post.x - this.x, this.post.y - this.y);
            if (dist < 20) {
                // Deposit
                // We need to find the player to give resources... 
                // Or the Post handles it? Let's say the Post handles it when Worker touches it.
                // But Worker needs access to Player. 
                // Let's assume the Game loop handles "Worker deposited" or we pass Player to update?
                // For simplicity, let's find Player in entities.
                const player = entities.find(e => e.constructor.name === 'Player');
                if (player) {
                    if (this.resourceType === 'all') {
                        // Deposit all collected resources
                        for (const [resType, amount] of Object.entries(this.inventoryByType)) {
                            if (resType === 'tree') {
                                player.inventory.wood += amount;
                                player.addResourceDelta('wood', amount);
                            } else if (resType === 'rock') {
                                player.inventory.stone += amount;
                                player.addResourceDelta('stone', amount);
                            } else if (resType === 'iron') {
                                player.inventory.iron += amount;
                                player.addResourceDelta('iron', amount);
                            } else if (resType === 'crystal') {
                                player.inventory.crystal += amount;
                                player.addResourceDelta('crystal', amount);
                            } else if (resType === 'obsidian') {
                                player.inventory.obsidian += amount;
                                player.addResourceDelta('obsidian', amount);
                            } else if (resType === 'diamond') {
                                player.inventory.diamond += amount;
                                player.addResourceDelta('diamond', amount);
                            } else if (resType === 'emerald') {
                                player.inventory.emerald += amount;
                                player.addResourceDelta('emerald', amount);
                            } else if (resType === 'ruby') {
                                player.inventory.ruby += amount;
                                player.addResourceDelta('ruby', amount);
                            } else if (resType === 'sapphire') {
                                player.inventory.sapphire += amount;
                                player.addResourceDelta('sapphire', amount);
                            }
                        }
                        this.inventoryByType = {};
                    } else {
                        // Single resource type
                        if (this.resourceType === 'tree') {
                            player.inventory.wood += this.inventory;
                            player.addResourceDelta('wood', this.inventory);
                        }
                        if (this.resourceType === 'rock') {
                            player.inventory.stone += this.inventory;
                            player.addResourceDelta('stone', this.inventory);
                        }
                        if (this.resourceType === 'iron') {
                            player.inventory.iron += this.inventory;
                            player.addResourceDelta('iron', this.inventory);
                        }
                    }
                    this.inventory = 0;
                    this.state = 'IDLE';
                }
            } else {
                this.moveTowards(this.post, dt);
            }
        }
    }

    findResource(entities) {
        let nearest = null;
        let minDist = 300; // Max range from Post (flag)

        for (const entity of entities) {
            // For 'all' type, collect any resource. Otherwise, only collect matching type
            const isMatch = this.resourceType === 'all' 
                ? entity.constructor.name === 'Resource'
                : (entity.constructor.name === 'Resource' && entity.type === this.resourceType);
                
            if (isMatch) {
                const distToPost = Math.hypot(entity.x - this.post.x, entity.y - this.post.y);
                if (distToPost < minDist) {
                    // Check if closest to worker
                    const dist = Math.hypot(entity.x - this.x, entity.y - this.y);
                    if (!nearest || dist < Math.hypot(nearest.x - this.x, nearest.y - this.y)) {
                        nearest = entity;
                    }
                }
            }
        }

        if (nearest) {
            this.target = nearest;
            this.state = 'GATHERING';
        } else {
            // No resource found, return to post
            this.state = 'RETURNING';
        }
    }

    moveTowards(target, dt) {
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 0) {
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();

        // Draw inventory indicator
        if (this.inventory > 0) {
            ctx.fillStyle = 'black';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.inventory, this.x, this.y + 3);
        }
    }
}
