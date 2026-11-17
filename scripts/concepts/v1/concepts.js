// Builds 10 concept drawings of Mars (the real dog: very dark chocolate, shaggy wavy coat, long beard with golden-brown tips,
// fringe over light amber eyes, big dark nose, long low ears, lean and long-legged, pink-red harness with a round MARS tag).
const fs = require('fs');
const path = require('path');
const { rng, shaggy, lock, strands, eye, f } = require('./fur');

const BASE = { coat: '#2e1b13', coat2: '#20120c', mid: '#43281b', hi: '#8a5538', tips: '#b07a4c', harness: '#e8335a', tag: '#ff5c80', line: 'none', lw: 0, shag: 0.14, eyeR: 8.5 };

function defs(id, P) {
  return `<defs>
    <radialGradient id="amber${id}" cx="45%" cy="40%" r="60%"><stop offset="0" stop-color="#f2c06a"/><stop offset=".6" stop-color="#c47f2c"/><stop offset="1" stop-color="#6b3c12"/></radialGradient>
    <linearGradient id="beard${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.coat}"/><stop offset=".55" stop-color="${P.mid}"/><stop offset="1" stop-color="${P.tips}"/></linearGradient>
    <linearGradient id="earG${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.coat2}"/><stop offset="1" stop-color="${P.mid}"/></linearGradient>
    <radialGradient id="sheen${id}" cx="40%" cy="25%" r="70%"><stop offset="0" stop-color="#fff" stop-opacity="${P.sheen ?? 0.1}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  </defs>`;
}
const fur = (P, d, fill) => `<path d="${d}" fill="${fill}" ${P.lw ? `stroke="${P.line}" stroke-width="${P.lw}" stroke-linejoin="round"` : ''}/>`;
const hair = (P, d, color, w = 1.6, op = 0.55) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" opacity="${op}"/>`;

/** The head, centred on (0,0) = middle between the eyes. */
function head(P, id, s = 1) {
  const sh = P.shag, eR = P.eyeR, ex = P.eyeGap ?? 19, ey = 0;
  const L = [];
  // ears: long, low, wavy
  L.push(fur(P, lock(-48, -10, 30, P.earLen ?? 92, { tufts: 4, tilt: -8, seed: 11 }), `url(#earG${id})`));
  L.push(fur(P, lock(48, -10, 30, P.earLen ?? 92, { tufts: 4, tilt: 8, seed: 12 }), `url(#earG${id})`));
  L.push(hair(P, strands(-50, 30, 10, 36, 14, { len: 14, seed: 13, wave: 4 }), P.hi, 1.6, 0.5));
  L.push(hair(P, strands(50, 30, 10, 36, 14, { len: 14, seed: 14, wave: 4 }), P.hi, 1.6, 0.5));
  // skull + top-knot (tufts sticking up)
  L.push(fur(P, shaggy(0, -2, 50, P.skullH ?? 46, 18, { len: sh, grav: 0.35, seed: 15 }), P.coat));
  L.push(fur(P, shaggy(0, -42, 30, 12, 9, { len: 0.35, grav: -0.25, seed: 16 }), P.coat));
  L.push(fur(P, shaggy(0, 30, 42, 26, 12, { len: 0.2, grav: 0.8, seed: 24 }), P.coat));
  L.push(`<ellipse cx="-6" cy="-18" rx="44" ry="34" fill="url(#sheen${id})"/>`);
  L.push(hair(P, strands(0, -20, 40, 24, 30, { len: 12, seed: 17, dir: 80, spread: 70 }), P.hi, 1.5, 0.45));
  // eyes
  L.push(eye(-ex, ey, eR, { iris: `url(#amber${id})`, lid: P.coat, lidDrop: P.lidDrop ?? 0.06, glint: true }));
  L.push(eye(ex, ey, eR, { iris: `url(#amber${id})`, lid: P.coat, lidDrop: P.lidDrop ?? 0.06, glint: true }));
  // fringe / eyebrows hanging over the eyes, golden-brown at the ends
  const fr = P.fringe ?? 1;
  L.push(fur(P, shaggy(-ex - 2, -eR - 10 + 5 * (fr - 1), 14, 4 + 2 * fr, 7, { len: 0.25 + 0.3 * (fr - 1) + 0.1, grav: 0.9, rot: -8, seed: 18 }), `url(#beard${id})`));
  L.push(fur(P, shaggy(ex + 2, -eR - 10 + 5 * (fr - 1), 14, 4 + 2 * fr, 7, { len: 0.25 + 0.3 * (fr - 1) + 0.1, grav: 0.9, rot: 8, seed: 19 }), `url(#beard${id})`));
  // beard + moustache: long, golden tips
  L.push(fur(P, shaggy(0, 26 + ((P.beardH ?? 52) - 52) / 3, (P.beardW ?? 46) / 2 + 4, 22, 12, { len: 0.32, grav: 1.2, seed: 20 }), `url(#beard${id})`));
  L.push(fur(P, shaggy(-13, 22, 15, 11, 8, { len: 0.35, grav: 1.1, rot: 15, seed: 21 }), `url(#beard${id})`));
  L.push(fur(P, shaggy(13, 22, 15, 11, 8, { len: 0.35, grav: 1.1, rot: -15, seed: 22 }), `url(#beard${id})`));
  L.push(hair(P, strands(0, 36, 20, 16, 24, { len: 12, seed: 23, wave: 2 }), P.tips, 1.5, 0.7));
  // big dark nose
  L.push(`<path d="M-13,14 Q0,6 13,14 Q15,23 4,28 Q0,30 -4,28 Q-15,23 -13,14 Z" fill="#120a08" ${P.lw ? `stroke="${P.line}" stroke-width="${P.lw * 0.6}"` : ''}/>`);
  L.push(`<ellipse cx="-4" cy="13.5" rx="5" ry="2.3" fill="#fff" opacity=".35"/>`);
  if (P.tongue) L.push(`<path d="M-6,44 Q-6,56 0,56 Q6,56 6,44 Z" fill="#ff7d93" stroke="#c4495f" stroke-width="1.5"/>`);
  return `<g transform="scale(${s})">${L.join('')}</g>`;
}

function harness(P, cx, y, w = 38) {
  return `<path d="M${cx - w},${y - 8} Q${cx},${y + 18} ${cx + w},${y - 8}" fill="none" stroke="${P.harness}" stroke-width="8" stroke-linecap="round"/>
  <path d="M${cx},${y + 6} V${y + 46}" stroke="${P.harness}" stroke-width="8" stroke-linecap="round"/>
  <path d="M${cx - 6},${y + 6} l6,-6 6,6" fill="none" stroke="#b7b7b7" stroke-width="2"/>
  <circle cx="${cx}" cy="${y + 18}" r="11" fill="${P.tag}" stroke="#b81f45" stroke-width="2"/>
  <text x="${cx}" y="${y + 20.5}" font-family="Segoe UI, sans-serif" font-weight="800" font-size="6.5" fill="#fff" text-anchor="middle">MARS</text>`;
}

/** Sitting, front view (photos 5 and 7). */
function sitFront(P, id) {
  const leg = P.legLen ?? 92, bw = P.bodyW ?? 56, hs = P.headScale ?? 1, hy = P.headY ?? 100;
  return `<ellipse cx="150" cy="286" rx="96" ry="8" fill="#000" opacity=".15"/>
  ${fur(P, shaggy(226, 250, 12, 30, 9, { len: 0.3, grav: 0.4, rot: 35, seed: 1 }), P.coat2)}
  ${fur(P, shaggy(108, 254, 38, 28, 12, { len: P.shag, seed: 2 }), P.coat2)}
  ${fur(P, shaggy(192, 254, 38, 28, 12, { len: P.shag, seed: 3 }), P.coat2)}
  ${fur(P, shaggy(150, 214, bw, 66, 16, { len: P.shag, seed: 4 }), P.coat)}
  ${hair(P, strands(150, 214, bw - 10, 52, 40, { len: 14, seed: 5, wave: 4 }), P.hi, 1.5, 0.45)}
  ${fur(P, lock(130, 284 - leg, 24, leg, { tufts: 3, seed: 6, flare: 1.1 }), P.coat)}
  ${fur(P, lock(170, 284 - leg, 24, leg, { tufts: 3, seed: 7, flare: 1.1 }), P.coat)}
  ${hair(P, strands(130, 284 - leg / 2, 8, leg / 2.4, 10, { len: 14, seed: 8 }), P.hi, 1.4, 0.45)}
  ${hair(P, strands(170, 284 - leg / 2, 8, leg / 2.4, 10, { len: 14, seed: 9 }), P.hi, 1.4, 0.45)}
  ${fur(P, shaggy(150, 182, 34, 30, 12, { len: 0.25, grav: 0.8, seed: 10 }), P.coat)}
  ${harness(P, 150, 178)}
  <g transform="translate(150,${hy})">${head(P, id, hs)}</g>`;
}

/** Lying down like a sphinx, head up (photos 2 and 8). */
function lieDown(P, id) {
  return `<ellipse cx="150" cy="284" rx="130" ry="9" fill="#000" opacity=".15"/>
  ${fur(P, shaggy(252, 248, 14, 30, 9, { len: 0.3, grav: 0.3, rot: 70, seed: 31 }), P.coat2)}
  ${fur(P, shaggy(180, 238, 92, 44, 20, { len: P.shag, seed: 32 }), P.coat)}
  ${fur(P, shaggy(232, 252, 40, 30, 12, { len: P.shag, seed: 33 }), P.coat2)}
  ${hair(P, strands(180, 232, 80, 34, 50, { len: 16, seed: 34, dir: 10, spread: 50, wave: 4 }), P.hi, 1.5, 0.45)}
  ${fur(P, lock(106, 236, 26, 46, { tufts: 3, tilt: -10, seed: 35 }), P.coat)}
  ${fur(P, lock(152, 238, 26, 44, { tufts: 3, tilt: 6, seed: 36 }), P.coat)}
  ${fur(P, shaggy(98, 276, 22, 10, 8, { len: 0.2, seed: 37 }), P.coat)}${fur(P, shaggy(160, 277, 22, 10, 8, { len: 0.2, seed: 38 }), P.coat)}
  ${harness(P, 128, 208, 30)}
  <g transform="translate(128,150) rotate(-4)">${head(P, id, 1.05)}</g>`;
}

/** Three-quarter sitting pose like the current app, but shaggy and dark. */
function sitSide(P, id) {
  return `<ellipse cx="160" cy="286" rx="118" ry="8" fill="#000" opacity=".15"/>
  ${fur(P, shaggy(58, 196, 13, 38, 9, { len: 0.35, grav: 0.4, rot: -40, seed: 41 }), P.coat2)}
  ${fur(P, shaggy(126, 222, 74, 58, 18, { len: P.shag, seed: 42 }), P.coat)}
  ${fur(P, shaggy(96, 250, 40, 32, 12, { len: P.shag, seed: 43 }), P.coat2)}
  ${hair(P, strands(126, 216, 62, 44, 50, { len: 16, seed: 44, dir: 60, wave: 4 }), P.hi, 1.5, 0.45)}
  ${fur(P, lock(176, 190, 22, 94, { tufts: 3, seed: 45 }), P.coat2)}
  ${fur(P, lock(210, 186, 24, 98, { tufts: 3, seed: 46 }), P.coat)}
  ${fur(P, shaggy(194, 196, 34, 40, 12, { len: 0.25, grav: 0.8, seed: 47 }), P.coat)}
  ${harness(P, 194, 182, 30)}
  <g transform="translate(196,104) rotate(6)">${head(P, id, 0.98)}</g>`;
}

/** Flat, geometric, sticker-simple. */
function minimal(P) {
  return `<ellipse cx="150" cy="286" rx="90" ry="8" fill="#000" opacity=".15"/>
  <path d="M206,250 q40,-10 34,-60" fill="none" stroke="${P.coat2}" stroke-width="16" stroke-linecap="round"/>
  <rect x="96" y="160" width="108" height="126" rx="54" fill="${P.coat}"/>
  <rect x="116" y="196" width="26" height="90" rx="13" fill="${P.mid}"/><rect x="158" y="196" width="26" height="90" rx="13" fill="${P.mid}"/>
  <path d="M112,180 Q150,204 188,180" fill="none" stroke="${P.harness}" stroke-width="9" stroke-linecap="round"/>
  <circle cx="150" cy="200" r="11" fill="${P.tag}"/><text x="150" y="202.5" font-family="Segoe UI" font-weight="800" font-size="6.5" fill="#fff" text-anchor="middle">MARS</text>
  <path d="M92,74 Q78,84 82,150 Q88,170 104,160 Q112,120 110,84 Z" fill="${P.coat2}"/>
  <path d="M208,74 Q222,84 218,150 Q212,170 196,160 Q188,120 190,84 Z" fill="${P.coat2}"/>
  <rect x="96" y="48" width="108" height="112" rx="48" fill="${P.coat}"/>
  <circle cx="128" cy="52" r="12" fill="${P.coat}"/><circle cx="150" cy="46" r="14" fill="${P.coat}"/><circle cx="172" cy="52" r="12" fill="${P.coat}"/>
  <path d="M112,84 h28 l-4,8 h-20 Z M160,84 h28 l-4,8 h-20 Z" fill="${P.tips}"/>
  <circle cx="128" cy="100" r="8" fill="#e0a24c"/><circle cx="172" cy="100" r="8" fill="#e0a24c"/>
  <circle cx="128" cy="100" r="4" fill="#0d0705"/><circle cx="172" cy="100" r="4" fill="#0d0705"/>
  <circle cx="130.5" cy="97.5" r="1.8" fill="#fff"/><circle cx="174.5" cy="97.5" r="1.8" fill="#fff"/>
  <path d="M118,114 Q150,104 182,114 L176,160 Q150,176 124,160 Z" fill="${P.tips}"/>
  <path d="M124,118 Q150,110 176,118 L170,148 Q150,160 130,148 Z" fill="${P.mid}"/>
  <rect x="136" y="110" width="28" height="18" rx="9" fill="#120a08"/>`;
}

/** Pixel art (16-bit game sprite). */
function pixel() {
  const map = [
    '..........KK.K.KK...........',
    '.........KKKKKKKKK..........',
    '........KKHKKKKKHKK.........',
    '.......KKKKKKKKKKKKK........',
    '......DKKKKKKKKKKKKKD.......',
    '.....DDKKKTKKKKKTKKKDD......',
    '.....DDKKEEKKKKEEKKKDD......',
    '.....DDKKPEKKKKPEKKKDD......',
    '.....DDKKKKKKKKKKKKKDD......',
    '.....DDDKKKTNNNTKKKDDD......',
    '.....DDDKKTMNNNMTKKDDD......',
    '.....DDDKKMMMMMMMKKDDD......',
    '......DDDKTMTTTMTKDDD.......',
    '......DDD.KTTTTTK.DDD.......',
    '.......D..RRRRRRR..D........',
    '.........KKKRYRKKKK.........',
    '........KKKKKRKKKKKK.....D..',
    '.......KKKKKHRKKKKKKK...DD..',
    '.......KKKKKKKKKKKKKKK.DD...',
    '......DKKKKKKKKKKKKKKKKD....',
    '......DDKKMKKKKKKMKKKDD.....',
    '......DDDKMKKKKKKMKKDDD.....',
    '......DDDKKKKKKKKKKKDDD.....',
    '.......DDKKK.KK.KKKKDD......',
    '........MMMM....MMMM........',
  ];
  const C = { K: '#2b1912', D: '#1e110c', H: '#7a4a30', T: '#a8734a', M: '#3d2419', E: '#e0a24c', P: '#0d0705', N: '#120a08', R: '#e8335a', Y: '#ff9db3' };
  const px = 10, ox = 10, oy = 30; let s = `<ellipse cx="150" cy="284" rx="96" ry="8" fill="#000" opacity=".15"/>`;
  map.forEach((row, y) => [...row].forEach((c, x) => { if (C[c]) s += `<rect x="${ox + x * px}" y="${oy + y * px}" width="${px + 0.3}" height="${px + 0.3}" fill="${C[c]}"/>`; }));
  return `<g shape-rendering="crispEdges">${s}</g>`;
}

const concepts = [
  { n: 1, name: 'Faithful', note: 'Closest to the photos: lean, long legs, long beard with golden tips, fringe over amber eyes, pink harness with the MARS tag.', P: {}, draw: sitFront },
  { n: 2, name: 'Big-head cartoon', note: 'Same dog, cartoon proportions: big head, bigger eyes, shorter legs. Most expressive for emotions.', P: { headScale: 1.3, eyeR: 10.5, legLen: 74, bodyW: 50, headY: 104, lidDrop: 0, fringe: 0.6 }, draw: sitFront },
  { n: 3, name: 'Shaggy mop', note: 'Extra long, wild coat; the fringe almost hides the eyes (like the photo lying on the floor).', P: { shag: 0.28, fringe: 2.1, lidDrop: 0.18, eyeR: 8, earLen: 106, beardH: 62 }, draw: sitFront },
  { n: 4, name: 'Soft storybook', note: 'Warmer, glossy coat with more shine, lighter highlights and a little tongue. Friendly picture-book look.', P: { coat: '#33201a', mid: '#4a2c1f', hi: '#a0684a', tips: '#c08a5a', sheen: 0.22, tongue: true, eyeR: 9.5, lidDrop: 0 }, draw: sitFront },
  { n: 5, name: 'Bold outline', note: 'Same shapes with a dark ink outline and a white sticker edge: reads best small on a busy desktop.', P: { line: '#0a0504', lw: 2.4, eyeR: 9, headScale: 1.12, headY: 102 }, draw: sitFront, cls: 'sticker' },
  { n: 6, name: 'Three-quarter', note: 'The current app pose (side, head turned to you) but with the real coat, colours and face.', P: { eyeR: 7.5 }, draw: sitSide },
  { n: 7, name: 'Lying down', note: 'Sphinx pose with paws forward, like on the couch. Calm, cosy desk companion.', P: { eyeR: 8 }, draw: lieDown },
  { n: 8, name: 'Flat & simple', note: 'Geometric shapes, no fur detail. Clean modern icon style; easiest to animate.', P: {}, draw: minimal },
  { n: 9, name: 'Comic ink', note: 'Thick black lines and light fur strokes: a comic-strip look with lots of character.', P: { line: '#000', lw: 3.2, hi: '#c79a7a', tips: '#c08a5a', eyeR: 9, shag: 0.2 }, draw: sitFront },
  { n: 10, name: 'Pixel art', note: 'A retro game sprite. Charming and crisp at any size; animations would be frame-by-frame.', P: {}, draw: pixel },
];

function svgFor(c) {
  const P = { ...BASE, ...c.P };
  return `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Concept ${c.n}: ${c.name}">${defs(c.n, P)}${c.draw(P, c.n)}</svg>`;
}

module.exports = { concepts, svgFor };
if (require.main === module) {
  const out = process.argv[2];
  const cards = concepts.map((c) => `<figure class="card ${c.cls || ''}"><div class="art">${svgFor(c)}</div><figcaption><b>${c.n}. ${c.name}</b><span>${c.note}</span></figcaption></figure>`).join('\n');
  fs.writeFileSync(out, `<!doctype html><html><head><meta charset="utf-8"><style>
  body{margin:0;background:#efe9df;font-family:Segoe UI,sans-serif}
  .grid{display:grid;grid-template-columns:repeat(5,300px);gap:14px;padding:14px}
  .card{margin:0;background:#fbf8f3;border-radius:14px;padding:6px 8px 10px}
  .art svg{width:284px;height:284px;display:block}
  .sticker svg{filter:drop-shadow(2px 0 0 #fff) drop-shadow(-2px 0 0 #fff) drop-shadow(0 2px 0 #fff) drop-shadow(0 -2px 0 #fff)}
  figcaption{font-size:12px;color:#3a2a20}figcaption b{display:block;font-size:15px}
  </style></head><body><div class="grid">${cards}</div></body></html>`);
  console.log('wrote', out);
}
