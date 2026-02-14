#!/usr/bin/env node


import { Recipes } from '../src/game/Recipes.js';
import { Config } from '../src/game/Config.js';

console.log('='.repeat(80));
console.log('CRAFT DIFFICULTY AND TURRET DPS CALCULATOR');
console.log('='.repeat(80));
console.log();

// Formula: (sum of rarities) * (0.9 + unique_count/10)^1.1
function calculateDifficulty(cost) {
    if (!cost || Object.keys(cost).length === 0) return 1;
    
    let sum = 0;
    const unique = Object.keys(cost).length;
    
    for (const [material, amount] of Object.entries(cost)) {
        const rarity = Config.MATERIAL_RARITY[material] || 1;
        sum += rarity * amount;
    }
    
    const multiplier = Math.pow(0.9 + (unique / 10), 1.1);
    return sum * multiplier;
}

// Get basic turret difficulty for DPS calculation
const basicDifficulty = calculateDifficulty(Recipes.turret_basic.cost);
console.log(`Basic Turret Difficulty: ${basicDifficulty.toFixed(2)}`);
console.log(`Basic Turret DPS: 10 (baseline)`);
console.log();

// Separate recipes by type
const turrets = [];
const generators = [];
const collectors = [];
const buildings = [];
const seeds = [];

for (const [name, recipe] of Object.entries(Recipes)) {
    const difficulty = recipe.craftDifficulty || calculateDifficulty(recipe.cost);
    const entry = { name, recipe, difficulty };
    
    if (recipe.type === 'turret') {
        turrets.push(entry);
    } else if (recipe.subType && recipe.subType.includes('_gen')) {
        generators.push(entry);
    } else if (recipe.subType && recipe.subType.includes('_col')) {
        collectors.push(entry);
    } else if (recipe.type === 'seed') {
        seeds.push(entry);
    } else if (recipe.type === 'building') {
        buildings.push(entry);
    }
}

// Display Turrets with DPS
console.log('TURRETS');
console.log('-'.repeat(80));
console.log('Name'.padEnd(20) + 'Cost'.padEnd(30) + 'Difficulty'.padEnd(15) + 'Expected DPS');
console.log('-'.repeat(80));

turrets.sort((a, b) => a.difficulty - b.difficulty).forEach(({ name, recipe, difficulty }) => {
    const costStr = Object.entries(recipe.cost)
        .map(([mat, amt]) => `${amt} ${mat}`)
        .join(', ');
    
    const expectedDPS = (difficulty / basicDifficulty) * 10;
    
    console.log(
        name.padEnd(20) +
        costStr.padEnd(30) +
        difficulty.toFixed(2).padEnd(15) +
        expectedDPS.toFixed(2)
    );
});

console.log();


console.log('GENERATORS');
console.log('-'.repeat(80));
console.log('Name'.padEnd(20) + 'Cost'.padEnd(30) + 'Difficulty');
console.log('-'.repeat(80));

generators.sort((a, b) => a.difficulty - b.difficulty).forEach(({ name, recipe, difficulty }) => {
    const costStr = Object.entries(recipe.cost)
        .map(([mat, amt]) => `${amt} ${mat}`)
        .join(', ');
    
    console.log(
        name.padEnd(20) +
        costStr.padEnd(30) +
        difficulty.toFixed(2)
    );
});

console.log();


console.log('COLLECTORS');
console.log('-'.repeat(80));
console.log('Name'.padEnd(20) + 'Cost'.padEnd(30) + 'Difficulty');
console.log('-'.repeat(80));

collectors.sort((a, b) => a.difficulty - b.difficulty).forEach(({ name, recipe, difficulty }) => {
    const costStr = Object.entries(recipe.cost)
        .map(([mat, amt]) => `${amt} ${mat}`)
        .join(', ');
    
    console.log(
        name.padEnd(20) +
        costStr.padEnd(30) +
        difficulty.toFixed(2)
    );
});

console.log();

// Display Special Buildings
console.log('SPECIAL BUILDINGS');
console.log('-'.repeat(80));
console.log('Name'.padEnd(20) + 'Cost'.padEnd(30) + 'Difficulty');
console.log('-'.repeat(80));

buildings.sort((a, b) => a.difficulty - b.difficulty).forEach(({ name, recipe, difficulty }) => {
    const costStr = Object.entries(recipe.cost)
        .map(([mat, amt]) => `${amt} ${mat}`)
        .join(', ');
    
    console.log(
        name.padEnd(20) +
        costStr.padEnd(30) +
        difficulty.toFixed(2)
    );
});

console.log();

// Display Seeds
console.log('SEEDS');
console.log('-'.repeat(80));
console.log('Name'.padEnd(20) + 'Cost'.padEnd(30) + 'Difficulty');
console.log('-'.repeat(80));

seeds.sort((a, b) => a.difficulty - b.difficulty).forEach(({ name, recipe, difficulty }) => {
    const costStr = Object.entries(recipe.cost)
        .map(([mat, amt]) => `${amt} ${mat}`)
        .join(', ');
    
    console.log(
        name.padEnd(20) +
        costStr.padEnd(30) +
        difficulty.toFixed(2)
    );
});

console.log();
console.log('='.repeat(80));
console.log('MATERIAL RARITY VALUES');
console.log('='.repeat(80));
for (const [material, rarity] of Object.entries(Config.MATERIAL_RARITY)) {
    console.log(`${material.padEnd(15)}: ${rarity}`);
}
console.log('='.repeat(80));
