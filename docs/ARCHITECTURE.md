# Architecture

```
┌──────────────────────────── Electron main process ────────────────────────────┐
│ main.js    BrowserWindow (transparent, frameless, always-on-top, click-through) │
│            Tray · login item · single-instance lock · context menu · IPC        │
│ ai.js      Claude Haiku 5.5 chat (key from .env) ──► reply {emotion, text} | null│
│ activity.js foreground-app watcher (persistent PowerShell) -> IPC `activity`      │
│ store.js   userData/mars.json: name, greeted, askedDay, slept, autostart      │
└───────────────▲──────────────── preload.js (window.mars) ────────────────────┘
                │ IPC: ignore-mouse · store:get/set · ai:chat · hide · menu · shown
┌───────────────┴────────────── Renderer (src/) ─────────────────────────────────┐
│ index.html   CSP + <template> with the dog SVG                                │
│ style.css    palette · [data-emo] faces · [data-act] props/animations · bubble  │
│ renderer.js  movement · bubble · activities · daily rhythm · input              │
│ logic.js     pure rules (also used by tests)                                    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## The window

One window covering the whole work area (above the taskbar), so Mars can be dragged anywhere; the spot is `home: {x, y}` in the store (x = left, y = px above the bottom). It is re-placed on display changes and the spot is clamped with `L.clampPos`.
It is click-through (`setIgnoreMouseEvents(true, {forward: true})`); the renderer watches `mousemove` (still forwarded) and
switches interaction on only when the pointer is over `.hit` (the dog's body) or `.bubble.show`, or while dragging.

## The dog

A single inline SVG in a flat style: scalloped curly outlines, round curl dots, small amber eyes. Layers: shadow, tail, torso (body, hind leg), far front leg, chest, lying paws, props (book, console, laptop, plush toy, bone), near front leg, collar, **head** (far ear, head, curl dots, muzzle (`.snout`, scaled longer) with a small moustache, cheeks, two eyes (each scaled to 0.56: amber, pupil, **lid**, ring,
closed-eye arc), eyebrows, glasses, `.lower-face` (nose and the mouths, moved down for the longer snout), sunglasses, nine mouths, near ear), microphone, decorations (tears, anger mark,
hearts, sparkles, Zzz, notes, sweat).

- **Emotion** (`data-emo`): sets the lid height/slant (`--lid`, `--rotL`, `--rotR`), the eyebrows (`--browL`, `--browR`, `--browY`), the mouth, cheeks, ears, decorations
  and, for angry and grumpy, the fur colour (CSS variables `--fur`, `--fur-dark`, `--muzzle`).
- **Activity** (`data-act`): `idle`, `read`, `game`, `laptop`, `sing`, `sleep`, `toy`, `bone`, `dance`…`dance6`, `wave`, `jump`, `shake`, `sigh`, `hug`, `look` (head tilt). Lying activities (`sleep`, `toy`, `bone`) hide the standing front legs and show `.lying` paws.
- **Modifiers** on the root: `walking` (fast tail), `face-left`, `dragging`, `in-cave` (shrunk + invisible, inside the kennel), `sniffing` (nose down); on the SVG: `talking` (mouth flap) and `blink`.

## The rhythm

| Loop | Period | Does |
|---|---|---|
| `tick` | 20 s | mood of the day, mood decay toward it, rare mood swing, sleep/wake, once-per-period greeting, loneliness, rare chatter |
| `idleLoop` | 12–35 s | picks an activity with `pickActivity` (weighted by mood) and runs it |
| blink | 2–6 s | eyelid close for 140 ms |

Anything the user does calls `interrupt()`, which cancels walking and activity waits via a token.

## Conversation

`say(text, {emotion, choices, input, ttl})` shows the bubble and resolves with the clicked value / typed text / `null` on timeout.
`chatLoop` repeats `say(..., {input: true})` with the reply of `ai:chat` (or `fallbackReply`) until the user closes it.

## Mirroring

`activity.js` emits `{name, full, media}` every 2.5 s (`media` = some app is playing, from Windows' media controls via WinRT in the same PowerShell; only the playback status, never titles). The renderer classifies it with `L.classifyApp`, debounces, and sets `S.mimicAct` (`game`, `laptop`, `sing`, `read`). A browser in front while media plays is `watch` -> `sing` (sunglasses, mic, dance).

While a model reply is pending, `sniffFor(promise)` puts `.sniffing` on the root and trots slowly back and forth near the spot until the reply (or the fallback) arrives.

**Food hunt.** `huntLoop` asks the main process every 5 s for `powerMonitor.getSystemIdleTime()` (`window.mars.idleSeconds()`: a number only).
`L.wantsFoodHunt` (2 min idle, not asleep / hidden / in the kennel / watching / gaming) starts `foodHunt`: sniffing walks to `L.huntSpot`s all over the
screen, sometimes a crumb (jump + `bone`). The hunt owns `idleBusy` while it runs; anything that interrupts it (chat, poke, drag, mirroring, kennel)
takes over, bedtime releases it. Input again (`L.userBack`) -> `endHunt`: trot home, happy.

**Hops.** `hopAround(n, emo)` restarts the one-shot `jump` animation n times with small sideways moves (`moveTo(..., { noTrot: true })`). Used at start
(`L.welcomeHops`: 3, or 7 with hearts the very first time, remembered as `metAt` in the store) and when a chat message contains *Marsi* (`L.callsPetName`).
`setAct(null)` returns to that act, the idle loop pauses, and `tick` defers greetings and chatter while gaming.

## Learning

`main.js` feeds every watcher sample to `L.recordSample` (pure, in `logic.js`) and every chat message to `L.extractFacts`. State is kept in `memory.json`
(saved every 60 s and on quit). `ai:chat` attaches `L.summarizeMemory` as `ctx.memory`; `ai.js` uses it only for the Ollama provider.

## Data

`userData/mars.json` (`%APPDATA%\Mars`): `name`, `nameAsked`, `greeted` (period key), `askedDay`, `slept`, `autostart`.
`memory.json` holds the learned counters and facts. Nothing else is stored; chat history lives in memory in the main process (last 12 messages) and is gone after quitting.

## Mood of the day

`L.pickDayMood` rolls good / normal / bad once per day (kept in the store as `dayMood: {day, kind}`). `Mood.base` is set from it, `decay` moves the mood
toward the base instead of 0, and `L.moodSwing` gives a rare jump (per tick). `Mood.emotion()`: >= 35 happy, <= -60 sad, <= -25 grumpy. The day mood is passed
to the model as `ctx.dayMood` (Mars's own state, no user data).

## Hiding (the kennel)

Tray / menu "hide" -> main sends `go-home` and keeps the window up. The renderer shows `.cave` (the kennel) in the nearest bottom corner (`L.caveSide`), walks Mars onto its
mouth, adds `in-cave`, fades the kennel and sends `home-done`; main then hides the window (or after 6 s at the latest). "Show" -> `shown` -> `comeOut()`
reverses it and walks Mars back to the home spot.
