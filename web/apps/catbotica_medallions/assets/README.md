# CATBOTICA Medallions — Assets

Place here the images used by the medallions carousel so this app is **self-contained** and independent of KARAFURU or the marquee folder.

## Required

- **rear.png** — Card back / rear face (one image for all cards).
- **rat.png**, **ox.png**, **tiger.png**, **rabbit.png**, **dragon.png**, **snake.png**, **horse.png**, **goat.png**, **monkey.png**, **rooster.png**, **dog.png**, **pig.png** — 12 Lunar Zodiac badge fronts.

## 3D medallion (optional)

- **medallionv1.glb** — Standalone GLB for the “Use GLB” toggle. Export from `medallion.blend` (Blender: File → Export → glTF 2.0, format GLB, embed textures). If missing, the toggle still works; procedural medallions are used.

## Full experience (full.html)

The **full** page also uses:

- **Medallion layers** (same names as hero-card-carousel): `2026_CATBOTICA_Lunar_New_Year_Badge_Face.png`, `2026_CATBOTICA_Lunar_New_Year_Badge_Character.png`, `2026_CATBOTICA_Lunar_New_Year_Badge_Background.png`.
- **Video** is in `videos/` (sibling to this folder): `videos/catboticavid5.mp4`. See `videos/README.md`.

You can reuse or symlink from `../hero-card-carousel/assets/` for zodiac + rear + medallion layers if you want one set.

## Where to get them

1. **From catbotica_marquee**  
   Copy from `../catbotica_marquee/assets/` if that app already has them (e.g. after running the marquee locally).

2. **From project Assets**  
   If you have `projects/CATBOTICA/Assets/badges/` (or output from `workflow/postprocess_badges.py`), copy the 12 badge images and name them as above. Use any card-back image as `rear.png`.

Paths in v1 and v2 HTML use `../assets/` (relative to the version folder), so these files must live in this `assets/` directory.
