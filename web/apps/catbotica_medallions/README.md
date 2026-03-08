# CATBOTICA Medallions — Standalone App

This folder is the **dedicated, independent** home for all CATBOTICA medallion/carousel experiences. It is **not** tied to KARAFURU paths or structure; all assets and versions live here.

## Structure

```
catbotica_medallions/
├── README.md           # This file
├── assets/             # Shared assets (zodiac images, rear). Copy from marquee or Assets/badges.
├── v1/                 # Version 1: full carousel + closeup (canonical)
│   ├── index.html
│   └── catbotica_medallions_v1.js
├── v2/                 # Version 2: strip layout (title band + canvas)
│   └── index.html
└── catbotica_medallions.js   # Root script (used by catbotica_marquee; uses config.rearUrl)
```

## Versions

- **v1** — Full 3D carousel: silhouette cards, 12 medallion ring, dust, orbit/zoom, closeup overlay. Entry: `v1/index.html`.
- **v2** — Same carousel with rectangular layout: strip band at top, canvas below (Catbotica palette). Entry: `v2/index.html`.

All versions use `window.PARADE_MEDALLIONS_COINS_CONFIG` (e.g. `imageList`, `rearUrl`) and point to `../assets/` (or `assets/` when served from app root).

## Serving

Serve the **catbotica_medallions** directory over HTTP so that:

- `v1/index.html` and `v2/index.html` load their scripts and `../assets/` resolves to `assets/`.
- Example: from this directory run `npx serve -p 8767` then open:
  - http://localhost:8767/v1/
  - http://localhost:8767/v2/

## Marquee

The **catbotica_marquee** app embeds the root `catbotica_medallions.js` and sets `PARADE_MEDALLIONS_COINS_CONFIG` in its own HTML. That script uses `config.rearUrl` when provided so the marquee can point to its own `assets/`.

## Assets

See `assets/README.md` for what to put in `assets/` (12 zodiac images + rear). Copy from `catbotica_marquee/assets/` or from `projects/CATBOTICA/Assets/badges/` if available.
