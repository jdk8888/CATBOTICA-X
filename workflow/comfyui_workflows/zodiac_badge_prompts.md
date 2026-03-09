---
uuid: CAT-ZODIAC-PROMPTS-001
status: Production
tags: [comfyui, prompts, zodiac, badges, flux, catbotica, mechanical, enamel-pin]
last_sync: 2026-02-10
lore_anchor: LS-CATBOTICA-ANCHOR-012
source: projects/CATBOTICA/metadata/project_bible.md (Badge Visual Spec) + lore_anchors/zodiac_badges.md
design: Catbotica reference — hard-surface mechanical, enamel pin, hybrid palette. Horse = master; PuLID from Horse.
---

# Catbotica Zodiac Badge — Bible-Aligned Prompt Set

## Design Direction — CATBOTICA REFERENCE (project_bible.md)

- **Look and feel:** Match **Catbotica mechanical style** from the project bible. **Not** abstract or artistic — **hard-surface mechanical**: plates, wiring, circuit traces, LED accents. **Retro-futuristic enamel pin aesthetic** with UE5-quality volumetric lighting.
- **Subject:** Abstracted zodiac animal in Catbotica mechanical style (zodiac creature reimagined with hard-surface aesthetic). No organic textures (no fur, skin, feathers).
- **Hybrid color palette (immutable):**
  - **Persistent frame:** Electric Cyan (#00F2FF) circuitry traces — border and structural lines (Catbotica firmware).
  - **Lunar overlay:** Imperial Red (#C41E3A) and Gold (#FFD700) — filigree, glyphs, Luck-Module glow.
  - **Base:** Carbon Fiber Black (#0D0D0D) substrate.
- **Composition:** Round badge frame, subject centered. 1:1 square, symmetrical. Luck-Module glow in central forehead region (Cyan dormant / Gold recalibrating).
- **Style lock:** Fixed clip_l for PuLID runs, denoise 0.92, PuLID weight 1.0 / end_at 1.0, unified seed 2040. Horse = master (no PuLID); rest use PuLID from `master_badge_horse.png`.

## Shared Negative Prompt (DO NOT CHANGE)

```
fur, hair, feathers, organic skin, organic eyes, realistic animal, photograph, soft textures, watercolor, oil painting, blurry, low quality, text, typography, words, letters, numbers, human face, human body, environmental background, landscape, scenery, multiple objects, cluttered, asymmetrical, cartoon, chibi, anime, sketch, pencil drawing, crayon, ornate, baroque, busy, heraldic, crest, shield, excessive detail, lavish, fancy, details at top, ornament above frame, elements outside boundary, strong glow, harsh glimmer, bright spotlight, artistic, painterly, stylized
```

## Shared Design Spec (script constant DESIGN_SPEC — from bible)

Catbotica mechanical style only: plates, wiring, circuit traces, LED accents. Electric Cyan #00F2FF circuitry traces as border and structural lines. Imperial Red #C41E3A and Gold #FFD700 for Lunar overlay and Luck-Module glow at center. Carbon Fiber Black #0D0D0D base. Retro-futuristic enamel pin aesthetic, UE5-quality volumetric lighting. Round badge frame, subject centered inside. 1:1 square, symmetrical, digital collectible.

---

## 1. HORSE (2026 — Fire) ★ STYLE ANCHOR (MASTER)

Generate FIRST without PuLID. Upload result as `master_badge_horse.png` in ComfyUI input.

**Master prompt:** Catbotica zodiac badge. HORSE in hard-surface mechanical style: recognizable silhouette with plates, circuit traces, LED accents. No organic texture. Enamel pin look, round frame. [DESIGN_SPEC]

---

## 2–12. MONKEY, DOG, TIGER, RABBIT, DRAGON, SNAKE, GOAT, ROOSTER, PIG, RAT, OX

Same Catbotica look; only animal changes. PuLID from Horse. Prompt: "Same style as reference… Only the center subject differs: [ANIMAL] in same hard-surface mechanical style, plates and circuit traces, enamel pin, round frame." + DESIGN_SPEC.

---

## Quick Reference (generation order)

| # | Zodiac  | Year | Note                    |
|---|---------|------|-------------------------|
| 1 | Horse   | 2026 | Master (no PuLID)       |
| 2 | Monkey  | 2028 | PuLID from Horse        |
| 3 | Dog     | 2030 | PuLID from Horse        |
| 4 | Tiger   | 2022 | PuLID from Horse        |
| 5 | Rabbit  | 2023 | PuLID from Horse        |
| 6 | Dragon  | 2024 | PuLID from Horse        |
| 7 | Snake   | 2025 | PuLID from Horse        |
| 8 | Goat    | 2027 | PuLID from Horse        |
| 9 | Rooster | 2029 | PuLID from Horse        |
|10 | Pig     | 2031 | PuLID from Horse        |
|11 | Rat     | 2032 | PuLID from Horse        |
|12 | Ox      | 2033 | PuLID from Horse        |
