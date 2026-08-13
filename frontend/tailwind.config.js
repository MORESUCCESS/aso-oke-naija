/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gold:    { DEFAULT: '#C4A45A', light: '#D4B870', dark: '#A88840', pale: '#F5D78E' },
        cream:   { DEFAULT: '#FDFBF7', 2: '#F5E6C8', 3: '#EDE0C0' },
        dark:    { DEFAULT: '#1A0E00', mid: '#2D1F00' },
        accent:  { DEFAULT: '#8B1A1A' },
        emerald: { DEFAULT: '#1A5C3A' },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', '"Cormorant"', 'Georgia', 'serif'],
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Bebas Neue"', 'sans-serif'],
      },
      animation: {
        'fade-in':    'fadeIn 0.6s ease-out',
        'slide-up':   'slideUp 0.5s ease-out',
        'slide-right':'slideRight 0.4s ease-out',
      },
      keyframes: {
        fadeIn:     { from: { opacity: 0 },              to: { opacity: 1 } },
        slideUp:    { from: { opacity: 0, transform: 'translateY(24px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideRight: { from: { opacity: 0, transform: 'translateX(-24px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
      },
    },
  },
  plugins: [],
};
