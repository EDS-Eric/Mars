# CLAUDE.md

Guidance for Claude Code (and humans) working in this repository.

## What this is

**Mars** — a local, single-user Windows desktop companion: an animated cartoon Australian cobberdog (one year old: soft chocolate curls, small amber eyes,
a dark collar with a red tag, a plush toy) who sits at the bottom-left of the screen, greets the user by time of day, asks how the day was, shows
emotions, and lives a dog's life (trots, sniffs, plays with the plush toy, chews a bone, head tilt, reads, games, dances, sleeps at
night). A friend, not an assistant: Mars must never nag, never block work, and stays until the user hides Mars from the tray or right-click menu.

Built on the same engine as the sister project **Sharky** (`../Sharky`): keep the two in step when fixing engine bugs.
The look follows the real Mars (`assets/photos/`), drawn in the "flat & friendly" style the user chose (concept 9 in `docs/concepts/`). Docs avoid he/she for Mars.

Stack: **Electron** (transparent, frameless, always-on-top window) + plain HTML/CSS/SVG/JS. No build step, no framework.
Optional AI: **Claude Haiku 5.5** (`claude-haiku-5-5`, the fastest model) via `@anthropic-ai/sdk`, main process only; or a local Ollama model.

## Layout

```
main/main.js      window, tray, autostart, IPC, snapshot mode
main/preload.js   the small `window.mars` bridge (contextIsolation on, sandbox on)
main/ai.js        chat: persona, rolling history, [emotion] tag parsing, errors -> null
main/activity.js  foreground-app watcher (persistent PowerShell, process name only) for mirroring the user
main/store.js     JSON settings in userData (mars.json) + minimal .env reader
src/logic.js      PURE rules (periods, mood, pokes, dialogue EN/NL, activity choice). UMD: renderer + node tests
src/renderer.js   behaviour: movement, bubble, activities, daily rhythm, input, kennel
src/index.html    CSP + the dog SVG <template> + the kennel <template>
src/style.css     palette, emotions (data-emo), activities (data-act), animations, bubble
scripts/          make-icon.js (tray icon rendered from the dog SVG), install.ps1
tests/            node:test unit tests (no Electron needed)
docs/             ARCHITECTURE.md, DECISIONS.md, snapshots.png
```

## Rules of the house

- **Behaviour lives in `src/logic.js` when it can be pure**, and gets a test in `tests/logic.test.js`. The renderer only wires it up.
- **Emotion = `data-emo` on the SVG, activity = `data-act`.** New looks are CSS only: add a selector, no JS needed. Check it with
  `npm run snapshots` and *look at* `docs/snapshots.png` (add a cell in `renderer.js` if you add a state).
- The SVG's moving parts are groups with a fixed transform origin in view-box units: `.head` (neck), `.ear`, `.legR-wrap` / `.legL-wrap`
  (shoulders), `.tail`, `.torso`, `.bobber` (whole dog). CSS transforms on these replace each other, so nest a group if two states must combine.
- **Never nag.** Unprompted bubbles are rare and short; anything that asks a question must time out silently.
- **Click-through is sacred.** Only `.hit` (the dog) and `.bubble.show` may receive the mouse; everything else must stay
  `pointer-events: none`. A new interactive element needs `pointer-events: auto` *and* a place in the `closest('.hit, .bubble.show')` check.
- **The API key never reaches the renderer.** All AI calls go through `ipcMain.handle('ai:chat')`. No key / error / refusal
  must degrade to the scripted `fallbackReply`, never to an error message in the bubble.
- **Model**: `claude-haiku-5-5` (fastest). Sampling parameters must not be sent (400 on this model). `ai.js` sends thinking disabled
  + `effort: low` and retries plain on a 400.
- **Privacy of mirroring and learning**: only the foreground *process name* is read, never window titles. Learning keeps *aggregated counters* and facts the user typed in `userData/memory.json`; it is never sent to the cloud (the summary goes into the prompt of the local Ollama model only, see `ai.js`), can be switched off and wiped from the menu. Idle detection (food hunt) reads only *seconds since the last input* via `powerMonitor`. Keep it that way.
- Windows only. Default always-on-top level on purpose (does not cover fullscreen games or video).
- Keep the repo dependency-light: runtime dep is the Anthropic SDK only; dev dep is Electron.

## Run / test

```
npm install
npm start              # real app (needs a desktop session)
npm test               # unit tests
npm run snapshots      # docs/snapshots.png
```

Closing the Electron window does nothing on purpose (tray keeps Mars alive); quit via tray / right-click > Quit Mars.
During development kill stray instances with `Get-Process electron | Stop-Process` (careful: that also stops Sharky).

## Docs to keep up to date

Every change: `CHANGELOG.md` (+ `VERSION`, `package.json` version), `PROMPT_HISTORY.md` (local only, git-ignored: request verbatim + final answer),
`ROADMAP.md`, and `docs/DECISIONS.md` when a choice is made. Do not commit without being asked.
