import { Config } from './Config.js';

/**
 * Calculate craft difficulty for a recipe
 * Formula: (sum of all material rarities) * (0.9 + (unique_materials_count / 10))^1.1
 * 
 * @param {Object} cost - Recipe cost object, e.g., { wood: 3, stone: 3, iron: 2 }
 * @returns {number} - Craft difficulty score
 */
export function calculateCraftDifficulty(cost) {
    if (!cost || Object.keys(cost).length === 0) {
        return 1; // Default difficulty for items with no cost
    }

    let sumOfRarities = 0;
    const uniqueMaterials = Object.keys(cost).length;

    // Sum up all material rarities (rarity * amount for each material)
    for (const [material, amount] of Object.entries(cost)) {
        const rarity = Config.MATERIAL_RARITY[material] || 1;
        sumOfRarities += rarity * amount;
    }

    // Apply the new formula: sum * (0.9 + unique/10)^1.1
    const multiplier = Math.pow(0.9 + (uniqueMaterials / 10), 1.1);
    const difficulty = sumOfRarities * multiplier;

    return difficulty;
}

/**
 * Calculate craft difficulty for all recipes
 * @param {Object} recipes - Recipes object from Recipes.js
 * @returns {Object} - Map of recipe names to their difficulties
 */
export function calculateAllDifficulties(recipes) {
    const difficulties = {};
    
    for (const [recipeName, recipe] of Object.entries(recipes)) {
        difficulties[recipeName] = calculateCraftDifficulty(recipe.cost);
    }
    
    return difficulties;
}
