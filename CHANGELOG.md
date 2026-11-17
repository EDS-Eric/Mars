# Changelog

All notable changes. Format: [Keep a Changelog](https://keepachangelog.com), versions `MAJOR.MINOR.PATCH`
(pre-1.0: minor = features, patch = fixes and documentation).

## [0.3.2] — 2026-11-17

### Added
- **Desktop shortcut.** A `Mars` shortcut on the desktop starts Mars directly (no console window), with the cobberdog icon.
  `scripts/make-shortcut.ps1` creates it (and `assets/icon.ico`, the 256 px `icon.png` in an ICO container, since shortcuts can't use a PNG).

### Changed
- **Slower typing**: the typing animation at the laptop now runs at about half speed.

## [0.3.1] — 2026-11-17

### Changed
- **Higher happy jump**: about twice as high, with a crouch, a stretch in the air and a little squash on landing (0.66 s). Hops wait for it.

### Fixed
- **Sniffing for an answer puts the laptop away.** While mirroring work (laptop and glasses) Mars kept the laptop during the sniffing; now any mirrored
  prop (laptop, book, game, mic) is put away while sniffing and comes back with the answer. A mirroring change during the sniffing waits for it.

## [0.3.0] — 2026-11-17

### Added
- **Food hunt when you're away**: after 2 minutes without keyboard or mouse input Mars roams the whole screen sniffing for food, sometimes finds a crumb
  (happy hop, quick chew), and trots home as soon as you're back. Not during a video or a game, never a bubble. Reads only the idle seconds
  (`powerMonitor`), new bridge call `idleSeconds()`.
- **Happy to see you**: hops around at every start; the very first start is a longer party with hearts (remembered as `metAt`).
- **Marsi**: writing the nickname in the chat makes Mars jump around before answering (scripted reply without AI; the persona knows the nickname).
- Tests for the new rules (`wantsFoodHunt`, `userBack`, `huntSpot`, `callsPetName`, `welcomeHops`, persona).

### Changed
- **Waiting for the AI**: Mars sniffs the floor for an answer (nose down, slowly back and forth) instead of the thinking pose; the thinking pose,
  thought bubbles and "hmm" mouth are removed. Also used for the evening check-in.

## [0.2.1] — 2026-11-17

### Fixed
- **Typing on the laptop looks right now.** The screen faced the viewer, the keyboard was a thin slanted strip under the chest and the paw covered the
  screen. Mars now sits behind the open laptop: you see the back of the lid (paw-print logo), the screen faces Mars and lights the face with a soft,
  gently pulsing blue glow, and Mars peeks over the lid with the reading glasses on.

## [0.2.0] — 2026-11-17

### Changed
- **New look: concept 9, "Flat & friendly"**, chosen from the concept sheet. Mars now looks one year old: flat chocolate colours with round
  curl dots and soft thin outlines, small amber eyes, a narrower and slightly longer snout with a small moustache, no pom-pom on top, a dark
  collar with a red heart tag. Same parts and animations, so all moods and activities work as before.
- **Tray icon** redrawn in the new style: rendered from the dog SVG by `npm run icon` (`scripts/make-icon.js`, Electron only), replacing the
  PowerShell crop of the animated picture.

### Added
- **Concept sheet** `docs/concepts/mars-concepts.html`, round 2: ten drawings of the same dog, Mars at one year old (soft curly
  chocolate fleece, round teddy head, a slightly longer snout, a small moustache, small amber eyes), in different poses and styles, next to the
  real photos, to choose the new look. Generator in `scripts/concepts/` (`node scripts/concepts/page.js <out.html>`).
  Round 1 (shaggy, looked too old and too unlike Mars) is kept as `mars-concepts-v1.html` with its generator in `scripts/concepts/v1/`.

## [0.1.0] — 2026-11-17

### Added
- **Mars**, an animated cartoon Australian cobberdog for the Windows desktop, built on the Sharky 0.6.0 engine and drawn after the real Mars
  (animated picture `assets/photos/Mars.jfif`): curly chocolate fur (generated curl outlines), big amber eyes with moving lids and eyebrows,
  dark button nose, floppy ears, wagging plume tail, red collar with a gold tag.
- Everything Sharky does, as a dog: greetings, "how was your day?", emotions (happy = tongue out and panting, sad = drooping ears), pokes,
  grumpy bad days and mood swings, mirroring games / work (laptop + reading glasses) / reading, singing along becomes **howling** at a
  microphone with sunglasses, **head tilt**, chat via Claude Haiku 5.5 or a local Ollama model, learning (local only),
  English / Nederlands, quiet mode, drag anywhere, tray, start with Windows.
- Dog life: **trotting** (legs, ears and dust puffs), **sniffing** the floor, playing with the **plush planet toy** (*squeak!*), chewing a **bone**,
  the **head tilt** while looking around, chasing the tail (dance), lying down to **sleep** with the toy.
- **Give Mars a treat** in the right-click menu.
- A **kennel** with a MARS sign replaces Sharky's cave: hiding Mars makes it appear in the nearest bottom corner and Mars trots in.
- Tray icon made from Mars's face in the animated picture (`npm run icon`).
- Dog facts (incl. cobberdog facts) and dog-flavoured lines in English and Dutch.
