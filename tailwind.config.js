/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#171717',
          800: '#2f3437',
          600: '#5f686d',
        },
        ledger: {
          50: '#f3fbf8',
          100: '#dff5ec',
          500: '#3a9f74',
          600: '#2e835f',
          700: '#256b4f',
        },
      },
      fontFamily: {
        sans: ['Geist', 'Satoshi', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        soft: '0 18px 45px -28px rgba(15, 23, 42, 0.32)',
      },
    },
  },
  plugins: [],
};
