export const WaveConfig = {
    // Round definitions
    // Each round has a weight (likelihood) and a list of enemy types with their spawn weights
    rounds: [
        {
            id: 'standard',
            weight: 10,
            enemies: { 'normal': 10, 'fast': 2, 'tank': 1 },
            description: "Standard mix of enemies."
        },
        {
            id: 'swarm',
            weight: 5,
            enemies: { 'fast': 10, 'normal': 2 },
            spawnRateMultiplier: 0.5, // Spawn twice as fast
            powerMultiplier: 0.6, // Weaker enemies
            description: "A swarm of fast, weak enemies."
        },
        {
            id: 'heavies',
            weight: 5,
            enemies: { 'tank': 8, 'normal': 2 },
            spawnRateMultiplier: 1.5, // Spawn slower
            powerMultiplier: 1.5, // Stronger enemies
            description: "Heavy armored units approaching."
        },
        {
            id: 'disruptors',
            weight: 3,
            enemies: { 'disruptor': 8, 'normal': 2 },
            description: "Turret disruptors detected."
        },
        {
            id: 'spirals',
            weight: 4,
            enemies: { 'spiral': 10 },
            description: "Enemies moving in spiral patterns."
        },
        {
            id: 'stopgo',
            weight: 4,
            enemies: { 'stopgo': 10 },
            description: "Enemies with erratic movement."
        },
        {
            id: 'boss_rush',
            weight: 1,
            enemies: { 'boss': 10 },
            spawnRateMultiplier: 3.0, // Very slow spawn
            powerMultiplier: 3.0, // Very strong
            description: "WARNING: High power signatures detected."
        },
        {
            id: 'zigzag',
            weight: 4,
            enemies: { 'zigzag': 10 },
            description: "Enemies moving in zigzag patterns."
        },
        {
            id: 'stealth',
            weight: 3,
            enemies: { 'stealth': 10 },
            description: "Stealth units (hard to see)."
        },
        {
            id: 'regenerator',
            weight: 3,
            enemies: { 'regenerator': 10 },
            description: "Enemies that regenerate health."
        },
        {
            id: 'splitter',
            weight: 2,
            enemies: { 'splitter': 10 },
            description: "Enemies that split on death."
        },
        {
            id: 'shielded',
            weight: 3,
            enemies: { 'shielded': 10 },
            description: "Enemies with protective shields."
        },
        {
            id: 'kamikaze',
            weight: 3,
            enemies: { 'kamikaze': 10 },
            description: "Explosive enemies."
        },
        {
            id: 'mixed_chaos',
            weight: 2,
            enemies: { 'normal': 5, 'fast': 5, 'tank': 5, 'spiral': 5, 'zigzag': 5 },
            description: "Chaotic mix of all types."
        },
        {
            id: 'glass_cannon',
            weight: 3,
            enemies: { 'glass_cannon': 10 },
            powerMultiplier: 2.0, // High damage
            healthMultiplier: 0.3, // Low health
            description: "High damage, low health enemies."
        },
        {
            id: 'vampire',
            weight: 2,
            enemies: { 'vampire': 10 },
            description: "Enemies that heal on attack."
        },
        {
            id: 'teleporter',
            weight: 2,
            enemies: { 'teleporter': 10 },
            description: "Enemies that teleport short distances."
        },
        {
            id: 'orbital',
            weight: 2,
            enemies: { 'orbital': 10 },
            description: "Enemies orbiting the base."
        },
        {
            id: 'glitch',
            weight: 1,
            enemies: { 'glitch': 10 },
            description: "Glitch entities detected."
        },
        {
            id: 'void',
            weight: 1,
            enemies: { 'void': 10 },
            powerMultiplier: 2.5,
            description: "Void creatures approaching."
        }
    ]
};
