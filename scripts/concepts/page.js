// Builds the concept-picker page (static HTML, photos embedded as data URIs).
const fs = require('fs');
const path = require('path');
const { concepts, svgFor } = require('./concepts');
const out = process.argv[2];
const img = (f) => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(__dirname, f)).toString('base64');

const photos = [['p1.jpg', 'Sitting on the couch'], ['p2.jpg', 'In the park'], ['p3.jpg', 'Lying down']]
  .map(([f, c]) => `<figure class="photo"><img src="${img(f)}" alt="Mars, ${c.toLowerCase()}"><figcaption>${c}</figcaption></figure>`).join('');

const cards = concepts.map((c) => `
  <article class="card${c.cls ? ' ' + c.cls : ''}" id="c${c.n}">
    <div class="stage">
      <span class="num">${c.n}</span>
      <div class="big">${svgFor(c)}</div>
      <div class="small" title="Actual size on the desktop">${svgFor(c)}<span>desktop size</span></div>
    </div>
    <h2>${c.name}</h2>
    <p>${c.note}</p>
  </article>`).join('');

const html = `<title>Mars Concepts</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&family=Inter:wght@400;500;600&display=swap">
<style>
/* Layout: photos of the real dog as the reference strip, then a grid of concept cards, each with a large view and a desktop-size view. */
:root {
  --bg: #e9ede6;        /* the sage wall of Mars's living room */
  --panel: #f8f9f5;
  --ink: #241a15;
  --muted: #5e5650;
  --line: #d3d9cf;
  --accent: #e8335a;    /* the harness */
  --stage: #ffffff;
  --display: "Nunito", "Segoe UI", system-ui, sans-serif;
  --body: "Inter", "Segoe UI", system-ui, sans-serif;
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
  --bg: #171a17; --panel: #212521; --ink: #eee9e3; --muted: #b0a8a0; --line: #343a33; --accent: #ff5c80; --stage: #dfe4da; color-scheme: dark; } }
:root[data-theme="dark"] { --bg: #171a17; --panel: #212521; --ink: #eee9e3; --muted: #b0a8a0; --line: #343a33; --accent: #ff5c80; --stage: #dfe4da; color-scheme: dark; }

body { background: var(--bg); color: var(--ink); font-family: var(--body); line-height: 1.5; }
.wrap { max-width: 1240px; margin: 0 auto; padding-block: 28px 56px;
  padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }
header { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 24px; align-items: end; }
h1 { font-family: var(--display); font-weight: 900; font-size: clamp(30px, 5vw, 46px); line-height: 1.05; margin: 0 0 10px; text-wrap: balance; }
h1 em { font-style: normal; color: var(--accent); }
.lede { margin: 0; max-width: 62ch; color: var(--muted); }
.photos { display: flex; gap: 10px; }
.photo { margin: 0; width: 120px; }
.photo img { width: 120px; height: 120px; object-fit: cover; border-radius: 14px; display: block; }
.photo figcaption { font-size: 12px; color: var(--muted); margin-top: 4px; text-align: center; }
.traits { display: flex; flex-wrap: wrap; gap: 6px; margin: 18px 0 26px; padding: 0; list-style: none; }
.traits li { font-size: 13px; font-weight: 600; padding: 4px 10px; border-radius: 99px; background: var(--panel); border: 1px solid var(--line); }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 220px), 1fr)); gap: 14px; }
.card { background: var(--panel); border: 1px solid var(--line); border-radius: 16px; padding: 12px 14px 16px; min-width: 0; }
.stage { position: relative; background: var(--stage); border-radius: 12px; display: grid; grid-template-columns: minmax(0, 1fr) 64px; align-items: end; padding: 6px 8px 8px; }
.big svg { width: 100%; height: auto; display: block; max-width: 260px; }
.small { display: flex; flex-direction: column; align-items: center; gap: 2px; padding-bottom: 6px; }
.small svg { width: 60px; height: 60px; display: block; }
.small span { font-size: 10px; color: #6d655e; letter-spacing: .04em; text-transform: uppercase; }
.num { position: absolute; top: 8px; left: 10px; font-family: var(--display); font-weight: 900; font-size: 22px; color: #fff; background: var(--accent);
  width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; }
.card h2 { font-family: var(--display); font-weight: 800; font-size: 20px; margin: 12px 0 2px; }
.card p { margin: 0; font-size: 14px; color: var(--muted); }
.sticker svg { filter: drop-shadow(2px 0 0 #fff) drop-shadow(-2px 0 0 #fff) drop-shadow(0 2px 0 #fff) drop-shadow(0 -2px 0 #fff); }
footer { margin-top: 28px; color: var(--muted); font-size: 14px; max-width: 70ch; }
footer b { color: var(--ink); }
@media (max-width: 760px) { header { grid-template-columns: 1fr; } .photo, .photo img { width: 96px; } .photo img { height: 96px; } }
</style>
<div class="wrap">
  <header>
    <div>
      <h1>Which one is <em>Mars</em>?</h1>
      <p class="lede">Round 2: ten drawings of the same dog, Mars at one year old, in different poses and styles, based on the photos and on how Australian cobberdogs look. Each card shows the drawing large and at the real size it will have on your screen.</p>
    </div>
    <div class="photos">${photos}</div>
  </header>
  <ul class="traits" aria-label="What the concepts take from the photos">
    <li>One year old</li><li>Soft, curly chocolate fleece</li><li>Round teddy head</li><li>Snout a bit longer</li>
    <li>Small, tidy moustache</li><li>Small amber eyes</li><li>Floppy curly ears</li><li>Plume tail</li><li>Red MARS tag</li>
  </ul>
  <main class="grid">${cards}</main>
  <footer><b>How to choose:</b> tell Claude the number you like best. You can also mix, for example "the face of 2 with the coat of 3", or ask for changes such as bigger eyes, a longer snout or a different pose. The chosen style then replaces the current dog in the app, with all moods and activities.</footer>
</div>
`;
fs.writeFileSync(out, html);
console.log('wrote', out, Math.round(html.length / 1024) + ' KB');
