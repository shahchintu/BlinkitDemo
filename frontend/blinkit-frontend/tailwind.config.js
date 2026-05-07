/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'blinkit-yellow': '#F8C200',
        'blinkit-green': '#0C831F',
      }
    },
  },
  plugins: [],
}