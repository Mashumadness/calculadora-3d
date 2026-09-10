/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0a0a0b',
          900: '#111113',
          850: '#16161a',
          800: '#1c1c21',
          700: '#26262d',
          600: '#33333c',
        },
        brand: {
          400: '#f2555a',
          500: '#e5383b',
          600: '#c1272d',
          700: '#8f1c21',
        },
      },
      boxShadow: {
        card: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 10px 30px -12px rgba(0,0,0,0.8)',
      },
    },
  },
  plugins: [],
};
