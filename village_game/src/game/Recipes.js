import { calculateCraftDifficulty } from './CraftDifficulty.js';

export const Recipes = {
    // Turrets
    // Turrets
    turret_basic: { type: 'turret', subType: 'basic', cost: { wood: 10, stone: 10 }, description: "Basic defense turret." },
    turret_wood: { type: 'turret', subType: 'wood', cost: { wood: 20 }, description: "Fast firing wooden turret." },
    turret_iron: { type: 'turret', subType: 'iron', cost: { iron: 10 }, description: "Strong iron turret." },
    turret_gold: { type: 'turret', subType: 'gold', cost: { gold: 10 }, description: "A solid gold turret." },
    turret_crystal: { type: 'turret', subType: 'crystal', cost: { crystal: 10 }, description: "High damage crystal turret." },
    turret_obsidian: { type: 'turret', subType: 'obsidian', cost: { obsidian: 10 }, description: "Very heavy damage." },
    turret_diamond: { type: 'turret', subType: 'diamond', cost: { diamond: 10 }, description: "Long range, high damage." },
    turret_emerald: { type: 'turret', subType: 'emerald', cost: { emerald: 10 }, description: "Poison effect." },
    turret_ruby: { type: 'turret', subType: 'ruby', cost: { ruby: 10 }, description: "Fire effect." },
    turret_sapphire: { type: 'turret', subType: 'sapphire', cost: { sapphire: 10 }, description: "Ice/Freeze effect." },

    // Advanced Turrets
    turret_sniper: { type: 'turret', subType: 'sniper', cost: { wood: 50, iron: 20 }, description: "Extreme range, slow fire." },
    turret_gatling: { type: 'turret', subType: 'gatling', cost: { iron: 50, gold: 5 }, description: "Very fast fire rate, low damage." },
    turret_shotgun: { type: 'turret', subType: 'shotgun', cost: { stone: 50, iron: 10 }, description: "Fires multiple projectiles." },
    turret_flamethrower: { type: 'turret', subType: 'flamethrower', cost: { iron: 30, ruby: 5 }, description: "Short range, continuous fire damage." },
    turret_tesla: { type: 'turret', subType: 'tesla', cost: { iron: 30, sapphire: 5 }, description: "Chains damage to nearby enemies." },
    turret_laser: { type: 'turret', subType: 'laser', cost: { crystal: 20, diamond: 5 }, description: "Instant hit beam." },
    turret_mortar: { type: 'turret', subType: 'mortar', cost: { stone: 50, obsidian: 10 }, description: "Lobbed explosive shells." },
    turret_missile: { type: 'turret', subType: 'missile', cost: { iron: 50, obsidian: 20 }, description: "Homing missiles." },
    turret_railgun: { type: 'turret', subType: 'railgun', cost: { obsidian: 50, diamond: 10 }, description: "Pierces through enemies." },

    // Gimmick / Special Turrets
    turret_money: { type: 'turret', subType: 'money', cost: { gold: 50 }, description: "Generates gold on kill." },
    turret_pushback: { type: 'turret', subType: 'pushback', cost: { wood: 100, iron: 10 }, description: "Knocks enemies back." },
    turret_slow_field: { type: 'turret', subType: 'slow_field', cost: { sapphire: 20, crystal: 20 }, description: "Slows all enemies in range." },
    turret_executioner: { type: 'turret', subType: 'executioner', cost: { obsidian: 50, ruby: 20 }, description: "Instantly kills low HP enemies." },
    turret_buffer: { type: 'turret', subType: 'buffer', cost: { gold: 20, crystal: 20 }, description: "Buffs nearby turrets." },
    turret_debuffer: { type: 'turret', subType: 'debuffer', cost: { emerald: 20, obsidian: 10 }, description: "Weakens enemy armor." },
    turret_teleport: { type: 'turret', subType: 'teleport', cost: { crystal: 50, diamond: 10 }, description: "Teleports enemies back to start." },
    turret_blackhole: { type: 'turret', subType: 'blackhole', cost: { obsidian: 100, diamond: 50 }, description: "Sucks enemies in." },
    turret_confuse: { type: 'turret', subType: 'confuse', cost: { emerald: 30, sapphire: 30 }, description: "Makes enemies move randomly." },
    turret_poison_cloud: { type: 'turret', subType: 'poison_cloud', cost: { emerald: 50 }, description: "Creates lingering poison clouds." },

    // High Cost / Tier 2
    turret_heavy_wood: { type: 'turret', subType: 'heavy_wood', cost: { wood: 100 }, description: "Reinforced wooden turret." },
    turret_heavy_stone: { type: 'turret', subType: 'heavy_stone', cost: { stone: 100 }, description: "Reinforced stone turret." },
    turret_alloy: { type: 'turret', subType: 'alloy', cost: { iron: 50, stone: 50 }, description: "Durable alloy turret." },
    turret_gem_core: { type: 'turret', subType: 'gem_core', cost: { diamond: 10, ruby: 10, sapphire: 10, emerald: 10 }, description: "Multi-elemental core." },
    turret_obsidian_wall: { type: 'turret', subType: 'obsidian_wall', cost: { obsidian: 50 }, description: "High HP defensive turret." },
    turret_crystal_spire: { type: 'turret', subType: 'crystal_spire', cost: { crystal: 50 }, description: "Rapid fire crystal shards." },

    // Expensive / Tier 3
    turret_king: { type: 'turret', subType: 'king', cost: { gold: 100, diamond: 20 }, description: "Royal defense." },
    turret_queen: { type: 'turret', subType: 'queen', cost: { gold: 100, ruby: 20 }, description: "Royal offense." },
    turret_void: { type: 'turret', subType: 'void', cost: { obsidian: 100, diamond: 100 }, description: "Harnesses void energy." },
    turret_sun: { type: 'turret', subType: 'sun', cost: { gold: 200, ruby: 50 }, description: "Burns everything." },
    turret_moon: { type: 'turret', subType: 'moon', cost: { silver: 200, sapphire: 50 }, description: "Freezes everything." }, // Silver doesn't exist, use Iron? Or assume new resource? Let's use Iron/Crystal
    turret_moon_fixed: { type: 'turret', subType: 'moon', cost: { iron: 200, sapphire: 50 }, description: "Freezes everything." },

    // Combos
    turret_fire_ice: { type: 'turret', subType: 'fire_ice', cost: { ruby: 25, sapphire: 25 }, description: "Thermal shock damage." },
    turret_poison_stone: { type: 'turret', subType: 'poison_stone', cost: { emerald: 25, stone: 100 }, description: "Poisonous projectiles." },
    turret_gold_diamond: { type: 'turret', subType: 'gold_diamond', cost: { gold: 50, diamond: 50 }, description: "Precious metal destruction." },
    turret_obsidian_gold: { type: 'turret', subType: 'obsidian_gold', cost: { obsidian: 50, gold: 50 }, description: "Dark wealth." },

    // Ultimate
    turret_ultimate: { type: 'turret', subType: 'ultimate', cost: { diamond: 50, emerald: 50, ruby: 50, sapphire: 50, obsidian: 100 }, description: "The ultimate defense." },
    turret_omega: { type: 'turret', subType: 'omega', cost: { wood: 1000, stone: 1000, gold: 100, diamond: 100 }, description: "Endgame destruction." },
    turret_alpha: { type: 'turret', subType: 'alpha', cost: { iron: 500, crystal: 500, obsidian: 500 }, description: "The beginning of the end." },
    turret_chaos: { type: 'turret', subType: 'chaos', cost: { ruby: 100, emerald: 100, sapphire: 100 }, description: "Random effects." },
    turret_order: { type: 'turret', subType: 'order', cost: { diamond: 100, gold: 100 }, description: "Perfect accuracy." },

    // Legacy / Misc
    turret_aoe: { type: 'turret', subType: 'aoe', cost: { wood: 10, stone: 10, iron: 10 }, description: "Area of effect damage." },
    turret_luxe: { type: 'turret', subType: 'luxe', cost: { wood: 20, stone: 20, gold: 1 }, description: "A luxurious turret with gold accents." },
    turret_multicolor: { type: 'turret', subType: 'multicolor', cost: { diamond: 2, emerald: 2, sapphire: 2, ruby: 2 }, description: "A vibrant turret using multiple gems." },
    turret_gold_mini: { type: 'turret', subType: 'gold_mini', cost: { gold: 5 }, description: "A small golden turret." },
    turret_gold_canon: { type: 'turret', subType: 'gold_canon', cost: { gold: 20 }, description: "A massive golden canon with extreme range." },
    // Generators
    wood_gen: {
        type: 'building',
        subType: 'wood_gen',
        cost: { wood: 1, stone: 20 },
        description: "Generates Wood over time."
    },
    stone_gen: {
        type: 'building',
        subType: 'stone_gen',
        cost: { stone: 10 },
        description: "Generates Stone over time."
    },
    iron_gen: {
        type: 'building',
        subType: 'iron_gen',
        cost: { stone: 20, iron: 1 },
        description: "Generates Iron over time."
    },
    crystal_gen: {
        type: 'building',
        subType: 'crystal_gen',
        cost: { stone: 20, crystal: 1 },
        description: "Generates Crystal over time."
    },
    obsidian_gen: {
        type: 'building',
        subType: 'obsidian_gen',
        cost: { stone: 20, obsidian: 1 },
        description: "Generates Obsidian over time."
    },
    diamond_gen: {
        type: 'building',
        subType: 'diamond_gen',
        cost: { stone: 20, diamond: 1 },
        description: "Generates Diamond over time."
    },
    emerald_gen: {
        type: 'building',
        subType: 'emerald_gen',
        cost: { stone: 20, emerald: 1 },
        description: "Generates Emerald over time."
    },
    ruby_gen: {
        type: 'building',
        subType: 'ruby_gen',
        cost: { stone: 20, ruby: 1 },
        description: "Generates Ruby over time."
    },
    sapphire_gen: {
        type: 'building',
        subType: 'sapphire_gen',
        cost: { stone: 20, sapphire: 1 },
        description: "Generates Sapphire over time."
    },

    // Collectors (Posts)

    // Special Buildings
    alchemy: {
        type: 'building',
        subType: 'alchemy',
        cost: { wood: 50, stone: 50 },
        description: "Transmutes resources into Gold."
    },
    mega_wall: {
        type: 'building',
        subType: 'mega_wall',
        cost: { stone: 500, obsidian: 200 },
        description: "Massive defensive wall."
    },
    mega_fort: {
        type: 'building',
        subType: 'mega_fort',
        cost: { stone: 1000, obsidian: 500, iron: 500 },
        description: "Heavily armed fortress."
    },

};

// Calculate and add craftDifficulty to all recipes
for (const [recipeName, recipe] of Object.entries(Recipes)) {
    recipe.craftDifficulty = calculateCraftDifficulty(recipe.cost);
}
