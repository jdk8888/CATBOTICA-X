# Hero Card Carousel — Required Assets

Place files in this folder (or ensure paths match from the app root).

## Zodiac hero cards (carousel coins)

Used by `PARADE_MEDALLIONS_COINS_CONFIG.imageList`. Typically 12 images, e.g.:

- `rat.png`, `ox.png`, `tiger.png`, `rabbit.png`, `dragon.png`, `snake.png`
- `horse.png`, `goat.png`, `monkey.png`, `rooster.png`, `dog.png`, `pig.png`

Back of card:

- `rear.png`

## Medallion ring (three-layer parallax)

Three images per medallion (same art, different layers). Expected names:

- `2026_CATBOTICA_Lunar_New_Year_Badge_Face.png`
- `2026_CATBOTICA_Lunar_New_Year_Badge_Character.png`
- `2026_CATBOTICA_Lunar_New_Year_Badge_Background.png`

Paths are resolved relative to the HTML/script location (e.g. `assets/…`).

## Video

Inner sphere video is loaded from **`videos/`** (sibling to `hero-card-carousel.html`), not from `assets/`.

- Default: `videos/catboticavid5.mp4`
- Override via `window.PARADE_IMAX_CONFIG.innerSphereVideoUrl` (full URL or path relative to script).

Add your video file(s) to a `videos/` folder next to `hero-card-carousel.html`; the app will use the default path unless you set the config.

## Summary

| Type        | Location              | Files |
|------------|-----------------------|--------|
| Carousel   | `assets/`             | `rat.png` … `pig.png`, `rear.png` |
| Medallions | `assets/`             | `2026_CATBOTICA_Lunar_New_Year_Badge_*.png` (Face, Character, Background) |
| Inner sphere video | `videos/`   | e.g. `catboticavid5.mp4` |

Serve the app from `projects/CATBOTICA/web/apps` (e.g. `npx serve -p 8767`) and open `http://localhost:8767/hero-card-carousel/hero-card-carousel.html`.
