// Makes assets/icon.png (256x256, round) from the app's own dog drawing, so the tray icon always matches Mars.
// Run: npm run icon   (electron scripts/make-icon.js). Uses only Electron; no image tools needed.
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SIZE = 256;
const html = fs.readFileSync(path.join(ROOT, 'src', 'index.html'), 'utf8');
const svg = html.match(/<template id="dogTpl">([\s\S]*?)<\/template>/)[1]
  // crop to the head (view-box units of the dog SVG)
  .replace(/viewBox="[^"]*"/, 'viewBox="102 2 214 214"');

const page = `<!doctype html><meta charset="utf-8">
<link rel="stylesheet" href="${path.join(ROOT, 'src', 'style.css').replace(/\\/g, '/')}">
<style>
  html, body { margin: 0; background: transparent; overflow: hidden; }
  .badge { position: relative; width: ${SIZE}px; height: ${SIZE}px; border-radius: 50%; overflow: hidden; background: #f3e4cf;
    box-sizing: border-box; border: 9px solid #d8262f; }
  .badge svg { position: absolute; inset: -6px; width: calc(100% + 12px); height: calc(100% + 12px); }
  .bobber, .tail { animation: none !important; }
  .shadow { display: none; }
</style>
<div class="badge">${svg}</div>`;

app.disableHardwareAcceleration();
app.whenReady().then(async () => {
  const tmp = path.join(os.tmpdir(), 'mars-icon.html');
  fs.writeFileSync(tmp, page);
  const w = new BrowserWindow({ width: SIZE, height: SIZE, show: false, frame: false, transparent: true, useContentSize: true });
  await w.loadFile(tmp);
  await new Promise((r) => setTimeout(r, 400));
  const img = await w.webContents.capturePage({ x: 0, y: 0, width: SIZE, height: SIZE });
  fs.writeFileSync(path.join(ROOT, 'assets', 'icon.png'), img.resize({ width: SIZE, height: SIZE }).toPNG());
  fs.unlinkSync(tmp);
  console.log('Saved assets/icon.png');
  app.quit();
});
