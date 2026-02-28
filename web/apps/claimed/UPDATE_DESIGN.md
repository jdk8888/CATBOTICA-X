# Update Preview to Match catbotica.com Design

## Quick Steps to Match Original Design

### 1. Extract Design Information

**Option A: Use the extraction tool**
1. Open `extract-design.html` in your browser
2. Follow the instructions to extract fonts, colors, and assets from catbotica.com

**Option B: Manual extraction**
1. Visit catbotica.com
2. Open Developer Tools (F12)
3. Go to Console tab
4. Run this code:

```javascript
// Get fonts
console.log('Body font:', getComputedStyle(document.body).fontFamily);
console.log('Heading font:', getComputedStyle(document.querySelector('h1')).fontFamily);

// Get colors
console.log('Background:', getComputedStyle(document.body).backgroundColor);
console.log('Text color:', getComputedStyle(document.body).color);

// Get logo
const logo = document.querySelector('img[alt*="logo" i], img[src*="logo" i], .logo img');
console.log('Logo URL:', logo ? logo.src : 'Not found');
```

### 2. Update preview.html

#### Update Fonts (Line ~10)
Replace the Google Fonts link with the actual fonts from catbotica.com:

```html
<!-- If catbotica.com uses custom fonts, add them here -->
<link href="https://fonts.googleapis.com/css2?family=YOUR_FONT:wght@400;500;600;700&display=swap" rel="stylesheet">
```

Then update CSS:
```css
body {
    font-family: 'YOUR_FONT', system-ui, sans-serif;
}
```

#### Update Colors (Line ~20)
Update the CSS variables in `:root` with exact colors from catbotica.com:

```css
:root {
    --primary: #EXACT_COLOR_FROM_SITE;
    --background: #EXACT_COLOR_FROM_SITE;
    /* etc. */
}
```

#### Add Logo (Line ~150)
1. Download the logo from catbotica.com
2. Save it in the same folder as `preview.html`
3. Uncomment and update the logo line:

```html
<img src="catbotica-logo.png" alt="CATBOTICA" style="max-width: 200px; margin-bottom: 1rem;">
```

### 3. Update Next.js App

After updating the preview, apply the same changes to:

1. **`tailwind.config.js`** - Update colors:
```javascript
colors: {
  primary: {
    DEFAULT: '#YOUR_COLOR',
    // ...
  }
}
```

2. **`app/layout.tsx`** - Update fonts:
```typescript
import { YourFont } from 'next/font/google'
```

3. **`app/globals.css`** - Update CSS variables

## Common Fonts Used on NFT/Web3 Sites

If catbotica.com uses common fonts, they might be:
- **Inter** (very common)
- **Space Grotesk** (modern tech)
- **Poppins** (clean, modern)
- **Montserrat** (geometric)
- **Roboto** (Google default)
- Custom font (check Network tab for font files)

## Color Extraction Tips

1. Use browser DevTools Color Picker:
   - F12 → Elements → Select element → Styles → Click color square
   - Copy the hex/rgb value

2. Check CSS variables:
   - Look for `--color-*` or `--primary-*` in the Styles panel

3. Screenshot method:
   - Take screenshot → Use color picker tool → Get hex code

## Logo/Graphics

1. **Find logo:**
   - Right-click logo on catbotica.com → "Inspect"
   - Find `<img>` tag → Copy `src` URL
   - Download image

2. **Save assets:**
   - Create `assets/` folder in `claimed/` directory
   - Save logo as `logo.png` or `logo.svg`

3. **Update paths:**
   - Update `preview.html` to point to `assets/logo.png`
   - Update Next.js app to use `/assets/logo.png`

## Quick Update Checklist

- [ ] Extract fonts from catbotica.com
- [ ] Extract colors from catbotica.com
- [ ] Download logo/graphics
- [ ] Update `preview.html` with fonts
- [ ] Update `preview.html` with colors
- [ ] Add logo to `preview.html`
- [ ] Update `tailwind.config.js` with colors
- [ ] Update `app/layout.tsx` with fonts
- [ ] Test preview.html in browser
- [ ] Verify design matches catbotica.com

## Need Help?

If you share the extracted design information (fonts, colors, logo URL), I can update the files for you automatically!
