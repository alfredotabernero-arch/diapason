/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Instrument Sans"', 'system-ui', 'sans-serif'],
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
      },
      colors: {
        paper: '#F7F4EE',
        ink: {
          50: '#F2F4F8',
          100: '#E3E7F0',
          200: '#C6CEDF',
          300: '#9DA9C4',
          400: '#6E7EA3',
          500: '#4D5D84',
          600: '#3A4869',
          700: '#2D3853',
          800: '#1F2740',
          900: '#141A2C',
        },
        brass: {
          50: '#FBF6EA',
          100: '#F4E8C8',
          200: '#E9D29A',
          300: '#DBB66A',
          400: '#C99A45',
          500: '#B07F30',
          600: '#8C6326',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(20,26,44,0.04), 0 4px 16px -4px rgba(20,26,44,0.08)',
        lift: '0 2px 4px rgba(20,26,44,0.06), 0 12px 32px -8px rgba(20,26,44,0.18)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'sheet-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'pop': {
          '0%': { transform: 'scale(0.96)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.35s cubic-bezier(0.22,1,0.36,1) both',
        'fade-in': 'fade-in 0.2s ease-out both',
        'sheet-up': 'sheet-up 0.32s cubic-bezier(0.22,1,0.36,1) both',
        pop: 'pop 0.2s cubic-bezier(0.22,1,0.36,1) both',
      },
    },
  },
  plugins: [],
};
