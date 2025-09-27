/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    // Your custom animations go inside the 'extend' object
    extend: {
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '10%, 50%, 90%': { transform: 'rotate(-60deg)' },
          '30%, 70%': { transform: 'rotate(60deg)' },
        },
      },
      animation: {
        shake: 'shake 10s ease-in-out',
      },
    },
  },
  plugins: [],
};