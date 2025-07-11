/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#24B2A4',
        'primary-hover': '#1e9b8f',
        'primary-light': '#2dd4c7',
      },
    },
  },
  plugins: [],
};