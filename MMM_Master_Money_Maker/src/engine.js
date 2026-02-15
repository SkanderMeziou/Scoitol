export class Item {
    constructor(name, baseValue, utility, owners, reputation) {
        this.id = Math.random().toString(36).substr(2, 9);
        this.name = name;
        this.value = baseValue;
        this.utility = utility;
        this.owners = owners;
        this.reputation = reputation;
        this.history = [baseValue];
        this.quantity = 1;
        this.lastDemand = 0;
        this.lastSupply = 0;
    }

    generateForecast(turns = 30) {
        // Clone current state
        const forecast = [this.value];
        let simValue = this.value;
        let simRep = this.reputation;
        let simUtility = this.utility;
        let simOwners = this.owners;

        for (let i = 0; i < turns; i++) {
            // Update reputation
            const term = Math.pow(simRep, 3) + simUtility - simOwners;
            simRep = Math.cbrt(term);

            // Generate demand/supply
            const X = Math.random();
            const X2 = Math.random();
            const demand = 1 + X * Math.pow(1.01, simRep);
            const supply = 1 + X2 * Math.pow(1.01, -simRep);

            // Update value
            simValue = simValue * (demand / supply);
            if (simValue < 0.01) simValue = 0.01;

            forecast.push(simValue);
        }

        return forecast;
    }

    update() {
        // Demand & Supply
        const X = Math.random();
        const X2 = Math.random();

        this.lastDemand = 1 + X * Math.pow(1.01, this.reputation);
        this.lastSupply = 1 + X2 * Math.pow(1.01, -this.reputation);

        // Update owners based on supply/demand
        const oldOwners = this.owners;
        if (this.lastDemand > this.lastSupply) {
            this.owners += 1;
        } else if (this.lastSupply > this.lastDemand) {
            this.owners -= 1;
        }

        if (this.owners < 0) this.owners = 0;

        let k = 0;
        if (this.history.length >= 3) {
            const threeTurnsAgo = this.history[this.history.length - 3];
            const currentValue = this.value;
            const growthPercent = ((currentValue - threeTurnsAgo) / threeTurnsAgo) * 100;
            k = growthPercent;
        }

        const oldReputation = this.reputation;
        const kModifier = 3 * ((1.2 * k) - Math.sqrt(Math.pow(k, 2)));
        const term = Math.pow(this.reputation, 3) + this.utility - this.owners + kModifier;
        this.reputation = Math.cbrt(term);

        // Value Update
        const multiplier = this.lastDemand / this.lastSupply;
        const oldValue = this.value;
        this.value = this.value * multiplier;
        if (this.value < 0.01) this.value = 0.01;

        this.history.push(this.value);

        if (this.history.length > 50) this.history.shift();


        if (typeof window !== 'undefined' && window.DEBUG_MMM) {
            console.log(`[ENGINE] ${this.name} update:`, {
                demand: this.lastDemand.toFixed(3),
                supply: this.lastSupply.toFixed(3),
                multiplier: multiplier.toFixed(3),
                oldValue: oldValue.toFixed(2),
                newValue: this.value.toFixed(2),
                oldOwners,
                newOwners: this.owners,
                k: k.toFixed(2),
                kModifier: kModifier.toFixed(2),
                oldReputation: oldReputation.toFixed(2),
                newReputation: this.reputation.toFixed(2)
            });
        }
    }
}

export class Market {
    constructor() {
        this.availableItems = [];
        this.itemNames = [
            "Tech Corp", "Banana Stand",
            "Oil Drum", "Tulip Bulb", "AI Chip", "Real Estate",
            "Gold Bar", "Startup Inc", "Meme Stock", "Computer Component",
            "Rare Video Game", "Trading Card Booster Box", "Figurine", "Collector Comic Book",
            "Luxury Watch", "Designer Handbag", "Rare Wine", "Vintage Car",
            "Rare Art", "Limited Edition Sneakers"
        ];
    }

    generateItem() {
        const name = this.itemNames[Math.floor(Math.random() * this.itemNames.length)] + " " + Math.floor(Math.random() * 100);

        // Random Stats
        const baseValue = 50 + Math.random() * 450; // 50 - 500
        const utility = Math.floor(Math.random() * 100);
        const owners = Math.floor(Math.random() * 100);
        const reputation = (Math.random() * 20) - 10; // -10 to 10

        return new Item(name, baseValue, utility, owners, reputation);
    }

    refreshMarket() {
        this.availableItems = [];
        for (let i = 0; i < 3; i++) {
            this.availableItems.push(this.generateItem());
        }
    }
}

export class Economy {
    static calculateRent(baseRent, turn) {

        const increases = Math.floor(turn / 5);
        return baseRent * Math.pow(1.01, increases);
    }
}
