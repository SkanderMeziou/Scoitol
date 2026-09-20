import assert from 'node:assert/strict';
import { test } from 'node:test';
import { constrainToArena, isInsideArena, ARENA_WIDTH, ARENA_HEIGHT } from '../src/game/Arena.js';
import { Player } from '../src/entities/Player.js';
import { Input } from '../src/game/Input.js';
import { Game } from '../src/game/Game.js';

globalThis.Image = class {};

test('the player stays inside every edge and rounded corner', () => {
    for (const x of [-100, 0, 32, 600, 1168, 1200, 1300]) {
        for (const y of [-100, 0, 32, 375, 718, 750, 850]) {
            const point = constrainToArena(x, y, 32);
            assert.ok(isInsideArena(point.x, point.y, 32));
            assert.ok(point.x >= 32 && point.x <= ARENA_WIDTH - 32);
            assert.ok(point.y >= 32 && point.y <= ARENA_HEIGHT - 32);
        }
    }
    assert.equal(isInsideArena(32, 32, 32), false, 'the clipped corner is not playable');
    assert.deepEqual(constrainToArena(600, 375, 32), { x: 600, y: 375 });
});

test('movement is constrained even when a step overshoots the field', () => {
    const input = { mouse: { x: 0, y: 0 }, getMovement: () => ({ x: -1, y: -1 }) };
    const player = new Player(33, 33, input);
    player.update(1, []);
    assert.ok(isInsideArena(player.x, player.y, 32));
});

test('placing outside the field or in a clipped corner costs no resources', () => {
    const player = new Player(600, 375, {});
    player.inventory.wood = 100;
    player.inventory.stone = 100;
    for (const [x, y] of [[-50, 375], [1250, 375], [600, -50], [600, 800], [0, 0]]) {
        assert.equal(player.tryBuild([], x, y), null);
    }
    assert.equal(player.inventory.wood, 100);
    assert.equal(player.inventory.stone, 100);
    assert.equal(player.tryBuild([], 400, 350).type, 'turret');
    assert.equal(player.inventory.wood, 90);
});

test('pointer coordinates account for both the canvas offset and display scaling', () => {
    const input = Object.create(Input.prototype);
    input.canvas = { width: ARENA_WIDTH, height: ARENA_HEIGHT,
        getBoundingClientRect: () => ({ left: 40, top: 200, width: 600, height: 375 }) };
    assert.deepEqual(input.position({ clientX: 340, clientY: 387.5 }), { x: 600, y: 375 });
    input.canvas.getBoundingClientRect = () => ({ left: 16, top: 180, width: 360, height: 225 });
    assert.deepEqual(input.position({ clientX: 196, clientY: 292.5 }), { x: 600, y: 375 });
});

test('resources always spawn inside the field and away from the house', () => {
    const game = Object.create(Game.prototype);
    for (let i = 0; i < 500; i++) {
        const { x, y } = game.resourcePosition();
        assert.ok(isInsideArena(x, y, 45));
        assert.ok(Math.hypot(x - 600, y - 375) >= 110);
    }
});
