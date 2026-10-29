/** @type {import('tailwindcss').Config} */
const tokens = require('./theme/tokens.json');

module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './features/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: tokens.colors,
      fontSize: {
        label: ['12px', { lineHeight: '16px' }],
        body: ['16px', { lineHeight: '24px' }],
      },
    },
  },
  plugins: [],
};
