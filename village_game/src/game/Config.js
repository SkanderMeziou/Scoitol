export const Config = {
    // World
    WORLD_SIZE: 4000,
    BACKGROUND_COLOR: '#addf98ff', // Lighter, less saturated green (Pure Emerald was #2ecc71)
    GRID_COLOR: '#ceecccff', // Dark green grid

    // Game Flow
    WAVE_TIMER: 30.0,
    SPAWN_TIMER_START: 3.0,
    SPAWN_RATE_MIN: 3, // Minimum time between enemy spawns (higher = fewer enemies)
    SPAWN_RATE_SCALING: 0.0005, // How much spawn rate decreases per wave (lower = slower increase)
    RESOURCE_SPAWN_TIMER: 2.0,

    // Entities
    SEED_GROWTH_TIME: 60.0,
    GENERATOR_PRODUCTION_TIME: 1.0,
    
    // Enemy Stats
    ENEMY_BASE_POWER: 0.25, // Base power for wave 1
    ENEMY_POWER_SCALING: 1.3, // Multiplier per wave (power = base * scaling^(wave-1))
    ENEMY_POWER_VARIANCE: 6.0, // Variance factor k for power distribution (higher = more extreme variance)
    
    // Player
    PLAYER_SPEED: 200,
    PLAYER_ATTACK_COOLDOWN: 0.2,
    PLAYER_BUILD_COOLDOWN: 0.2,

    PLAYER_SPEED: 200,
    PLAYER_ATTACK_COOLDOWN: 0.2,
    PLAYER_BUILD_COOLDOWN: 0.2,
    
    // Visual Sizes (Multipliers)
    PLAYER_SIZE_MULTIPLIER: 0.8, // Make player slightly smaller
    TREE_SIZE_MULTIPLIER: 1.5,   // Make trees larger
    RESOURCE_SIZE_MULTIPLIER: 1.2, // Make other resources slightly larger
    COLORS: {
        wood: '#a07f70ff', // Purple (Wait, wood should be brown? Using existing palette)
        stone: '#95a5a6',
        gold: '#f1c40f',
        iron: '#7f8c8d',
        crystal: '#9b59b6',
        obsidian: '#2c3e50',
        diamond: '#3498db',
        emerald: '#27ae60',
        ruby: '#c0392b',
        sapphire: '#2980b9'
    },
    
    // Material Rarity Scores (for balancing)
    MATERIAL_RARITY: {
        wood: 1,
        stone: 1,
        iron: 3.5,
        crystal: 4.5,
        obsidian: 5,
        gold: 15,
        emerald: 7,
        ruby: 8,
        sapphire: 8.5,
        diamond: 9
    }
};
