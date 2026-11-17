'use strict';
const path = require('path');
const fs = require('fs');
const { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage, powerMonitor } = require('electron');
const { createStore, readEnv } = require('./store');
const { createAI } = require('./ai');
const { startActivityWatcher } = require('./activity');
const L = require('../src/logic');
const { classifyApp } = L;

// Menu labels in Dutch (the bubble texts live in src/logic.js).
const NLM = {
  'Chat with Mars': 'Praat met Mars', 'How are you, Mars?': 'Hoe gaat het, Mars?', 'Tell me a dog fact': 'Vertel een hondenfeitje', 'Dance!': 'Dans!', 'Give Mars a treat': 'Geef Mars een koekje',
  "Copy what I'm doing": 'Doe na wat ik doe', 'Learn about me (stays on this PC)': 'Leer mij kennen (blijft op deze pc)',
  'What do you know about me?': 'Wat weet je over mij?', 'Forget everything you learned': 'Vergeet alles wat je geleerd hebt',
  'Quiet mode': 'Stille modus', '30 minutes': '30 minuten', '1 hour': '1 uur', '2 hours': '2 uur', 'Quiet mode off': 'Stille modus uit', 'Quiet until {t}': 'Stil tot {t}',
  'Language': 'Taal', 'Hide Mars (the tray icon brings Mars back)': 'Verberg Mars (terughalen via het systeemvak)', 'Start with Windows': 'Start met Windows',
  'Quit Mars': 'Mars afsluiten', 'Show Mars': 'Toon Mars', 'Hide Mars': 'Verberg Mars',
};
const curLang = () => (store && store.get().lang === 'nl' ? 'nl' : 'en');
const Mn = (s) => (curLang() === 'nl' && NLM[s]) || s;

app.setName('Mars');
const ROOT = path.join(__dirname, '..');
const WIN_HEIGHT = 440;
const SNAPSHOTS = process.argv.includes('--snapshots');

let win = null;
let tray = null;
let store = null;
let ai = null;
let hidden = false;
let mimicOn = true;
let learnOn = true;
let memory = null;
let memoryDirty = false;
let memoryFile = '';
let lastSampleAt = 0;

function loadMemory() { try { memory = Object.assign(L.emptyMemory(), JSON.parse(fs.readFileSync(memoryFile, 'utf8'))); } catch { memory = L.emptyMemory(); } }
function saveMemory() { if (!memoryDirty) return; memoryDirty = false; try { fs.writeFileSync(memoryFile, JSON.stringify(memory)); } catch { /* ignore */ } }
function forgetAll() { memory = L.emptyMemory(); memoryDirty = true; saveMemory(); if (ai) ai.reset(); }
let watcher = null;
let topLevel = 'normal';

/** Over a game Mars must be visible, so use the highest level then; over everything else stay polite (no covering video / presentations). */
function setTopLevel(level) {
  if (!win || level === topLevel) return;
  topLevel = level;
  win.setAlwaysOnTop(true, level);
  if (process.argv.includes('--mars-debug')) console.log('[mars] always-on-top level ->', level);
}

if (!SNAPSHOTS && !app.requestSingleInstanceLock()) { app.quit(); }
else {
  app.on('second-instance', () => showMars());
  app.whenReady().then(start);
}
app.on('window-all-closed', () => { if (SNAPSHOTS) app.quit(); /* otherwise stay alive in the tray */ });

function iconImage() {
  const p = path.join(ROOT, 'assets', 'icon.png');
  return fs.existsSync(p) ? nativeImage.createFromPath(p) : nativeImage.createEmpty();
}

function workArea() { return screen.getPrimaryDisplay().workArea; }

/** The window covers the whole work area (click-through), so Mars can live anywhere on the screen. */
function placeWindow() {
  const a = workArea();
  win.setBounds({ x: a.x, y: a.y, width: a.width, height: a.height });
}

function setAutostart(on) {
  // Unpackaged (dev / `npm start`) runs electron.exe with the app folder as argument.
  app.setLoginItemSettings({ openAtLogin: !!on, name: 'Mars', path: process.execPath, args: app.isPackaged ? [] : [app.getAppPath()] });
}
function autostartOn() { return app.getLoginItemSettings({ name: 'Mars', path: process.execPath, args: app.isPackaged ? [] : [app.getAppPath()] }).openAtLogin; }

function createWindow() {
  win = new BrowserWindow({
    width: 800, height: WIN_HEIGHT, x: 0, y: 0,
    frame: false, transparent: true, backgroundColor: '#00000000', hasShadow: false,
    skipTaskbar: true, resizable: false, movable: false, minimizable: false, maximizable: false, fullscreenable: false,
    alwaysOnTop: true, focusable: true, show: false, title: 'Mars', icon: iconImage(),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  placeWindow();
  win.setIgnoreMouseEvents(true, { forward: true }); // click-through until the pointer is over Mars
  win.loadFile(path.join(ROOT, 'src', 'index.html'));
  win.once('ready-to-show', () => win.showInactive());
  win.webContents.on('render-process-gone', () => { try { win.reload(); } catch { /* ignore */ } });
}

let hideTimer = null;
function showMars() {
  if (!win) return;
  clearTimeout(hideTimer); hideTimer = null;
  hidden = false;
  placeWindow();
  win.showInactive();
  win.webContents.send('shown'); // the renderer lets Mars trot out of the kennel
  refreshTray();
}
/** Hiding: Mars first trots into the kennel (renderer answers 'home-done'); the window hides after that, or after 6 s at the latest. */
function hideMars() {
  if (!win || hidden) return;
  hidden = true;
  refreshTray();
  if (!win.isVisible()) { finishHide(); return; }
  win.webContents.send('go-home');
  clearTimeout(hideTimer); hideTimer = setTimeout(finishHide, 6000);
}
function finishHide() {
  clearTimeout(hideTimer); hideTimer = null;
  if (!win || !hidden) return; // shown again in the meantime
  win.hide();
  win.webContents.send('hidden');
}

function refreshTray() {
  if (!tray) return;
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: hidden ? Mn('Show Mars') : Mn('Hide Mars'), click: () => (hidden ? showMars() : hideMars()) },
    { label: Mn('Start with Windows'), type: 'checkbox', checked: autostartOn(), click: (i) => { setAutostart(i.checked); store.set({ autostart: i.checked }); } },
    { type: 'separator' },
    { label: Mn('Quit Mars'), click: () => app.quit() },
  ]));
}

function setLang(l) { store.set({ lang: l }); refreshTray(); if (win) win.webContents.send('menu', 'lang'); }

function start() {
  store = createStore(app.getPath('userData'));
  const env = readEnv(path.join(ROOT, '.env'), path.join(app.getPath('userData'), '.env'));
  ai = createAI({
    apiKey: env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY || '',
    ollamaModel: env.OLLAMA_MODEL || process.env.OLLAMA_MODEL || '',
    ollamaHost: env.OLLAMA_HOST || process.env.OLLAMA_HOST || undefined,
  });

  if (SNAPSHOTS) return runSnapshots();

  createWindow();
  tray = new Tray(iconImage().resize({ width: 32, height: 32 }));
  tray.setToolTip('Mars');
  tray.on('click', () => (hidden ? showMars() : hideMars()));
  refreshTray();

  // First run: start with Windows by default; afterwards respect the user's choice.
  const saved = store.get();
  if (saved.autostart === undefined) { setAutostart(true); store.set({ autostart: true }); }
  else if (saved.autostart) setAutostart(true); // re-assert, e.g. after the project folder moved

  screen.on('display-metrics-changed', () => win && placeWindow());
  // Copy what the user is doing (foreground app). Only the process name is read; it never leaves this machine.
  mimicOn = saved.mimic !== false;
  learnOn = saved.learn !== false;
  if (!saved.lang) store.set({ lang: String(app.getLocale()).toLowerCase().startsWith('nl') ? 'nl' : 'en' });
  refreshTray();
  memoryFile = path.join(app.getPath('userData'), 'memory.json');
  loadMemory();
  setInterval(saveMemory, 60000);
  app.on('will-quit', saveMemory);
  watcher = startActivityWatcher((s) => {
    if (learnOn && s.name) { // learn only from the process name; elapsed time is capped so standby does not count
      const now = Date.now(); const secs = Math.min(5, lastSampleAt ? (now - lastSampleAt) / 1000 : 2.5); lastSampleAt = now;
      L.recordSample(memory, s.name, classifyApp(s.name, s.full, s.media), secs, new Date()); memoryDirty = true;
    }
    if (!win || hidden || !mimicOn) return;
    if (s.name !== 'electron' && s.name !== 'Mars') setTopLevel(classifyApp(s.name, s.full, s.media) === 'game' ? 'screen-saver' : 'normal');
    win.webContents.send('activity', s);
  });
  if (process.argv.includes('--mars-debug')) {
    win.webContents.on('console-message', (e) => { if (e.level === 'error' || e.level === 'warning') console.log('[renderer ' + e.level + ']', e.message, e.sourceId + ':' + e.lineNumber); });
    setTimeout(async () => { try { const img = await win.webContents.capturePage(); fs.writeFileSync(path.join(app.getPath('temp'), 'mars_window.png'), img.toPNG()); console.log('[mars] window captured', await win.webContents.executeJavaScript("(()=>{const s=document.querySelector('.dog-svg');const l=document.querySelector('.lid');return JSON.stringify({emo:s.dataset.emo,act:s.dataset.act,cls:s.className.baseVal,lid:getComputedStyle(l).transform,lidv:getComputedStyle(s).getPropertyValue('--lid')})})()")); } catch (e) { console.log('[mars] capture failed', e.message); } }, 9000);
    setInterval(() => { if (win) console.log('[mars] visible=' + win.isVisible(), JSON.stringify(win.getBounds()), 'onTop=' + win.isAlwaysOnTop(), 'level=' + topLevel); }, 3000);
  }
  app.on('will-quit', () => watcher && watcher.stop());

  screen.on('display-added', () => win && placeWindow());
  screen.on('display-removed', () => win && placeWindow());

  ipcMain.on('ignore-mouse', (_e, ignore) => { if (win) win.setIgnoreMouseEvents(!!ignore, { forward: true }); });
  ipcMain.handle('store:get', () => store.get());
  ipcMain.handle('store:set', (_e, patch) => store.set(patch && typeof patch === 'object' ? patch : {}));
  ipcMain.handle('ai:status', () => ({ available: ai.available() }));
  // Seconds since the last keyboard/mouse input anywhere (a number only; nothing about what was typed or where).
  ipcMain.handle('sys:idle', () => powerMonitor.getSystemIdleTime());
  ipcMain.handle('ai:chat', (_e, text, ctx) => {
    text = String(text || ''); ctx = ctx && typeof ctx === 'object' ? ctx : {};
    if (learnOn) { if (ctx.kind !== 'checkin') L.addFacts(memory, L.extractFacts(text)); memoryDirty = true; ctx.memory = L.summarizeMemory(memory); } else ctx.memory = '';
    return ai.chat(text, ctx);
  });
  ipcMain.handle('memory:summary', () => ({ on: learnOn, text: L.summarizeMemory(memory) }));
  ipcMain.on('hide', hideMars);
  ipcMain.on('home-done', finishHide);
  ipcMain.on('focus', () => { if (win && !win.isFocused()) win.focus(); });
  ipcMain.on('context-menu', () => {
    const send = (id) => win && win.webContents.send('menu', id);
    const quietUntil = Number(store.get().quietUntil) || 0;
    Menu.buildFromTemplate([
      { label: Mn('Chat with Mars'), click: () => send('chat') },
      { label: Mn('How are you, Mars?'), click: () => send('howareyou') },
      { label: Mn('Tell me a dog fact'), click: () => send('fact') },
      { label: Mn('Dance!'), click: () => send('dance') },
      { label: Mn('Give Mars a treat'), click: () => send('treat') },
      { type: 'separator' },
      { label: Mn("Copy what I'm doing"), type: 'checkbox', checked: mimicOn, click: (i) => { mimicOn = i.checked; store.set({ mimic: mimicOn }); if (!mimicOn && win) win.webContents.send('activity', { name: '', full: false }); } },
      { label: Mn('Learn about me (stays on this PC)'), type: 'checkbox', checked: learnOn, click: (i) => { learnOn = i.checked; store.set({ learn: learnOn }); } },
      { label: Mn('What do you know about me?'), click: () => send('know') },
      { label: Mn('Forget everything you learned'), click: () => { forgetAll(); send('forgot'); } },
      { type: 'separator' },
      { label: Mn('Quiet mode'), submenu: [
        ...(quietUntil > Date.now() ? [{ label: Mn('Quiet until {t}').replace('{t}', new Date(quietUntil).toTimeString().slice(0, 5)), enabled: false }] : []),
        { label: Mn('30 minutes'), click: () => send('quiet30') },
        { label: Mn('1 hour'), click: () => send('quiet60') },
        { label: Mn('2 hours'), click: () => send('quiet120') },
        { label: Mn('Quiet mode off'), enabled: quietUntil > Date.now(), click: () => send('quietOff') },
      ] },
      { label: Mn('Language'), submenu: [
        { label: 'English', type: 'radio', checked: curLang() === 'en', click: () => setLang('en') },
        { label: 'Nederlands', type: 'radio', checked: curLang() === 'nl', click: () => setLang('nl') },
      ] },
      { label: Mn('Hide Mars (the tray icon brings Mars back)'), click: hideMars },
      { label: Mn('Start with Windows'), type: 'checkbox', checked: autostartOn(), click: (i) => { setAutostart(i.checked); store.set({ autostart: i.checked }); refreshTray(); } },
      { label: Mn('Quit Mars'), click: () => app.quit() },
    ]).popup({ window: win });
  });
}

/** `npm run snapshots`: renders every emotion/activity on an opaque window and saves one PNG. */
function runSnapshots() {
  const out = path.join(ROOT, 'docs', 'snapshots.png');
  // enableLargerThanScreen: Windows must not shrink the sheet to fit a small or scaled (e.g. 150%) screen.
  const w = new BrowserWindow({ width: 1800, height: 1420, show: false, useContentSize: true, enableLargerThanScreen: true, webPreferences: { contextIsolation: true, preload: path.join(__dirname, 'preload.js') } });
  w.setContentSize(1800, 1420);
  w.loadFile(path.join(ROOT, 'src', 'index.html'), { query: { snap: '1' } });
  w.webContents.once('did-finish-load', () => setTimeout(async () => {
    const img = await w.webContents.capturePage();
    fs.writeFileSync(out, img.toPNG());
    console.log('Saved', out);
    app.quit();
  }, 1500));
}
