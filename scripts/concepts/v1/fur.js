// Shaggy-fur helpers for the Mars concept sheet. Deterministic (seeded) so renders are stable.
function rng(seed) { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const f = (v) => +v.toFixed(1);

/** Ellipse outline made of soft, rounded, hanging locks (wavy coat, not spikes). len = lock length (fraction of radius), grav = droop. */
function shaggy(cx, cy, rx, ry, n, { len = 0.18, grav = 0.5, rot = 0, seed = 1, jit = 0.25 } = {}) {
  const r = rng(seed), a0 = rot * Math.PI / 180;
  const P = (t, k) => { const x = rx * k * Math.cos(t), y = ry * k * Math.sin(t); return [cx + x * Math.cos(a0) - y * Math.sin(a0), cy + x * Math.sin(a0) + y * Math.cos(a0)]; };
  const dt = 2 * Math.PI / n; let d = '';
  for (let i = 0; i < n; i++) {
    const t = i * dt, p = P(t, 1), q = P(t + dt, 1), tm = t + dt * (0.5 + (r() - 0.5) * 0.25);
    const L = len * (1 + (r() - 0.5) * 2 * jit), R = Math.max(rx, ry);
    const droop = grav * L * R * (0.55 + 0.45 * Math.sin(tm));
    const tip = P(tm, 1 + L); tip[1] += droop; tip[0] += (r() - 0.5) * L * R * 0.5; // a little wave
    const a = P(t + dt * 0.15, 1 + L * 0.55), b = P(t + dt * 0.85, 1 + L * 0.45);
    a[1] += droop * 0.6; b[1] += droop * 0.5;
    if (!i) d += `M${f(p[0])},${f(p[1])}`;
    // rounded lock: bulge out to the tip and curl back (cubic curves, no sharp points)
    d += ` C${f(a[0])},${f(a[1])} ${f(tip[0] - (q[0] - p[0]) * 0.35)},${f(tip[1] - (q[1] - p[1]) * 0.35)} ${f(tip[0])},${f(tip[1])}`;
    d += ` C${f(tip[0] + (q[0] - p[0]) * 0.3)},${f(tip[1] + (q[1] - p[1]) * 0.3)} ${f(b[0])},${f(b[1])} ${f(q[0])},${f(q[1])}`;
  }
  return d + ' Z';
}

/** A hanging lock (ear, beard, fringe): from a top point, widening, ending in tufts. */
function lock(x, y, w, h, { tufts = 4, tilt = 0, seed = 3, flare = 1.25 } = {}) {
  const r = rng(seed); const bw = w * flare; let d = `M${f(x - w / 2)},${f(y)}`;
  d += ` C${f(x - w * 0.75)},${f(y + h * 0.3)} ${f(x - bw / 2 + tilt * 0.6)},${f(y + h * 0.6)} ${f(x - bw / 2 + tilt)},${f(y + h * 0.88)}`;
  for (let i = 0; i < tufts; i++) {
    const x0 = x - bw / 2 + tilt + (bw * i) / tufts, x1 = x0 + bw / tufts, tx = (x0 + x1) / 2 + (r() - 0.5) * 4;
    const ty = y + h * (1.0 + r() * 0.08);
    d += ` C${f(x0)},${f(y + h * 0.97)} ${f(tx - 4)},${f(ty)} ${f(tx)},${f(ty)} C${f(tx + 4)},${f(ty)} ${f(x1)},${f(y + h * 0.97)} ${f(x1)},${f(y + h * 0.9)}`;
  }
  d += ` C${f(x + bw / 2 + tilt * 0.6)},${f(y + h * 0.6)} ${f(x + w * 0.75)},${f(y + h * 0.3)} ${f(x + w / 2)},${f(y)} Z`;
  return d;
}

/** Fur strands inside an ellipse: short wavy strokes, mostly pointing down. Returns path d. */
function strands(cx, cy, rx, ry, count, { len = 12, seed = 5, dir = 90, spread = 40, wave = 3 } = {}) {
  const r = rng(seed); let d = '';
  for (let i = 0; i < count; i++) {
    let x, y; do { x = (r() * 2 - 1); y = (r() * 2 - 1); } while (x * x + y * y > 1);
    x = cx + x * rx; y = cy + y * ry;
    const a = (dir + (r() - 0.5) * spread) * Math.PI / 180, l = len * (0.6 + r() * 0.8);
    const ex = Math.cos(a) * l, ey = Math.sin(a) * l, w = (r() - 0.5) * 2 * wave;
    d += `M${f(x)},${f(y)} q${f(ex / 2 - ey / l * w)},${f(ey / 2 + ex / l * w)} ${f(ex)},${f(ey)} `;
  }
  return d;
}

/** Almond eye with amber iris; lid = fur colour covering the top. */
function eye(x, y, r, { iris = 'url(#amber)', lid = '#2a1912', look = [0, 0], white = true, lidDrop = 0.28, line = '#120a07', glint = true } = {}) {
  const lx = look[0], ly = look[1];
  return `<g transform="translate(${x},${y})">
    ${white ? `<ellipse rx="${f(r * 1.18)}" ry="${f(r * 0.98)}" fill="#f4ece2"/>` : ''}
    <circle cx="${lx}" cy="${ly}" r="${r}" fill="${iris}"/>
    <circle cx="${lx}" cy="${ly}" r="${f(r * 0.48)}" fill="#0d0705"/>
    ${glint ? `<circle cx="${f(lx + r * 0.35)}" cy="${f(ly - r * 0.38)}" r="${f(r * 0.28)}" fill="#fff"/><circle cx="${f(lx - r * 0.35)}" cy="${f(ly + r * 0.35)}" r="${f(r * 0.12)}" fill="#fff" opacity=".7"/>` : ''}
    <path d="M${f(-r * 1.4)},${f(-r * 1.6)} H${f(r * 1.4)} V${f(-r * (1 - lidDrop * 2))} Q0,${f(-r * (1.25 - lidDrop * 2))} ${f(-r * 1.4)},${f(-r * (1 - lidDrop * 2))} Z" fill="${lid}"/>
    <ellipse rx="${f(r * 1.18)}" ry="${f(r * 0.98)}" fill="none" stroke="${line}" stroke-width="${f(Math.max(1.5, r * 0.18))}"/>
  </g>`;
}

module.exports = { rng, shaggy, lock, strands, eye, f };
