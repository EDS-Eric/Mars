# Changelog

All notable changes. Format: [Keep a Changelog](https://keepachangelog.com), versions `MAJOR.MINOR.PATCH`
(pre-1.0: minor = features, patch = fixes and documentation).

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
  microphone with sunglasses, thinking pose with a **head tilt**, chat via Claude Haiku 5.5 or a local Ollama model, learning (local only),
  English / Nederlands, quiet mode, drag anywhere, tray, start with Windows.
- Dog life: **trotting** (legs, ears and dust puffs), **sniffing** the floor, playing with the **plush planet toy** (*squeak!*), chewing a **bone**,
  the **head tilt** while looking around, chasing the tail (dance), lying down to **sleep** with the toy.
- **Give Mars a treat** in the right-click menu.
- A **kennel** with a MARS sign replaces Sharky's cave: hiding Mars makes it appear in the nearest bottom corner and Mars trots in.
- Tray icon made from Mars's face in the animated picture (`npm run icon`).
- Dog facts (incl. cobberdog facts) and dog-flavoured lines in English and Dutch.
