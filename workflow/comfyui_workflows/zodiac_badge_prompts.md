---
uuid: CAT-ZODIAC-PROMPTS-001
status: Production
tags: [comfyui, prompts, zodiac, badges, flux2, pulid]
last_sync: 2026-02-10
lore_anchor: LS-CATBOTICA-ANCHOR-012
---

# Catbotica Zodiac Badge — Master Prompt Set

## Usage Instructions

1. **Master Badge First:** Generate the **Horse** badge (2026, current cycle) WITHOUT PuLID enabled. This becomes your reference.
2. **Save the Master:** Save the Horse output as `master_badge_horse.png` in `ComfyUI/input/`.
3. **Enable PuLID:** Connect the PuLID nodes in the workflow, load `master_badge_horse.png` as reference.
4. **Iterate:** Swap the positive prompt to each zodiac below, one at a time. Update `filename_prefix` in the Save node.
5. **Two Variants:** Run each prompt twice — once on black background (default), once through background removal for transparent PNG.

## Shared Negative Prompt (DO NOT CHANGE)

```
fur, hair, feathers, organic skin, organic eyes, realistic animal, photograph, soft textures, watercolor, oil painting, blurry, low quality, text, typography, words, letters, numbers, human face, human body, environmental background, landscape, scenery, multiple objects, cluttered, asymmetrical, cartoon, chibi, anime, sketch, pencil drawing, crayon
```

## Shared Prompt Suffix

Every positive prompt below ends with this suffix. It is already included in each prompt for copy-paste convenience:

```
Carbon Fiber Black #0D0D0D substrate base. UE5-quality volumetric lighting, 3D beveled metallic surfaces, subsurface glow on circuit traces. Centered, symmetrical, isolated on solid black background, ultra-fine technical detail, retro-futuristic cyberpunk, high-end enamel pin, digital collectible.
```

---

## 1. TIGER (2022 — Water)
**Filename prefix:** `catbotica_zodiac/tiger`
**Seed suggestion:** 2022

```
A high-resolution digital collectible badge, retro-futuristic enamel pin aesthetic. A cybernetic mechanical TIGER constructed from hard-surface metallic plates, copper wiring, circuit traces, and LED optical sensors. Powerful crouching stance, armored plating with layered pauldron-like shoulder plates, jagged circuit-trace stripes glowing Electric Cyan #00F2FF across the body. Fangs rendered as polished chrome blades. The badge frame features Electric Cyan #00F2FF glowing circuitry traces forming structural border lines. Overlaid with Imperial Red #C41E3A and Gold #FFD700 ornate filigree patterns and Lunar zodiac glyphs representing Water element — wave motifs in the filigree. A Gold glowing Luck-Module emanates from the forehead region. Carbon Fiber Black #0D0D0D substrate base. UE5-quality volumetric lighting, 3D beveled metallic surfaces, subsurface glow on circuit traces. Centered, symmetrical, isolated on solid black background, ultra-fine technical detail, retro-futuristic cyberpunk, high-end enamel pin, digital collectible.
```

---

## 2. RABBIT (2023 — Water)
**Filename prefix:** `catbotica_zodiac/rabbit`
**Seed suggestion:** 2023

```
A high-resolution digital collectible badge, retro-futuristic enamel pin aesthetic. A cybernetic mechanical RABBIT constructed from hard-surface metallic plates, copper wiring, circuit traces, and LED optical sensors. Elegant upright pose, elongated radar-dish ears made of brushed titanium with internal Cyan circuit veins, compact articulated body with smooth ceramic-white plating. Whiskers rendered as fiber-optic filaments. The badge frame features Electric Cyan #00F2FF glowing circuitry traces forming structural border lines. Overlaid with Imperial Red #C41E3A and Gold #FFD700 ornate filigree patterns and Lunar zodiac glyphs representing Water element — flowing ribbon motifs. A Gold glowing Luck-Module emanates from the forehead region. Carbon Fiber Black #0D0D0D substrate base. UE5-quality volumetric lighting, 3D beveled metallic surfaces, subsurface glow on circuit traces. Centered, symmetrical, isolated on solid black background, ultra-fine technical detail, retro-futuristic cyberpunk, high-end enamel pin, digital collectible.
```

---

## 3. DRAGON (2024 — Wood)
**Filename prefix:** `catbotica_zodiac/dragon`
**Seed suggestion:** 2024

```
A high-resolution digital collectible badge, retro-futuristic enamel pin aesthetic. A cybernetic mechanical DRAGON constructed from hard-surface metallic plates, copper wiring, circuit traces, and LED optical sensors. Coiled serpentine body with overlapping hexagonal scale-plates, articulated jaw with chrome teeth, swept-back horn antennae made of burnished copper coils. Wings rendered as deployable solar-panel arrays with Cyan circuit veins. The badge frame features Electric Cyan #00F2FF glowing circuitry traces forming structural border lines. Overlaid with Imperial Red #C41E3A and Gold #FFD700 ornate filigree patterns and Lunar zodiac glyphs representing Wood element — branch and vine motifs in the filigree. A Gold glowing Luck-Module emanates from the forehead region. Carbon Fiber Black #0D0D0D substrate base. UE5-quality volumetric lighting, 3D beveled metallic surfaces, subsurface glow on circuit traces. Centered, symmetrical, isolated on solid black background, ultra-fine technical detail, retro-futuristic cyberpunk, high-end enamel pin, digital collectible.
```

---

## 4. SNAKE (2025 — Wood)
**Filename prefix:** `catbotica_zodiac/snake`
**Seed suggestion:** 2025

```
A high-resolution digital collectible badge, retro-futuristic enamel pin aesthetic. A cybernetic mechanical SNAKE constructed from hard-surface metallic plates, copper wiring, circuit traces, and LED optical sensors. Coiled spiral body made of interlocking segmented rings with visible ball-joint articulation, smooth matte obsidian plating with Cyan circuit traces running along the spine. Hooded cobra-like head with LED sensor eyes and a forked antenna tongue. The badge frame features Electric Cyan #00F2FF glowing circuitry traces forming structural border lines. Overlaid with Imperial Red #C41E3A and Gold #FFD700 ornate filigree patterns and Lunar zodiac glyphs representing Wood element — leaf and tendril motifs. A Gold glowing Luck-Module emanates from the forehead region. Carbon Fiber Black #0D0D0D substrate base. UE5-quality volumetric lighting, 3D beveled metallic surfaces, subsurface glow on circuit traces. Centered, symmetrical, isolated on solid black background, ultra-fine technical detail, retro-futuristic cyberpunk, high-end enamel pin, digital collectible.
```

---

## 5. HORSE (2026 — Fire) ★ MASTER BADGE
**Filename prefix:** `catbotica_zodiac/horse`
**Seed suggestion:** 2026
**NOTE:** Generate this FIRST without PuLID. This is the identity reference for all other badges.

```
A high-resolution digital collectible badge, retro-futuristic enamel pin aesthetic. A cybernetic mechanical HORSE constructed from hard-surface metallic plates, copper wiring, circuit traces, and LED optical sensors. Rearing dynamic pose, pistons and hydraulic joints visible at legs and neck, mane rendered as a cascade of fiber-optic cables glowing Electric Cyan #00F2FF, armored chest plate with exposed circuitry. The badge frame features Electric Cyan #00F2FF glowing circuitry traces forming structural border lines. Overlaid with Imperial Red #C41E3A and Gold #FFD700 ornate filigree patterns and Lunar zodiac glyphs representing Fire element — flame and spark motifs in the filigree. A Gold glowing Luck-Module emanates from the forehead region. Carbon Fiber Black #0D0D0D substrate base. UE5-quality volumetric lighting, 3D beveled metallic surfaces, subsurface glow on circuit traces. Centered, symmetrical, isolated on solid black background, ultra-fine technical detail, retro-futuristic cyberpunk, high-end enamel pin, digital collectible.
```

---

## 6. GOAT (2027 — Fire)
**Filename prefix:** `catbotica_zodiac/goat`
**Seed suggestion:** 2027

```
A high-resolution digital collectible badge, retro-futuristic enamel pin aesthetic. A cybernetic mechanical GOAT constructed from hard-surface metallic plates, copper wiring, circuit traces, and LED optical sensors. Regal standing pose, curved spiral horns made of layered copper coil windings with Cyan LED tips, compact muscular frame with angular armor plating, cloven hooves rendered as magnetic stabilizer pads. The badge frame features Electric Cyan #00F2FF glowing circuitry traces forming structural border lines. Overlaid with Imperial Red #C41E3A and Gold #FFD700 ornate filigree patterns and Lunar zodiac glyphs representing Fire element — ember and warmth motifs. A Gold glowing Luck-Module emanates from the forehead region. Carbon Fiber Black #0D0D0D substrate base. UE5-quality volumetric lighting, 3D beveled metallic surfaces, subsurface glow on circuit traces. Centered, symmetrical, isolated on solid black background, ultra-fine technical detail, retro-futuristic cyberpunk, high-end enamel pin, digital collectible.
```

---

## 7. MONKEY (2028 — Earth)
**Filename prefix:** `catbotica_zodiac/monkey`
**Seed suggestion:** 2028

```
A high-resolution digital collectible badge, retro-futuristic enamel pin aesthetic. A cybernetic mechanical MONKEY constructed from hard-surface metallic plates, copper wiring, circuit traces, and LED optical sensors. Crouching agile pose with one articulated hand reaching upward, prehensile tail rendered as a segmented cable with magnetic grapple tip, expressive LED visor face, compact nimble frame with exposed servo motors at joints. The badge frame features Electric Cyan #00F2FF glowing circuitry traces forming structural border lines. Overlaid with Imperial Red #C41E3A and Gold #FFD700 ornate filigree patterns and Lunar zodiac glyphs representing Earth element — stone and crystal motifs. A Gold glowing Luck-Module emanates from the forehead region. Carbon Fiber Black #0D0D0D substrate base. UE5-quality volumetric lighting, 3D beveled metallic surfaces, subsurface glow on circuit traces. Centered, symmetrical, isolated on solid black background, ultra-fine technical detail, retro-futuristic cyberpunk, high-end enamel pin, digital collectible.
```

---

## 8. ROOSTER (2029 — Earth)
**Filename prefix:** `catbotica_zodiac/rooster`
**Seed suggestion:** 2029

```
A high-resolution digital collectible badge, retro-futuristic enamel pin aesthetic. A cybernetic mechanical ROOSTER constructed from hard-surface metallic plates, copper wiring, circuit traces, and LED optical sensors. Proud upright stance, dramatic crest/comb rendered as a radiator fin array glowing Imperial Red, tail feathers rendered as deployable antenna blade fans with Cyan circuit traces, sharp talons as precision tool-tips. The badge frame features Electric Cyan #00F2FF glowing circuitry traces forming structural border lines. Overlaid with Imperial Red #C41E3A and Gold #FFD700 ornate filigree patterns and Lunar zodiac glyphs representing Earth element — geometric crystal motifs. A Gold glowing Luck-Module emanates from the forehead region. Carbon Fiber Black #0D0D0D substrate base. UE5-quality volumetric lighting, 3D beveled metallic surfaces, subsurface glow on circuit traces. Centered, symmetrical, isolated on solid black background, ultra-fine technical detail, retro-futuristic cyberpunk, high-end enamel pin, digital collectible.
```

---

## 9. DOG (2030 — Metal)
**Filename prefix:** `catbotica_zodiac/dog`
**Seed suggestion:** 2030

```
A high-resolution digital collectible badge, retro-futuristic enamel pin aesthetic. A cybernetic mechanical DOG constructed from hard-surface metallic plates, copper wiring, circuit traces, and LED optical sensors. Alert sitting pose with ears perked, radar-dish ears with internal antenna arrays, broad loyal chest plate with shield-like armor, articulated tail functioning as a balance gyroscope, muzzle with sensor grid. The badge frame features Electric Cyan #00F2FF glowing circuitry traces forming structural border lines. Overlaid with Imperial Red #C41E3A and Gold #FFD700 ornate filigree patterns and Lunar zodiac glyphs representing Metal element — forged steel and riveted motifs. A Gold glowing Luck-Module emanates from the forehead region. Carbon Fiber Black #0D0D0D substrate base. UE5-quality volumetric lighting, 3D beveled metallic surfaces, subsurface glow on circuit traces. Centered, symmetrical, isolated on solid black background, ultra-fine technical detail, retro-futuristic cyberpunk, high-end enamel pin, digital collectible.
```

---

## 10. PIG (2031 — Metal)
**Filename prefix:** `catbotica_zodiac/pig`
**Seed suggestion:** 2031

```
A high-resolution digital collectible badge, retro-futuristic enamel pin aesthetic. A cybernetic mechanical PIG constructed from hard-surface metallic plates, copper wiring, circuit traces, and LED optical sensors. Sturdy seated pose with a round compact body of overlapping armor plates, broad snout with dual intake vents and sensor array, small articulated ears like satellite dishes, curly tail rendered as a coiled power conduit with Cyan glow. The badge frame features Electric Cyan #00F2FF glowing circuitry traces forming structural border lines. Overlaid with Imperial Red #C41E3A and Gold #FFD700 ornate filigree patterns and Lunar zodiac glyphs representing Metal element — hammered bronze and gilt motifs. A Gold glowing Luck-Module emanates from the forehead region. Carbon Fiber Black #0D0D0D substrate base. UE5-quality volumetric lighting, 3D beveled metallic surfaces, subsurface glow on circuit traces. Centered, symmetrical, isolated on solid black background, ultra-fine technical detail, retro-futuristic cyberpunk, high-end enamel pin, digital collectible.
```

---

## 11. RAT (2032 — Water)
**Filename prefix:** `catbotica_zodiac/rat`
**Seed suggestion:** 2032

```
A high-resolution digital collectible badge, retro-futuristic enamel pin aesthetic. A cybernetic mechanical RAT constructed from hard-surface metallic plates, copper wiring, circuit traces, and LED optical sensors. Alert crouching pose with oversized round sensor-ear dishes, long segmented tail made of linked micro-servos, compact agile body with sleek low-profile armor, tiny articulated claws with tool-tip digits, sharp pointed snout with whisker-like fiber-optic probes. The badge frame features Electric Cyan #00F2FF glowing circuitry traces forming structural border lines. Overlaid with Imperial Red #C41E3A and Gold #FFD700 ornate filigree patterns and Lunar zodiac glyphs representing Water element — ripple and current motifs. A Gold glowing Luck-Module emanates from the forehead region. Carbon Fiber Black #0D0D0D substrate base. UE5-quality volumetric lighting, 3D beveled metallic surfaces, subsurface glow on circuit traces. Centered, symmetrical, isolated on solid black background, ultra-fine technical detail, retro-futuristic cyberpunk, high-end enamel pin, digital collectible.
```

---

## 12. OX (2033 — Water)
**Filename prefix:** `catbotica_zodiac/ox`
**Seed suggestion:** 2033

```
A high-resolution digital collectible badge, retro-futuristic enamel pin aesthetic. A cybernetic mechanical OX constructed from hard-surface metallic plates, copper wiring, circuit traces, and LED optical sensors. Powerful front-facing stance, massive horns rendered as twin hydraulic rams with Cyan-lit pressure gauges, broad reinforced chest plate with hexagonal bolt patterns, thick armored legs with heavy-duty piston joints, a nose ring rendered as a glowing data-link torus. The badge frame features Electric Cyan #00F2FF glowing circuitry traces forming structural border lines. Overlaid with Imperial Red #C41E3A and Gold #FFD700 ornate filigree patterns and Lunar zodiac glyphs representing Water element — deep ocean and tide motifs. A Gold glowing Luck-Module emanates from the forehead region. Carbon Fiber Black #0D0D0D substrate base. UE5-quality volumetric lighting, 3D beveled metallic surfaces, subsurface glow on circuit traces. Centered, symmetrical, isolated on solid black background, ultra-fine technical detail, retro-futuristic cyberpunk, high-end enamel pin, digital collectible.
```

---

## Quick Reference Table

| # | Zodiac | Year | Element | Key Mechanical Feature | Elemental Filigree Motif |
|---|--------|------|---------|----------------------|------------------------|
| 1 | Tiger | 2022 | Water | Jagged circuit-trace stripes, chrome fang blades | Wave motifs |
| 2 | Rabbit | 2023 | Water | Titanium radar-dish ears, fiber-optic whiskers | Flowing ribbon motifs |
| 3 | Dragon | 2024 | Wood | Hexagonal scale-plates, solar-panel wing arrays | Branch and vine motifs |
| 4 | Snake | 2025 | Wood | Segmented ring body, forked antenna tongue | Leaf and tendril motifs |
| 5 | Horse | 2026 | Fire | Fiber-optic cable mane, hydraulic leg pistons | Flame and spark motifs |
| 6 | Goat | 2027 | Fire | Copper coil spiral horns, magnetic stabilizer hooves | Ember and warmth motifs |
| 7 | Monkey | 2028 | Earth | Segmented grapple tail, exposed servo joints | Stone and crystal motifs |
| 8 | Rooster | 2029 | Earth | Radiator fin crest, antenna blade tail fans | Geometric crystal motifs |
| 9 | Dog | 2030 | Metal | Radar-dish ears, shield chest plate, gyro tail | Forged steel and rivet motifs |
| 10 | Pig | 2031 | Metal | Intake vent snout, coiled power conduit tail | Hammered bronze and gilt motifs |
| 11 | Rat | 2032 | Water | Micro-servo linked tail, fiber-optic whisker probes | Ripple and current motifs |
| 12 | Ox | 2033 | Water | Hydraulic ram horns, data-link nose torus | Deep ocean and tide motifs |

---

```json
{
  "sync_metadata": {
    "document_type": "comfyui_prompts",
    "project": "CATBOTICA",
    "collection": "zodiac_badges",
    "model": "FLUX 2 Dev FP8 Mixed",
    "consistency_method": "PuLID FLUX",
    "version": "1.0",
    "last_updated": "2026-02-10"
  }
}
```
