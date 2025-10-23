/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Puedes dejar estos si quieres nombres semánticos
        primary: '#D90429',
        secondary: '#333333',
        accent: '#FFDA63',
        surface: '#1E1E1E',
        text: '#FFFFFF',
      },
    },
  },
  plugins: [],
};
