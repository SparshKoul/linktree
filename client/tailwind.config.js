/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      // The sizes the design uses that are not in the default scale. Without
      // them the class is dropped and the element lands in the wrong place.
      spacing: {
        4.5: '1.125rem',
        5.5: '1.375rem',
        13: '3.25rem',
        18: '4.5rem',
        22: '5.5rem',
        26: '6.5rem',
        30: '7.5rem',
      },
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

