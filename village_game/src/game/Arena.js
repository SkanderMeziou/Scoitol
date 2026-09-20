// A fixed world: CSS scales its canvas without changing gameplay coordinates.
export const ARENA_WIDTH = 1200;
export const ARENA_HEIGHT = 750;
export const ARENA_RADIUS = 90;

// Project into the inset squircle, including its rounded corners.
export function constrainToArena(x, y, margin = 0) {
    x = Math.max(margin, Math.min(ARENA_WIDTH - margin, x));
    y = Math.max(margin, Math.min(ARENA_HEIGHT - margin, y));
    const r = Math.max(1, ARENA_RADIUS - margin);
    const cx = Math.max(ARENA_RADIUS, Math.min(ARENA_WIDTH - ARENA_RADIUS, x));
    const cy = Math.max(ARENA_RADIUS, Math.min(ARENA_HEIGHT - ARENA_RADIUS, y));
    const dx = x - cx;
    const dy = y - cy;
    const norm = Math.pow(Math.pow(dx / r, 4) + Math.pow(dy / r, 4), 0.25);
    if (norm > 1) {
        x = cx + dx / norm;
        y = cy + dy / norm;
    }
    return { x, y };
}

export function isInsideArena(x, y, margin = 0) {
    const point = constrainToArena(x, y, margin);
    return Math.abs(point.x - x) < 0.001 && Math.abs(point.y - y) < 0.001;
}

export function arenaPath(ctx) {
    ctx.beginPath();
    const corners = [
        [ARENA_WIDTH - ARENA_RADIUS, ARENA_RADIUS, -Math.PI / 2],
        [ARENA_WIDTH - ARENA_RADIUS, ARENA_HEIGHT - ARENA_RADIUS, 0],
        [ARENA_RADIUS, ARENA_HEIGHT - ARENA_RADIUS, Math.PI / 2],
        [ARENA_RADIUS, ARENA_RADIUS, Math.PI]
    ];
    corners.forEach(([cx, cy, start], corner) => {
        for (let i = 0; i <= 24; i++) {
            const angle = start + i / 24 * Math.PI / 2;
            const cos = Math.cos(angle), sin = Math.sin(angle);
            const x = cx + ARENA_RADIUS * Math.sign(cos) * Math.sqrt(Math.abs(cos));
            const y = cy + ARENA_RADIUS * Math.sign(sin) * Math.sqrt(Math.abs(sin));
            if (corner === 0 && i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
    });
    ctx.closePath();
}
