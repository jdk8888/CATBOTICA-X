# Cat-Themed Elevator Music Setup

## Current Setup

The preview.html file includes an HTML5 audio element that will play cat-themed elevator music in the background.

## Adding Your Cat-Themed Music

### Option 1: Local File (Recommended)

1. **Get cat-themed elevator music:**
   - Find or create a cat-themed elevator music track
   - Save it as `cat-elevator-music.mp3` in the same folder as `preview.html`

2. **Update the audio source:**
   In `preview.html`, find this line (around line 150):
   ```html
   <source src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" type="audio/mpeg">
   ```
   
   Replace it with:
   ```html
   <source src="cat-elevator-music.mp3" type="audio/mpeg">
   ```

### Option 2: Online URL

If you have the music hosted online, replace the source URL:

```html
<source src="https://your-domain.com/cat-elevator-music.mp3" type="audio/mpeg">
```

### Option 3: Multiple Formats (Best Compatibility)

For better browser support, include multiple formats:

```html
<audio id="elevatorMusic" autoplay loop>
    <source src="cat-elevator-music.mp3" type="audio/mpeg">
    <source src="cat-elevator-music.ogg" type="audio/ogg">
    <source src="cat-elevator-music.wav" type="audio/wav">
    Your browser does not support the audio element.
</audio>
```

## Music Recommendations

For cat-themed elevator music, consider:
- Soft, ambient music with cat meows or purring sounds
- Mellow jazz or lounge music with cat-themed elements
- Instrumental music that evokes a playful, feline atmosphere
- Royalty-free music from sites like:
  - Freesound.org
  - Incompetech.com
  - Bensound.com
  - YouTube Audio Library

## Features

- **Autoplay**: Music starts automatically when page loads
- **Loop**: Music repeats continuously
- **Controls**: Bottom-right corner has Play/Pause button
- **Browser Compatibility**: Works in all modern browsers

## Browser Autoplay Policy

Some browsers (Chrome, Safari) block autoplay with sound. If music doesn't start automatically:
- Click the "Play" button in the bottom-right corner
- The button will toggle between "Play" and "Pause"

## For Next.js App

To add music to the Next.js app:

1. **Add audio file to `public/` folder:**
   ```
   projects/CATBOTICA/web/apps/claimed/public/cat-elevator-music.mp3
   ```

2. **Create a music component** (`app/components/ElevatorMusic.tsx`):
   ```tsx
   'use client'
   
   import { useEffect, useRef, useState } from 'react'
   
   export function ElevatorMusic() {
     const audioRef = useRef<HTMLAudioElement>(null)
     const [isPlaying, setIsPlaying] = useState(false)
   
     useEffect(() => {
       // Try to play on mount
       audioRef.current?.play().catch(() => {
         setIsPlaying(false)
       })
     }, [])
   
     const toggleMusic = () => {
       if (audioRef.current) {
         if (audioRef.current.paused) {
           audioRef.current.play()
           setIsPlaying(true)
         } else {
           audioRef.current.pause()
           setIsPlaying(false)
         }
       }
     }
   
     return (
       <>
         <audio ref={audioRef} loop>
           <source src="/cat-elevator-music.mp3" type="audio/mpeg" />
         </audio>
         <div className="fixed bottom-4 right-4 bg-background-light border border-background-lighter rounded-lg p-2 flex items-center gap-2 text-xs text-text-muted z-50">
           <span>🎵</span>
           <button onClick={toggleMusic} className="px-2 py-1 border border-background-lighter rounded hover:border-primary">
             {isPlaying ? 'Pause' : 'Play'}
           </button>
         </div>
       </>
     )
   }
   ```

3. **Add to `app/page.tsx`**:
   ```tsx
   import { ElevatorMusic } from './components/ElevatorMusic'
   
   // In the component:
   return (
     <main>
       <ElevatorMusic />
       {/* rest of page */}
     </main>
   )
   ```

## Testing

1. Open `preview.html` in your browser
2. Music should start automatically (or click Play)
3. Use the control button to pause/resume
4. Music should loop continuously

## Troubleshooting

- **No sound**: Check browser autoplay settings
- **File not found**: Verify file path is correct
- **Format not supported**: Try MP3 format (most compatible)
- **Autoplay blocked**: Click the Play button manually
