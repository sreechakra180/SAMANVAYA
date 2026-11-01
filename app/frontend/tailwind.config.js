/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#F8FAF7',
        surface: {
          DEFAULT: '#FFFFFF',
          subtle: '#F1F4F0',
          mint: '#EAF3EA',
        },
        sage: '#CADFCC',
        natural: '#A8C9AD',
        forest: {
          DEFAULT: '#24543B',
          dark: '#193A2A',
        },
        mutedText: '#78877D',
        editorialBorder: '#DCE7DD',
        warning: '#D97869',
        critical: '#BA1A1A',
        scam: '#BA1A1A',
        ok: '#24543B',
        warn: '#D97869',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        heading: ['Manrope', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Menlo', 'monospace'],
      },
      borderRadius: {
        'editorial': '16px',
        'editorial-sm': '10px',
      },
    },
  },
  plugins: [],
}
