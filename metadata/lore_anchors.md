---
uuid: CAT-LORE-ANCHORS-001
status: Production
tags: [lore-anchors, catbotica, source-of-truth]
last_sync: 2026-02-10
zodiac_anchor: LS-CATBOTICA-ANCHOR-012
project: CATBOTICA
---

# CATBOTICA Lore Anchors

## Purpose
This document contains **mandatory Lore Anchors** that must be referenced in all silo `pulse.md` files when working on CATBOTICA. These anchors prevent narrative drift and ensure consistency across all production silos.

## How to Use
Copy the relevant Lore Anchor quote into your silo's `pulse.md` under the "Lore Anchor (MANDATORY)" section before starting any CATBOTICA-related work.

---

## Core World Rules

### Location: Catbotica Industries Campus
> **Source:** `projects/CATBOTICA/metadata/project_bible.md` (CAT-BIBLE-8bb43f7a-7796-4c27-b877-d599528ec7b7)
> 
> "Catbotica Industries / Campus: Large industrial or research complex with multiple buildings, open spaces, and a 'CAMPUS' sign. Industrial/workshop environment with high ceilings, mechanical structures, slightly dim ambiance with darker color tones. Contains offices and research labs. Tagline: 'Where everything you've imagined can be made real.'"

### Technology: Spaceships
> **Source:** `projects/CATBOTICA/metadata/project_bible.md` (CAT-BIBLE-8bb43f7a-7796-4c27-b877-d599528ec7b7)
> 
> "Spaceship Interior: Contains control panels and navigation equipment, communication devices present. Can be damaged by meteor strikes, smoke can emanate from damaged areas. Setting for space exploration characters and meteor strike aftermath."

### Environment: Space
> **Source:** `projects/CATBOTICA/metadata/project_bible.md` (CAT-BIBLE-8bb43f7a-7796-4c27-b877-d599528ec7b7)
> 
> "Space / Outer Space: Vast, dark environment with stars, sense of isolation and vastness. Debris and wreckage can be present. Spaceships travel through this environment. Meteor strikes occur here. Debris fields and meteor hazards are present."

### Environment: Alien Planet
> **Source:** `projects/CATBOTICA/metadata/project_bible.md` (CAT-BIBLE-8bb43f7a-7796-4c27-b877-d599528ec7b7)
> 
> "Alien Planet: Otherworldly environment with earth tones and blues dominating color palette. Contains alien creatures (octopus-like entities). Unfamiliar and mysterious, rocky or unusual terrain. Destination for space exploration missions and first contact scenarios."

---

## Visual Style Rules

### Color Palettes
> **Source:** `projects/CATBOTICA/metadata/project_bible.md` (CAT-BIBLE-8bb43f7a-7796-4c27-b877-d599528ec7b7)
> 
> "Color Palettes: Space uses dark with stars, blues, blacks. Industrial uses darker tones, mechanical grays. Natural uses earth tones, greens, browns. Alien uses earth tones and blues. Domestic uses muted grays, blues, greens. Cover uses vibrant colors (purple, pink, blue, green)."

### Art Style
> **Source:** `projects/CATBOTICA/metadata/project_bible.md` (CAT-BIBLE-8bb43f7a-7796-4c27-b877-d599528ec7b7)
> 
> "Visual Style: Mix of black and white and color pages. Retro-futuristic aesthetic. Classic comic book art style. Simple line work with minimal shading. Bold lines and colors in some sections, muted color palettes in others."

---

## Physical Laws & Limitations

### Technology Limitations
> **Source:** `projects/CATBOTICA/metadata/project_bible.md` (CAT-BIBLE-8bb43f7a-7796-4c27-b877-d599528ec7b7)
> 
> "Technological Limitations: Spaceships can be damaged. Communication may be limited by distance. Navigation requires equipment. Repairs needed after damage."

### Environmental Hazards
> **Source:** `projects/CATBOTICA/metadata/project_bible.md` (CAT-BIBLE-8bb43f7a-7796-4c27-b877-d599528ec7b7)
> 
> "Environmental Hazards: Meteors in space. Dangerous creatures in jungles. Alien environments may be hostile. Natural disasters possible."

---

## Zodiac Badge Collection — The Celestial Cat-Circuit

### Zodiac Badge Visual Specification
> **Source:** `projects/CATBOTICA/metadata/project_bible.md` (CAT-ZODIAC-COLLECTION-001)
> **Anchor:** `projects/CATBOTICA/metadata/lore_anchors/zodiac_badges.md` (LS-CATBOTICA-ANCHOR-012)
> 
> "The full Zodiac Vault — twelve zodiac-frequency calibration templates — was pre-loaded into every Catbotica unit's firmware at the founding of Catbotica Industries. Each badge depicts an abstracted zodiac creature reimagined in Catbotica's hard-surface mechanical aesthetic: plates, wiring, circuit traces, LED accents — no organic textures. Hybrid color palette: persistent Electric Cyan (#00F2FF) circuitry frame underneath, Imperial Red (#C41E3A) and Gold (#FFD700) Lunar event filigree overlay, Carbon Fiber Black (#0D0D0D) substrate. Retro-futuristic enamel pin aesthetic with UE5-quality volumetric lighting. Collection launched January 2022 (Tiger), one zodiac activates per Lunar New Year."

### Hold-Duration Reward System
> **Source:** `projects/CATBOTICA/metadata/project_bible.md` (CAT-ZODIAC-COLLECTION-001)
> 
> "Badge eligibility is determined by wallet mint date against collection launch (January 2022). Units that minted during or before a zodiac's activation year gain retroactive access to that year's badge. A wallet minted in 2022 can claim Tiger (2022) through Horse (2026). A wallet minted in 2025 can only claim Snake (2025) and Horse (2026). Creates a seniority gradient — early minters accumulate the largest badge collections."

### Zodiac Badge Token Standards
> **Source:** `projects/CATBOTICA/metadata/lore_anchors/zodiac_badges.md` (LS-CATBOTICA-ANCHOR-012)
> 
> "Dual token format: ERC-1155 for tradeable badge editions with 7.5% secondary royalties. SBT (Soulbound Token) for non-transferable proof-of-recalibration — permanent identity/reputation layer. Both formats reference the same visual assets."

---

## Usage Instructions

1. **Before starting work on CATBOTICA:**
   - Open your silo's `pulse.md`
   - Add or update the "Lore Anchor (MANDATORY)" section
   - Copy the relevant anchor quote above
   - Include the source UUID for traceability

2. **When creating assets:**
   - Reference the anchor in your creative prompts
   - Verify your output matches the anchor description
   - Update anchor if lore changes (see update protocol)

3. **When lore changes:**
   - Update this file with new anchors
   - Update `last_sync` date
   - Notify all silos to refresh their anchors

---

## Update Protocol

**To add new Lore Anchors:**
1. Edit this file
2. Add new anchor with source citation
3. Update `last_sync` date
4. Run: `python Scripts/update_lore_anchors.py --project CATBOTICA`

**To update existing anchors:**
1. Edit the anchor quote
2. Update `last_sync` date
3. Mark old anchor as deprecated (add note)
4. Notify silos to refresh

---

**Last Updated:** 2026-02-10  
**Maintained By:** Lore Sanctum (Silo 01)  
**Next Review:** 2026-02-17
