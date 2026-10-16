# Mikan Sort! — Game Design Document

> Target: **Girls Who Code HHS Hackathon 2026** (deadline Oct 28, 2026 11:45pm CDT = 10/29 13:45 JST)
> Status: skeleton / playable vertical slice (2026-10-16) — iterate until 10/28.

## 1. Concept

**One-liner**: A conveyor-belt sorting game where you save waste from the landfill by sorting it correctly — and learn *why* each item goes where.

**Real-world issue**: Recycling systems fail largely due to **contamination** (wrong items) and confusion about rules. Up to a quarter of what people put in recycling bins is not recyclable; contaminated loads are landfilled. Batteries cause truck fires; food waste in landfill emits methane.

**Social outcome**: Players internalize sorting rules + the reasoning behind them, and can apply them at home. The end screen quantifies the impact ("You kept N items out of the landfill").

## 2. Core loop (as implemented)

1. Items ride a conveyor right → left. Click/tap to select (keyboard: Space selects leftmost).
2. Choose a bin: RECYCLE / COMPOST / TRASH (HAZARD unlocks at Lv2) — click or keys 1-4.
3. **Correct** → score + streak bonus + green burst + a one-line fact ("why").
4. **Wrong / missed** → lose a life; the game shows the correct bin and the reason.
5. Every 8 correct → level up: faster belt, more items, HAZARD unlock.
6. 0 lives → results: score, accuracy, items saved, best score (localStorage).

## 3. Judging rubric mapping (GWC — 100 pts)

| Category | Pts | How this game scores |
|---|---|---|
| Social Impact | 35 | Clear issue (contamination / wrong sorting), per-item education ("why"), quantified end-screen impact, universal applicability |
| Coding & Implementation | 30 | Zero-dependency vanilla JS; deterministic game loop; state machine (menu/play/over); localStorage; clean modules (items/audio/game); no bugs on core flow |
| UX & Accessibility | 20 | No tutorial wall; on-screen hints; large targets; keyboard-complete; colorblind-aware; reduced-motion; mobile-friendly; sound toggle |
| Creativity & Originality | 15 | Mikan mascot world; "teach the why, not just the where"; HAZARD unlock progression; streak system |

## 4. Content plan (roadmap)

- [x] 22 items across 4 bins with facts (skeleton)
- [ ] Expand to 30+ items; add tricky cases (greasy vs clean cardboard, shredded paper, coated paper)
- [ ] Level themes: kitchen → park → school → beach (each with item pools)
- [ ] "Fact of the run" collection screen (learning recap)
- [ ] Optional: JA/EN language toggle (author is JP; judges EN — EN default)
- [ ] Optional: daily challenge seed (shareable score)

## 5. Accessibility checklist

- [x] Keyboard-complete (Space/1-4/Esc)
- [x] Reduced motion honored (particles/shake disabled)
- [x] Colorblind-aware bin colors + icons + labels (never color alone)
- [x] Large click targets (92px items, ~220px bins)
- [x] Sound toggle; no audio-only feedback (everything has visual equivalent)
- [ ] Screen-reader pass on HUD/overlays (aria-live on toast; refine labels)
- [ ] Contrast audit of final palette

## 6. Technical notes

- Canvas 960×600, scales to viewport width; single rAF loop with delta-time.
- All art is code-drawn (emoji glyphs + shapes) — no asset licensing issues, tiny repo.
- Facts are data (`js/items.js`) — content edits never touch game logic.
- Facts sourced from common municipal recycling guidance (generic, non-jurisdiction-specific to stay accurate worldwide). Final build: add a short "facts are simplified; check your local rules" note.

## 7. Submission checklist (Devpost)

- [ ] GitHub repo public + README current
- [ ] Demo video: screen recording + voiceover (2–3 min) — required
- [ ] Description: 3–4 sentences (game / issue / social good) — required
- [ ] Submit before 10/29 13:45 JST
