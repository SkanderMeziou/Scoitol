import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { test } from 'node:test';
import { Player } from '../src/entities/Player.js';
import { Game } from '../src/game/Game.js';
import { House } from '../src/entities/House.js';

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
        shakeDuration: 0, shakeIntensity: 0,
        particleSystem: { draw() {}, createExplosion() {} },
        house: { health: 100 }
    });
    player.game = game;
    return { game, player, calls };
}

test('damage and enemy deaths trigger a clipped world shake, leaving the UI steady', () => {
    const { game, calls } = createScene();
    const house = new House(600, 375, game);
    game.handleEntityDeath({ type: 'enemy', x: 100, y: 100 });
    assert.equal(game.shakeIntensity, 2);
    assert.equal(game.shakeDuration, 0.2);
    house.takeDamage(10);
    game.handleEntityDeath({ type: 'enemy', x: 100, y: 100 });
    assert.equal(game.shakeIntensity, 5, 'kill effects preserve stronger damage impacts');
    assert.equal(game.shakeDuration, 0.3);

    game.drawTooltips = () => calls.push(['tooltip']);
    game.render();
    const translation = calls.findIndex(([method]) => method === 'translate');
    assert.ok(translation > calls.findIndex(([method]) => method === 'clip'));
    assert.ok(Math.abs(calls[translation][1]) <= 2.5);
    assert.ok(Math.abs(calls[translation][2]) <= 2.5);
    const tooltip = calls.findIndex(([method]) => method === 'tooltip');
    assert.equal(calls[tooltip - 1][0], 'restore');
    assert.ok(tooltip > translation);
});

test('the world stays still after shake expiry, while paused, or with reduced motion', () => {
    for (const state of [{ shakeDuration: 0 }, { isPaused: true }, { reducedMotion: { matches: true } }]) {
        const { game, calls } = createScene();
        Object.assign(game, { shakeDuration: 0.3, shakeIntensity: 5 }, state);
        game.render();
        assert.ok(!calls.some(([method]) => method === 'translate'));
    }
});

test('the ghost sprite resolves to the existing game asset', () => {
    const { player } = createScene();
    const expected = new URL('../assets/player_spritesheet.png', import.meta.url);
    assert.equal(String(player.sprite.src), expected.href);
    assert.ok(existsSync(expected));
});

for (const state of ['loading', 'broken', 'loaded']) {
    test(`the field renders when the sprite is ${state}`, () => {
        const { game, player, calls } = createScene();
        player.sprite.complete = state !== 'loading';
        player.sprite.naturalWidth = state === 'loaded' ? 3328 : 0;

        assert.doesNotThrow(() => game.render());
        assert.equal(calls.at(-1)[0], 'restore', 'the field render must finish');
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
