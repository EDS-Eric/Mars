// Concept drawings of Mars, round 2: a ONE-YEAR-OLD Australian cobberdog.
// What makes it Mars (photos + breed standard): soft, curly chocolate fleece (round curls, no spikes), a rounded teddy head,
// a medium-length snout (a bit longer than a puppy's), a small, tidy moustache, small amber eyes with a bright glint,
// floppy curly ears that hang to the jaw, a plume tail, a red MARS tag. Young = round shapes, big head, clean bright eyes.
// Deterministic (seeded), so every render is the same.

const PI = Math.PI;
const f = (v) => +v.toFixed(1);
function rng(seed) { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

/** Ellipse outline made of soft round scallops: the outline of a curly fleece. */
function cloud(cx, cy, rx, ry, n, { bump = 0.32, rot = 0, seed = 1, jit = 0.25 } = {}) {
  const r = rng(seed), a0 = rot * PI / 180, ca = Math.cos(a0), sa = Math.sin(a0);
  const P = (t) => { const x = rx * Math.cos(t), y = ry * Math.sin(t); return [cx + x * ca - y * sa, cy + x * sa + y * ca]; };
  const N = (t) => { let x = Math.cos(t) / rx, y = Math.sin(t) / ry; const l = Math.hypot(x, y); x /= l; y /= l; return [x * ca - y * sa, x * sa + y * ca]; };
  const ts = Array.from({ length: n }, (_, i) => (i + (r() - 0.5) * jit) / n * 2 * PI);
  let d = `M${P(ts[0]).map(f)}`;
  for (let i = 0; i < n; i++) {
    const t0 = ts[i], t1 = i + 1 === n ? ts[0] + 2 * PI : ts[i + 1];
    const p = P(t0), q = P(t1), nm = N((t0 + t1) / 2);
    const b = Math.hypot(q[0] - p[0], q[1] - p[1]) * bump * (1 + (r() - 0.5) * jit * 2) * 1.33;
    const c1 = [p[0] + (q[0] - p[0]) * 0.08 + nm[0] * b, p[1] + (q[1] - p[1]) * 0.08 + nm[1] * b];
    const c2 = [p[0] + (q[0] - p[0]) * 0.92 + nm[0] * b, p[1] + (q[1] - p[1]) * 0.92 + nm[1] * b];
    d += `C${c1.map(f)} ${c2.map(f)} ${q.map(f)}`;
  }
  return d + 'Z';
}

/** Little curl marks scattered inside an ellipse (the soft spirals of the fleece). */
function curls(cx, cy, rx, ry, count, { size = 4, seed = 7, rot = 0 } = {}) {
  const r = rng(seed), a0 = rot * PI / 180; let d = '';
  for (let k = 0, tries = 0; k < count && tries < count * 20; tries++) {
    const x = (r() * 2 - 1), y = (r() * 2 - 1); if (x * x + y * y > 1) continue; k++;
    const px = cx + rx * x * Math.cos(a0) - ry * y * Math.sin(a0), py = cy + rx * x * Math.sin(a0) + ry * y * Math.cos(a0);
    const s = size * (0.7 + r() * 0.6), a = r() * 2 * PI, dir = r() < 0.5 ? 1 : 0;
    const p0 = [px + s * Math.cos(a), py + s * Math.sin(a)], p1 = [px + s * Math.cos(a + PI), py + s * Math.sin(a + PI)];
    const p2 = [px + s * 0.25 * Math.cos(a), py + s * 0.25 * Math.sin(a)];
    d += `M${p0.map(f)}A${f(s)} ${f(s)} 0 0 ${dir} ${p1.map(f)}A${f(s * 0.62)} ${f(s * 0.62)} 0 0 ${dir} ${p2.map(f)}`;
  }
  return d;
}
/** Round curl dots (flat style). */
function dots(cx, cy, rx, ry, count, { size = 3.5, seed = 7 } = {}) {
  const r = rng(seed); let s = '';
  for (let k = 0, t = 0; k < count && t < count * 20; t++) {
    const x = r() * 2 - 1, y = r() * 2 - 1; if (x * x + y * y > 1) continue; k++;
    s += `<circle cx="${f(cx + rx * x)}" cy="${f(cy + ry * y)}" r="${f(size * (0.7 + r() * 0.6))}"/>`;
  }
  return s;
}

const BASE = {
  coat: '#4e2c1e', dark: '#3a1f15', mid: '#643926', light: '#8c5b3f', tips: '#a0704c', nose: '#2a1611',
  tag: '#d8262f', collar: '#2b2b2b', line: '#1e100b', lw: 0, flat: false, eyeR: 5.2, snout: 1, tilt: 0, turn: 0,
  tongue: false, bump: 0.32, curlSize: 4, curlCount: 1,
};

function defs(id, P) {
  if (P.flat) return '';
  return `<defs>
  <radialGradient id="fl${id}" cx="38%" cy="30%" r="75%"><stop offset="0" stop-color="${P.light}"/><stop offset=".45" stop-color="${P.coat}"/><stop offset="1" stop-color="${P.dark}"/></radialGradient>
  <radialGradient id="mz${id}" cx="45%" cy="30%" r="70%"><stop offset="0" stop-color="${P.light}"/><stop offset=".6" stop-color="${P.mid}"/><stop offset="1" stop-color="${P.coat}"/></radialGradient>
  <radialGradient id="eye${id}" cx="45%" cy="40%" r="60%"><stop offset="0" stop-color="#f5c46a"/><stop offset=".65" stop-color="#d08a2e"/><stop offset="1" stop-color="#8a4f17"/></radialGradient>
  <linearGradient id="ear${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.dark}"/><stop offset="1" stop-color="${P.coat}"/></linearGradient>
</defs>`;
}
const fills = (P, id) => P.flat
  ? { fl: P.coat, mz: P.mid, eye: '#e0a040', ear: P.dark }
  : { fl: `url(#fl${id})`, mz: `url(#mz${id})`, eye: `url(#eye${id})`, ear: `url(#ear${id})` };
const blob = (P, d, fill) => `<path d="${d}" fill="${fill}"${P.lw ? ` stroke="${P.line}" stroke-width="${P.lw}" stroke-linejoin="round"` : ''}/>`;
function texture(P, cx, cy, rx, ry, n, seed, rot = 0) {
  n = Math.round(n * P.curlCount);
  if (P.flat) return `<g fill="${P.mid}" opacity=".9">${dots(cx, cy, rx * 0.85, ry * 0.85, n, { size: P.curlSize * 0.75, seed })}</g>`;
  return `<path d="${curls(cx, cy, rx * 0.85, ry * 0.85, n, { size: P.curlSize, seed, rot })}" fill="none" stroke="${P.light}" stroke-width="1.2" stroke-linecap="round" opacity=".42"/>` +
    `<path d="${curls(cx + 1, cy + 1, rx * 0.85, ry * 0.85, Math.round(n * 0.6), { size: P.curlSize * 0.9, seed: seed + 50, rot })}" fill="none" stroke="${P.dark}" stroke-width="1.1" stroke-linecap="round" opacity=".38"/>`;
}

function eye(P, F, x, y, r, far = 1) {
  const rx = r * far;
  return `<g><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx + 1.2)}" ry="${f(r + 1.2)}" fill="${P.dark}"/>
  <ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(r)}" fill="${F.eye}"/>
  <ellipse cx="${f(x)}" cy="${f(y + 0.3)}" rx="${f(rx * 0.55)}" ry="${f(r * 0.58)}" fill="#1a0d08"/>
  <circle cx="${f(x - rx * 0.32)}" cy="${f(y - r * 0.38)}" r="${f(r * 0.34)}" fill="#fff"/>
  <circle cx="${f(x + rx * 0.35)}" cy="${f(y + r * 0.35)}" r="${f(r * 0.14)}" fill="#fff" opacity=".85"/></g>`;
}

/** Front head (0,0 = between the eyes). turn -1..1 turns the face for a three-quarter view. */
function head(P, id) {
  const F = fills(P, id), t = P.turn, L = [];
  const sn = P.snout, ex = 15, eR = P.eyeR;
  // ears: hang to the jaw, curly; the far ear is smaller in a turned view
  for (const s of [-1, 1]) {
    const far = t * s > 0 ? 1 - Math.abs(t) * 0.35 : 1;
    L.push(blob(P, cloud(s * (40 - t * s * 7), 24, 13 * far, 35, 14, { bump: 0.2, rot: -s * 7, seed: 30 + s }), F.ear));
    L.push(texture(P, s * (40 - t * s * 7), 24, 11 * far, 32, 8, 40 + s, -s * 7));
  }
  // skull: round teddy head with a soft topknot
  L.push(blob(P, cloud(0, 2, 42, 39, 22, { bump: P.bump * 0.75, seed: 3 }), F.fl));
  L.push(blob(P, cloud(-2 + t * 6, -31, 25, 9, 10, { bump: P.bump * 0.8, seed: 4 }), F.fl));
  L.push(texture(P, 0, -6, 36, 26, 16, 5));
  // eyes: small, amber, bright; little curl brows above
  const eL = -ex + t * 12, eRx = ex + t * 12;
  L.push(eye(P, F, eL, 0, eR, t > 0 ? 1 - t * 0.3 : 1));
  L.push(eye(P, F, eRx, 0, eR, t < 0 ? 1 + t * 0.3 : 1));
  L.push(`<path d="M${f(eL - 6)},${-eR - 4} q6,-4 11,-1 M${f(eRx - 5)},${-eR - 5} q6,-3 11,1" fill="none" stroke="${P.light}" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>`);
  // muzzle: a bit longer (sn), slightly lighter tips
  const mx = t * 16, my = 19 + 5 * sn, mry = 14 + 7 * sn;
  L.push(blob(P, cloud(mx, my, 17, mry, 14, { bump: P.bump * 0.6, seed: 8 }), F.mz));
  L.push(texture(P, mx, my - 2, 15, mry * 0.8, 6, 9));
  // small, tidy moustache tufts beside the nose
  const ny = my - mry * 0.12;
  for (const s of [-1, 1]) L.push(blob(P, cloud(mx + s * 9, ny + 9, 8.5, 6, 7, { bump: 0.3, seed: 12 + s }), F.mz));
  // chin
  L.push(blob(P, cloud(mx, my + mry * 0.85, 9, 5, 6, { bump: 0.3, seed: 15 }), F.mz));
  // mouth
  if (P.tongue) {
    L.push(`<path d="M${f(mx - 9)},${f(ny + 12)} Q${f(mx)},${f(ny + 24)} ${f(mx + 9)},${f(ny + 12)} Z" fill="#3a1610"/>`);
    L.push(`<path d="M${f(mx - 5)},${f(ny + 15)} Q${f(mx - 5)},${f(ny + 27)} ${f(mx)},${f(ny + 27)} Q${f(mx + 5)},${f(ny + 27)} ${f(mx + 5)},${f(ny + 15)} Z" fill="#f48aa0" stroke="#c2526a" stroke-width="1"/>`);
  } else {
    L.push(`<path d="M${f(mx)},${f(ny + 6)} v4 M${f(mx - 7)},${f(ny + 11)} q7,5 7,-1 q0,6 7,1" fill="none" stroke="${P.nose}" stroke-width="1.5" stroke-linecap="round"/>`);
  }
  // nose: dark chocolate button
  L.push(`<path d="M${f(mx - 8)},${f(ny - 3)} Q${f(mx)},${f(ny - 7)} ${f(mx + 8)},${f(ny - 3)} Q${f(mx + 8)},${f(ny + 4)} ${f(mx)},${f(ny + 6.5)} Q${f(mx - 8)},${f(ny + 4)} ${f(mx - 8)},${f(ny - 3)} Z" fill="${P.nose}"/>`);
  L.push(`<ellipse cx="${f(mx - 2.5)}" cy="${f(ny - 2.5)}" rx="3" ry="1.4" fill="#fff" opacity=".35"/>`);
  return L.join('');
}

function tag(P, x, y) {
  return `<path d="M${x},${y - 3} v4" stroke="#c9c9c9" stroke-width="1.6"/>
  <path d="M${x},${y + 15} C${x - 11},${y + 8} ${x - 9},${y} ${x - 4},${y} C${x - 2},${y} ${x},${y + 2} ${x},${y + 3} C${x},${y + 2} ${x + 2},${y} ${x + 4},${y} C${x + 9},${y} ${x + 11},${y + 8} ${x},${y + 15} Z" fill="${P.tag}" stroke="#8f141a" stroke-width="1"/>
  <text x="${x}" y="${y + 8.4}" font-family="Segoe UI, sans-serif" font-weight="800" font-size="4.3" fill="#fff" text-anchor="middle">MARS</text>`;
}

function sitFront(P, id) {
  const F = fills(P, id), hs = P.headScale ?? 1, bs = P.bodyScale ?? 1, L = [];
  L.push(`<ellipse cx="120" cy="228" rx="${70 * bs}" ry="7" fill="#000" opacity=".12"/>`);
  L.push(`<g transform="translate(120 228) scale(${bs}) translate(-120 -228)">`);
  L.push(blob(P, cloud(170, 172, 13, 30, 10, { bump: 0.38, rot: 35, seed: 50 }), F.fl)); // plume tail
  L.push(texture(P, 170, 172, 11, 26, 5, 51, 35));
  for (const s of [-1, 1]) { L.push(blob(P, cloud(120 + s * 36, 200, 27, 25, 11, { bump: P.bump, seed: 52 + s }), F.fl)); L.push(texture(P, 120 + s * 36, 200, 24, 22, 6, 54 + s)); }
  L.push(blob(P, cloud(120, 168, 40, 50, 20, { bump: P.bump * 0.75, seed: 56 }), F.fl));
  L.push(texture(P, 120, 168, 36, 44, 18, 57));
  for (const s of [-1, 1]) {
    L.push(blob(P, cloud(120 + s * 16, 198, 12, 26, 10, { bump: P.bump, seed: 58 + s }), F.fl));
    L.push(texture(P, 120 + s * 16, 196, 10, 22, 5, 60 + s));
    L.push(blob(P, cloud(120 + s * 17, 221, 14, 8, 8, { bump: 0.3, seed: 62 + s }), F.fl));
  }
  L.push(`<path d="M93,124 Q120,140 147,124" fill="none" stroke="${P.collar}" stroke-width="4" stroke-linecap="round"/>`);
  L.push(tag(P, 120, 134));
  L.push(`</g>`);
  L.push(`<g transform="translate(120 ${f(228 - 146 * bs - (hs - 1) * 40 + (P.headY ?? 0))}) rotate(${P.tilt}) scale(${hs})">${head(P, id)}</g>`);
  return L.join('');
}

function trot(P, id) {
  const F = fills(P, id), L = [];
  L.push(`<ellipse cx="118" cy="228" rx="80" ry="7" fill="#000" opacity=".12"/>`);
  const leg = (x, y, a, far, seed) => `<g transform="rotate(${a} ${x} ${y})" opacity="${far ? 1 : 1}">${blob(P, cloud(x, y + 26, 10, 28, 10, { bump: P.bump, seed }), far ? F.ear : F.fl)}${blob(P, cloud(x + 4, y + 54, 12, 7, 7, { bump: 0.3, seed: seed + 1 }), far ? F.ear : F.fl)}</g>`;
  L.push(leg(78, 150, 14, true, 70), leg(160, 150, -14, true, 72));
  L.push(blob(P, cloud(52, 118, 12, 30, 10, { bump: 0.4, rot: -45, seed: 74 }), F.fl)); // tail up
  L.push(texture(P, 52, 118, 10, 26, 5, 75, -45));
  L.push(blob(P, cloud(118, 152, 60, 33, 18, { bump: P.bump, seed: 76 }), F.fl));
  L.push(texture(P, 118, 150, 54, 28, 18, 77));
  L.push(leg(92, 152, -12, false, 78), leg(150, 152, 12, false, 80));
  L.push(blob(P, cloud(162, 122, 22, 30, 11, { bump: P.bump, rot: 25, seed: 82 }), F.fl)); // neck
  L.push(`<path d="M150,112 Q160,140 178,128" fill="none" stroke="${P.collar}" stroke-width="4" stroke-linecap="round"/>`);
  L.push(tag(P, 166, 134));
  // profile head: round skull, a medium-long snout, small eye, ear to the jaw
  L.push(blob(P, cloud(172, 90, 29, 27, 14, { bump: P.bump, seed: 84 }), F.fl));
  L.push(blob(P, cloud(170, 64, 15, 7, 6, { bump: 0.42, seed: 85 }), F.fl));
  L.push(texture(P, 168, 86, 24, 20, 9, 86));
  L.push(blob(P, cloud(200, 101, 21, 12.5, 11, { bump: 0.28, seed: 87 }), F.mz));
  L.push(blob(P, cloud(203, 111, 11, 6, 7, { bump: 0.3, seed: 88 }), F.mz)); // small moustache
  L.push(`<path d="M211,93 Q222,93 222,100 Q221,106 213,104 Q208,99 211,93 Z" fill="${P.nose}"/><ellipse cx="216" cy="95.5" rx="3" ry="1.3" fill="#fff" opacity=".35"/>`);
  L.push(`<path d="M206,110 q-6,3 -12,0" fill="none" stroke="${P.nose}" stroke-width="1.5" stroke-linecap="round"/>`);
  if (P.tongue) L.push(`<path d="M196,110 q1,10 6,10 q4,0 4,-9 Z" fill="#f48aa0" stroke="#c2526a"/>`);
  L.push(eye(P, F, 187, 86, P.eyeR * 0.95, 0.85));
  L.push(`<path d="M181,79 q6,-4 11,-1" fill="none" stroke="${P.light}" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>`);
  L.push(blob(P, cloud(166, 106, 11, 24, 12, { bump: 0.2, rot: 10, seed: 89 }), F.ear));
  L.push(texture(P, 166, 106, 9, 21, 5, 90, 10));
  return L.join('');
}

function lieWithToy(P, id) {
  const F = fills(P, id), L = [];
  L.push(`<ellipse cx="120" cy="228" rx="100" ry="7" fill="#000" opacity=".12"/>`);
  L.push(blob(P, cloud(214, 196, 11, 26, 9, { bump: 0.4, rot: 70, seed: 91 }), F.fl));
  L.push(blob(P, cloud(150, 190, 72, 32, 20, { bump: P.bump, seed: 92 }), F.fl));
  L.push(texture(P, 150, 186, 66, 26, 20, 93));
  L.push(blob(P, cloud(186, 202, 30, 22, 11, { bump: P.bump, seed: 94 }), F.fl));
  // plush planet toy
  L.push(`<ellipse cx="96" cy="208" rx="34" ry="7" fill="none" stroke="#f2b33d" stroke-width="5" transform="rotate(-12 96 208)"/>
  <circle cx="96" cy="206" r="19" fill="#e86f4a"/><path d="M80,198 q16,6 32,0 M78,210 q18,6 36,0" stroke="#c9563a" stroke-width="3" fill="none"/>
  <circle cx="90" cy="203" r="2" fill="#2b1611"/><circle cx="102" cy="203" r="2" fill="#2b1611"/><path d="M92,209 q4,3 8,0" stroke="#2b1611" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M62,212 Q96,224 130,204" fill="none" stroke="#f2b33d" stroke-width="5" stroke-linecap="round"/>`);
  for (const [x, s] of [[54, 95], [140, 97]]) { L.push(blob(P, cloud(x, 214, 26, 11, 11, { bump: P.bump, seed: s }), F.fl)); L.push(texture(P, x, 214, 22, 8, 5, s + 1)); }
  L.push(`<path d="M68,150 Q96,166 124,150" fill="none" stroke="${P.collar}" stroke-width="4" stroke-linecap="round"/>`);
  L.push(`<g transform="translate(98 146) rotate(-6) scale(.9)">${head(P, id)}</g>`);
  return L.join('');
}

const C = (n, name, note, P, pose, cls = '') => ({ n, name, note, P: { ...BASE, ...P }, pose, cls });
const concepts = [
  C(1, 'Young Mars', 'The base drawing: a 1-year-old with a round curly head, a slightly longer snout, a small moustache and small amber eyes.', {}, sitFront),
  C(2, 'Head tilt', 'The same dog with the head tilted and the tongue out, the "what are you doing?" face.', { tilt: -12, tongue: true }, sitFront),
  C(3, 'Three-quarter', 'Head turned towards you. Shows the length of the snout better than straight from the front.', { turn: 0.6 }, sitFront),
  C(4, 'Trotting', 'Side view on the move, the pose for walking along the taskbar. Here the longer snout is easiest to see.', { tongue: true }, trot),
  C(5, 'With the plush', 'Lying down with the head on the plush toy, like the animated picture.', {}, lieWithToy),
  C(6, 'Teddy', 'Extra young: bigger head, smaller body, rounder curls. The cutest and most "puppy" of the ten.', { headScale: 1.2, bodyScale: 0.85, headY: -12, bump: 0.4, curlSize: 4.5, eyeR: 5.6 }, sitFront),
  C(7, 'Fluffy fleece', 'A fuller, fluffier coat with more curls, like Mars after a bath and a blow-dry.', { bump: 0.45, curlCount: 1.7, curlSize: 3.4 }, sitFront),
  C(8, 'Sticker', 'Concept 1 with a thin dark outline and a white edge, so Mars stays clear on any wallpaper.', { lw: 1.8, tongue: true }, sitFront, 'sticker'),
  C(9, 'Flat & friendly', 'Flat colours with round curl dots, no shading. Clean modern look, simplest to animate.', { flat: true, bump: 0.36 }, sitFront),
  C(10, 'Warm chocolate', 'Same as 1 in the warmer, lighter brown of the animated picture, with brighter amber eyes.', { coat: '#5e3522', dark: '#43251a', mid: '#7a4a30', light: '#a06a46', tips: '#b98055', tilt: 6 }, sitFront),
];

let uid = 0;
function svgFor(c) {
  const id = 'c' + c.n + '_' + (++uid);
  return `<svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Concept ${c.n}: ${c.name}">${defs(id, c.P)}${c.pose(c.P, id)}</svg>`;
}

module.exports = { concepts, svgFor };
