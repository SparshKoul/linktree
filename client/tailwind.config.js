/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          500: '#5B3DF5',
          600: '#4A2FD6',
        },
      },
      borderRadius: {
        pill: '9999px',
      },
    },
  },
  plugins: [],
};

