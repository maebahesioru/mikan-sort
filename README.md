# 🍊 Mikan Sort!

**A recycling game for a cleaner world** — built for the [Girls Who Code HHS Hackathon 2026](https://gwchhs-hackathon-2026.devpost.com/) (theme: *build a game for social good*).

Every year, **wrong sorting** sends recyclables to landfills — and contaminated recycling gets rejected entirely. Mikan Sort! teaches the rules through play: items ride a conveyor, and you sort them into the right bin. Get it right and you learn **why** it goes there.

## Play

Open `index.html` in a browser, or serve locally:

```bash
python3 -m http.server 8000   # then visit http://localhost:8000
```

No build step, no dependencies.

## How to play

- 👆 **Click / tap** an item on the belt to pick it up
- 🗑️ **Click a bin** — or press **1 2 3 4** — to sort the selected item
- ⌨️ Keyboard: `Space`/`Enter` selects the leftmost item, `1-4` sorts it, `Esc` deselects
- ❤️ You have **3 lives** — a wrong bin or a missed item costs one
- ⚠️ The **HAZARD** bin (batteries, e-waste) unlocks at **Level 2**
- 🔥 Sort several in a row for a streak bonus

## Why it matters (social good)

- Confusing recycling rules cause **contamination** — one greasy pizza box can ruin a whole batch of paper recycling.
- **Batteries** in household trash start fires in collection trucks.
- **Food scraps** in landfill release methane; composted, they become soil.
- Each item in the game comes with a one-line fact so players learn *why*, not just *where*.

## Project structure

```
index.html      game shell (canvas + HUD + overlays)
css/style.css   theme & layout
js/items.js     bins + item database (with facts)  ← add items here
js/audio.js     Web Audio sound effects (no audio files)
js/game.js      game loop, conveyor, sorting, scoring
DESIGN.md       full game design document & rubric mapping
```

## Accessibility

Beginner-friendly by design: no tutorial wall (hints are always on screen), large click targets, keyboard-only play, colorblind-aware palette, and reduced-motion support (`prefers-reduced-motion` disables particles/screen shake).

## Rules compliance (GWC HHS Hackathon 2026)

- ✅ Original work — all graphics are code-drawn (emoji glyphs), no third-party assets
- ✅ No secrets in code or demo (no API keys, no external services)
- ✅ AI coding assistants may be used (per event rules); disclosed if requested
- ✅ MIT licensed

## License

MIT — see [LICENSE](LICENSE).
