import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { test } from 'node:test';
import { Player } from '../src/entities/Player.js';
import { Game } from '../src/game/Game.js';
import { BuildMenu } from '../src/ui/BuildMenu.js';

globalThis.Image = class {
    complete = false;
    naturalWidth = 0;
};

function createScene() {
    const calls = [];
    const ctx = new Proxy({}, {
        get(target, key) {
            if (key in target) return target[key];
            return (...args) => {
                calls.push([key, ...args]);
                if (key === 'drawImage' && args[0].naturalWidth === 0) {
                    throw new Error('Cannot draw a broken image');
                }
            };
        }
    });
    const input = { mouse: { x: 0, y: 0 } };
    const player = new Player(500, 400, input);
    const game = Object.assign(Object.create(Game.prototype), {
        ctx, input, player,
        canvas: { width: 1000, height: 800 },
        gameState: 'PLAYING',
        turrets: [], buildings: [], entities: [player],
        currentZoomScale: 1, step: 1 / 60,
        particleSystem: { draw() {} },
        house: { health: 100 }
    });
    player.game = game;
    game.buildMenu = new BuildMenu(game);
    return { game, player, calls };
}

test('the ghost sprite resolves to the existing game asset', () => {
    const { player } = createScene();
    const expected = new URL('../assets/player_spritesheet.png', import.meta.url);
    assert.equal(String(player.sprite.src), expected.href);
    assert.ok(existsSync(expected));
});

for (const state of ['loading', 'broken', 'loaded']) {
    test(`the player and store render when the sprite is ${state}`, () => {
        const { game, player, calls } = createScene();
        player.sprite.complete = state !== 'loading';
        player.sprite.naturalWidth = state === 'loaded' ? 3328 : 0;

        assert.doesNotThrow(() => game.render());
        assert.ok(calls.some(([method, x, y, width, height]) =>
            method === 'fillRect' && x === 940 && y === 0 && width === 60 && height === 800
        ), 'the store sidebar must render after the player');
        if (state === 'loaded') {
            assert.ok(calls.some(([method]) => method === 'drawImage'));
        } else {
            assert.ok(!calls.some(([method]) => method === 'drawImage'));
            assert.ok(calls.some(([method, x, y]) =>
                method === 'arc' && x === player.x && y === player.y
            ), 'a fallback must keep the player visible');
        }
    });
}
