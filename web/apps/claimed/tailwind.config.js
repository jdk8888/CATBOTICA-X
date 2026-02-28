/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // CATBOTICA Lunar New Year 2026 - Year of the Horse
        // Lore Anchor: CAT-EVENT-LMRP-2026-HORSE
        primary: {
          DEFAULT: '#C41E3A', // Imperial Red
          dark: '#8B0000',    // Deep Crimson
          light: '#E63950',   // Bright Red
        },
        secondary: {
          DEFAULT: '#FFD700', // Gold
          dark: '#B8960F',    // Antique Gold
          light: '#FFE44D',   // Light Gold
        },
        accent: {
          DEFAULT: '#D4AF37', // Metallic Gold
          copper: '#B87333',  // Copper accent
        },
        background: {
          DEFAULT: '#0D0D0D', // Carbon Fiber Black
          light: '#1A1A1A',   // Dark Carbon
          lighter: '#2A2A2A', // Charcoal
        },
        text: {
          DEFAULT: '#F5F0E8', // Warm White (parchment)
          muted: '#A09080',   // Muted warm gray
          dark: '#666666',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'lunar-gradient': 'linear-gradient(135deg, #C41E3A 0%, #FFD700 50%, #C41E3A 100%)',
        'gold-shimmer': 'linear-gradient(90deg, #B8960F, #FFD700, #D4AF37, #FFD700, #B8960F)',
        'carbon-grain': 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,215,0,0.03) 2px, rgba(255,215,0,0.03) 4px)',
      },
      animation: {
        'shimmer': 'shimmer 3s ease-in-out infinite',
        'pulse-gold': 'pulse-gold 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'pulse-gold': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 215, 0, 0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(255, 215, 0, 0.4)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
