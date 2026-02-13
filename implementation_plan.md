# Gameplay and Visual Overhaul Plan

## Goal Description

Overhaul the game to be faster-paced, more user-friendly (auto-actions), and visually improved with a grid system and sprite support.

## User Review Required

> [!IMPORTANT] > **World Boundaries**: I will set a fixed world size (e.g., 4000x4000) to prevent the player from wandering endlessly.
> **Auto-Attack**: This removes the need to click. The player will automatically attack the nearest target in range.

## Proposed Changes

### Game Balance & Flow

#### [MODIFY] [Game.js](file:///home/ska/bordel/village_game_antigravity/src/game/Game.js)

- Reduce `waveTimer` to 30s.
- Reduce `spawnTimer` scaling.
- Define `worldSize` (e.g., 4000).
- Clamp Player position in `update`.

#### [MODIFY] [Seed.js](file:///home/ska/bordel/village_game_antigravity/src/entities/Seed.js)

- Reduce `timer` to 60s.

#### [MODIFY] [Building.js](file:///home/ska/bordel/village_game_antigravity/src/entities/Building.js)

- Reduce production timers by 3x.

### Player Mechanics

#### [MODIFY] [Player.js](file:///home/ska/bordel/village_game_antigravity/src/entities/Player.js)

- Add `autoAttackCooldown` (0.5s).
- In `update`, check for enemies/resources in range and attack automatically if cooldown is ready.
- Remove click-to-attack logic.
- Implement `clampPosition` method.

### Grid System

#### [MODIFY] [BuildMenu.js](file:///home/ska/bordel/village_game_antigravity/src/game/BuildMenu.js)

- (Or `Player.js` build logic)
- Implement `snapToGrid(x, y)` function (grid size 50).
- Update placement check to verify grid cell occupancy.

### Visuals & Procedural Sprites

#### [MODIFY] [Entity.js](file:///home/ska/bordel/village_game_antigravity/src/entities/Entity.js)

- Update `draw` to allow custom rendering overrides (already exists, but standardize).

#### [MODIFY] [Resource.js](file:///home/ska/bordel/village_game_antigravity/src/entities/Resource.js)

- Implement `draw` to render trees (trunk + leaves) and rocks (irregular shapes) using canvas primitives.

#### [MODIFY] [Turret.js](file:///home/ska/bordel/village_game_antigravity/src/entities/Turret.js)

- Implement `draw` to render more complex turret shapes (base + barrel + details).

#### [MODIFY] [Player.js](file:///home/ska/bordel/village_game_antigravity/src/entities/Player.js)

- **Trail Offset**: Calculate perpendicular vector to movement, add random offset `[-radius, radius]` to particle emission position.

#### [MODIFY] [Game.js](file:///home/ska/bordel/village_game_antigravity/src/game/Game.js)

- Change background color to `#2ecc71` (Emerald Green).

#### [NEW] [assets/sprites/](file:///home/ska/bordel/village_game_antigravity/public/sprites)

- (Skipped: User requested procedural shapes instead of images).

## Verification Plan

### Manual Verification

1.  **Speed**: Verify waves come every 30s. Verify seeds grow in 60s.
2.  **Auto-Attack**: Stand near a tree/enemy. Verify player attacks without clicking.
3.  **Grid**: Try to build turrets. Verify they snap to a grid and cannot overlap.
4.  **Boundaries**: Walk to the edge. Verify player stops.
5.  **Visuals**: Verify background is green. Verify entities look "natural" (even if shapes).
