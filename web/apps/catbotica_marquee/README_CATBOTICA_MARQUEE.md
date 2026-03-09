# Catbotica Hero Card Marquee — Fork of Karafuru Marquee

This folder is a **fork** of the KARAFURU hero card carousel marquee, converted for CATBOTICA (Lunar / Zodiac branding and assets).

## Quick setup

1. **Copy the marquee engine** from KARAFURU:
   - From `projects/KARAFURU/web/apps/karafuru-relaunch/karafuru_marquee/` copy:
     - `karafuru_marquee.js` → here as `catbotica_marquee.js`
   - Or symlink if you prefer to share one codebase.

2. **Assets**
   - Put card front images in `assets/` (or point `PARADE_MEDALLIONS_COINS_CONFIG.imageList` to your paths).
   - Put one card back image as `assets/rear.png` (or set `rearUrl` in config).
   - Optional: add `videos/` and `logos/` for cylinder/globe if you use them.

3. **Serve**
   - **Important:** Serve this directory over HTTP (e.g. `npx serve .` from this folder, or your app server). Opening the HTML as `file://` can leave the 3D area empty (CORS blocks the Three.js module from unpkg).
   - Open `catbotica_marquee.html` in the browser (e.g. `http://localhost:3000/catbotica_marquee.html`).

## What’s different from KARAFURU

- **Branding**: Title, nav, and footer use CATBOTICA.
- **Card list**: `PARADE_MEDALLIONS_COINS_CONFIG` uses Lunar Zodiac badges (Rat, Ox, Tiger, …) and points to `assets/` under this app (or to `../../../../Assets/badges/` if you prefer).
- **Defaults**: Particle/carousel colors and debug panel defaults can use Catbotica palette (e.g. amber/gold `#f59e0b`, sky `#0ea5e9`). Edit the inline script in `catbotica_marquee.html` to change default colors.

## Controls (same as Karafuru)

- **All components**: Toggles for Carousel, Globe, Ring, Top, Waterfall, Fireworks, Welcome/World/KARAFURU text, Nav, Footer, Tower.
- **Global**: Particles× (density), Lum× (global luminosity).
- **Card carousel**: Show, Spd, Dir (CW/CCW = reverse spin), Lum, Spin×.
- **Particle fields**: Per-field toggles + Globe particle color picker; Q, Lum, Rot, Spd, Sz per field.

## File layout (after copy)

```
catbotica_marquee/
  catbotica_marquee.html   # This fork’s page + config
  catbotica_marquee.js     # Copy of karafuru_marquee.js
  assets/
    rear.png               # Card back texture
    rat.png                # Zodiac card fronts (or your paths in config)
    ox.png
    ...
  README_CATBOTICA_MARQUEE.md
```

## Converting further

- **Videos / logos**: Set `window.PARADE_IMAX_CONFIG` (e.g. `videoUrl`, `logoUrls`) in the HTML or via `/api/config` if you add the same API as Karafuru.
- **Text rings**: The JS still uses “WELCOME TO”, “THE WORLD OF”, “KARAFURU”. To show “CATBOTICA” or “LUNAR ZODIAC” you’ll need to edit the module that creates the title ring text (in `catbotica_marquee.js`, search for `PHRASES` and `KARAFURU`).
