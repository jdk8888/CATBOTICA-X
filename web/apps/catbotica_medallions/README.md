# Catbotica Inc — Medallions (Standalone App)

This folder is the **dedicated, independent** home for all **Catbotica Inc** medallion/carousel experiences. It is **not** tied to KARAFURU paths or structure; all assets and versions live here. **Hub:** Catbotica Inc.

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

## GitHub hub (Catbotica Inc)

To use **Catbotica Inc** as its own GitHub hub (separate from KARAFURU.WORLD):

1. **Create a new repository** on GitHub (e.g. `catbotica-inc`, `CatboticaInc`, or `catbotica-medallions`).
2. From the studio root, add the new remote and push this app (or the whole CATBOTICA project):
   ```bash
   git remote add catbotica-inc https://github.com/YOUR_ORG/catbotica-inc.git
   git subtree push --prefix=projects/CATBOTICA/web/apps/catbotica_medallions catbotica-inc main
   ```
   Or, if the new repo is meant to hold only the medallions app, clone the app into a new repo and push there. To start a **new project** that is Catbotica Inc–only, create the repo and then either push this folder as the root or use the studio’s `Scripts/create_project.py` to create a `CATBOTICA_INC` project and wire it to the new remote.
