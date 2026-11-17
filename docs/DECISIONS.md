# Decisions

Short records of why things are the way they are. Newest last.

1. **Electron, not .NET / Python.** The one hard requirement is a dog with *no window shape*: a transparent, frameless window plus
   vector animation. Electron gives that with a few options, SVG + CSS animates cleanly, and Node is already installed on the
   user's PC (no .NET SDK there; Python 3.14 has no PySide wheels yet). Cost: a ~100 MB runtime. A packaged installer is on the roadmap.
2. **One wide, short, click-through window instead of a small window that moves.** The window spans the work area's width (440 px
   high, bottom-aligned above the taskbar). Mars trots *inside* it, so no OS window ever moves and the bubble can use any space.
   `setIgnoreMouseEvents(true, {forward: true})` makes everything click-through; the renderer turns it off only while the pointer
   is over the dog or an open bubble.
3. **Default always-on-top level, not `screen-saver`.** Mars should not sit over fullscreen games and videos.
4. **`showInactive()` and `skipTaskbar`.** Starting at logon must never steal focus or add a taskbar button. The window is still
   focusable so the chat box works.
5. **Hiding = tray, quitting = explicit.** Closing the window does nothing; the tray icon (and the right-click menu) hides, shows and
   quits. "Always there unless I decide to minimize it" maps to hide-to-tray.
6. **Start with Windows via `setLoginItemSettings`**, named `Mars`, with `path`/`args` so it also works unpackaged. On by default on
   first run, toggle in the tray and right-click menu; re-asserted at every start while enabled.
7. **"Fastest AI model" = Claude Haiku 5.5 (`claude-haiku-5-5`), used only for conversation.** Greetings, idle life and reactions
   are scripted: instant, free, offline, and predictable (Mars must not nag or surprise). The model is called when the user types to Mars.
   Calls run in the main process so the key never reaches the page; `.env` is git-ignored; `.env.example` is committed.
8. **AI is optional and degrades silently.** No key, network error, timeout (15 s) or a `refusal` stop reason all fall back to
   `fallbackReply`. Haiku 5.5 rejects sampling parameters, so none are sent; speed settings (thinking disabled, `effort: low`) are
   tried first and retried plain on a 400.
9. **The model tags its feeling** (`[happy] ...`) so Mars's face matches what Mars says; the tag is parsed and stripped, unknown tags
   become neutral. Replies are capped at 320 characters and markdown is stripped.
10. **Pure logic in `src/logic.js` (UMD).** The renderer and the Node tests load the same file, so time-of-day, mood, poke counting,
    activity choice and reply parsing are unit-tested without Electron.
11. **Emotions and activities are CSS state, not JS animation.** `data-emo` and `data-act` on the SVG select eyelids, mouth, props and
    animations. `npm run snapshots` renders them all into one PNG so changes can be *looked at*.
12. **Not needy by design.** One greeting per part of the day, the "how was your day" question once per evening and timing out
    silently, chatter every 25–55 min with 70 % probability, a single "lonely" note after 2 h without contact.
13. **Sleep 23:00–06:00, waking Mars is allowed but costs mood.** Mars wakes grumpy, then returns to sleep after ~90 s.
14. **GitHub**: the `gh` CLI is not installed, so no remote is created. `push-to-github.bat` (same pattern as Nexus) pushes once the
    empty repository exists on github.com.
15. **Icon drawn in code** (`scripts/make-icon.js`, own PNG encoder with `zlib`), so there is no image tool dependency; output committed.
16. **Mirroring = foreground process name, polled by one persistent PowerShell (0.2.0).** No native module (no compiler toolchain on the user's PC, and a
    prebuilt `active-win` would be a new dependency); one hidden `powershell.exe` compiles a tiny `user32` P/Invoke once and prints `name|fullscreen` every
    2.5 s, so there is no process spawn per sample. **Privacy**: window titles are not read; only the process name is used, it is classified locally in the
    renderer, and it is never stored, logged or sent to the AI. Toggle in the right-click menu.
17. **Games are recognised three ways**: a list of well-known executables, Unreal `*-Win64-Shipping`, and "any fullscreen window that is not the desktop, a video
    player, a browser or remote control". The last rule catches new games but can mislabel exotic fullscreen apps; those go into `NOT_GAME_FULLSCREEN`.
18. **Debounce instead of reacting instantly**: 3 samples (~7 s) to start mirroring, 5 (~12 s) to stop. Alt-tabbing should not make Mars twitch, and Mars must not
    run to the laptop for a two-second Word peek.
19. **Mirroring is an act that survives interruptions.** `setAct(null)` falls back to the mimicked activity, so pokes, greetings and chat end back at the laptop or
    game. Random idle life pauses while mirroring; sleeping (23:00–06:00) still wins.
20. **Mars never talks over a game**: greeting, evening question, loneliness and chatter are deferred while the category is `game`.
21. **Always-on-top level follows the foreground app.** Normal level by default (decision 3); `screen-saver` while the foreground app is a game, because
    mirroring a game Mars cannot be seen over is pointless. Exclusive-fullscreen (DirectFlip) games cannot be overlaid by any normal window; that is accepted.
22. **`--mars-debug`** instead of guessing: window state and a self-capture (`webContents.capturePage`) are the only reliable way to see a transparent
    window when something else covers it. (`--debug` is rejected by Node itself, hence the longer flag.)
23. **Ollama as an optional local brain (0.2.4).** Plain `fetch` to `/api/chat` (no new dependency), main process only, same persona and `[emotion]` tag parsing.
    Precedence: Anthropic key, else `OLLAMA_MODEL`, else scripted. Ollama being down just means scripted replies; the user never sees an error.
24. **Learning = local counters + stated facts (0.3.0).** The user asked for Mars to get to know them. Habits are *aggregated seconds* per process name and per
    (part of day, category), never a timeline and never window titles, so the file can't reveal what was on screen at a given moment. Facts come only from what the
    user typed to Mars (regex, no model call). Both live in `memory.json` in userData.
25. **Memory reaches the local model only.** `ai.js` adds the summary to the prompt only when the provider is Ollama; a test asserts it never appears in a Claude request.
    On by default because it was requested; one click turns it off, "Forget everything" wipes it, "What do you know about me?" shows it.
26. **Languages as one table (0.4.0).** `STR.en` / `STR.nl` in `logic.js`, accessed with `tr(lang, key, vars)`; missing keys fall back to English, and a test fails when
    the two tables drift. No i18n library. Default language = Windows locale, stored in `mars.json`.
27. **Quiet mode only silences what Mars starts.** Greetings, the evening question, loneliness, chatter and the good-night speech wait; anything the user starts (poke, chat,
    menu) still works. A skipped greeting is not marked as done, so it happens after quiet mode ends if it still applies.
28. **The check-in reaction comes from the model when one is connected.** The rating is sent as a meta-message (`kind: 'checkin'`) that is *not* mined for facts; a typed
    answer is treated as normal chat and can teach Mars something. Any failure falls back to the scripted reaction.
29. **Laptop drawn screen-first.** The previous lid-back drawing read as "the wrong way round"; a front view with a lit screen matches how the handheld is drawn.
30. **Generous local timeout (0.4.1).** Ollama gets 90 s (Claude keeps 15 s) plus `keep_alive: 30m`: on small GPUs a 4B model needs 20-40 s per reply, and a slow
    real answer beats a fast scripted one. The "..." bubble waits as long as the request can.
31. **Full-work-area window instead of a bottom strip (0.5.0).** Moving the window itself would mean resizing/positioning a native window on every drag frame and
    clipping the bubble; a click-through window over the work area lets Mars and the bubble go anywhere with plain CSS. Click-through rules are unchanged.
32. **Mood of the day as a drift target (0.5.0).** A bad day is a lower `Mood.base`, not a script: everything that already reads the mood (activities, "how are you",
    the AI) follows automatically, and cheering Mars up still works but wears off. Rolled once per day and stored, so a restart doesn't reroll it.
    Muttering about a swing is short, rare (35% of rare swings) and silent in quiet mode / during games: never nag.
33. **The kennel delays the hide, main keeps a 6 s deadline (0.5.0).** The animation needs the window visible, so main waits for `home-done`, but a stuck renderer
    can never keep Mars on screen after the user asked to hide Mars.
34. **"Watching YouTube" = browser in front + media playing (0.6.0).** Recognising YouTube itself would need the window or tab title, which Mars never reads.
    Windows' media controls (WinRT `GlobalSystemMediaTransportControlsSessionManager`, read in the existing PowerShell) tell whether anything plays; only that
    flag leaves the process, never titles or artists. Side effect: music from another app while browsing also makes Mars sing, which is in the spirit of it.
    Any failure = flag 0 = the old behaviour.
35. **Thinking is a class, not an act or emotion (0.6.0).** `pondering` overlays whatever Mars is doing (on the laptop too) and cannot leak into the model's emotion tags.

## Mars

36. **Mars is a copy of the Sharky 0.6.0 engine, not a shared library.** Two small apps that may diverge in character are simpler as two repos than as one
    engine with skins. Engine fixes must be applied to both (noted in CLAUDE.md).
37. **The drawing follows the animated picture (`assets/photos/Mars.jfif`).** Big round head, big warm eyes with highlights, button nose, chocolate curls,
    red collar, a plush toy. The curly outlines were generated once by a small script (round arcs around an ellipse) and committed as plain SVG paths, so
    there is still no build step.
38. **The plush toy is a generic plush planet**, not a copy of the character toy in the photos: a nod to the name Mars without using someone else's character.
39. **Props go on the floor, not in the paws.** A sitting dog holding a book or laptop like a person looks wrong; Mars reads, games and types with the book,
    console and laptop on the floor and paws on top. Singing becomes howling at a microphone stand.
40. **Moving = trotting.** The engine still moves in straight lines anywhere on the screen (the desktop is the floor); legs, ears, tail and dust puffs animate
    while `.walking` is on.
41. **Hiding = the kennel** (with a MARS sign, a bowl and a bone) instead of the cave; same mechanics and the same `cave*` names in code.
42. **The icon is Mars's own face.** Since 0.2.0 it is rendered from the app's dog SVG by Electron itself (`scripts/make-icon.js`, `npm run icon`): the head on
    a cream badge with a red ring, so the tray always matches the drawing and no image tool is needed. (0.1.0 cropped the animated picture.)
43. **Separate identity from Sharky**: app name, single-instance lock, userData folder (`%APPDATA%\Mars`), login item and bridge (`window.mars`) all use
    "Mars", so both friends can run at the same time.
44. **No he/she for Mars in docs and texts** (Mars speaks in the first person); easy to change if wanted.
45. **The look is chosen from a concept sheet** (`docs/concepts/`, generator `scripts/concepts/`). Round 1 (shaggy, bearded) looked old and unlike Mars;
    round 2 drew one young dog in ten styles, checked against the cobberdog breed standard (medium muzzle, soft fleece, ears not past the nose).
    The user picked **9, "Flat & friendly"**. Supersedes the look of 37 (big eyes, red collar).
46. **Restyle, don't redraw.** Concept 9 was applied to the existing app SVG: same parts, same transform origins, so every `data-emo` / `data-act` keeps
    working. Flat fills and thin soft outlines; curl strokes became round curl dots; the top-knot pom-pom went (that read as a poodle); each eye is the
    old eye scaled to 0.56 (lids and pupil offsets scale with it, so no CSS numbers changed); the muzzle is scaled narrower and longer and the nose and
    mouths sit 8 units lower (a slightly longer snout); a small moustache; a dark collar with a red heart tag, like the real one.
47. **Laptop = Mars behind the laptop.** A screen that faces the viewer reads as "showing" not "working". The lid's back (paw-print logo) faces the
    viewer, the paws type out of sight behind it, and a soft screen glow on the face (`.screen-glow`, a prop inside `.head`) tells you the screen is on.
    The laptop is drawn after the near leg so the lid covers the paws; it sits below the collar so the tag stays visible.
