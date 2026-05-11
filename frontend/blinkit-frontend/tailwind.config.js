/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        "blinkit-green":   "#0C831F",
        "blinkit-yellow":  "#F8C200",
        "blinkit-bg":      "#F8F8F8",
        "blinkit-muted":   "#666666",
        "blinkit-border":  "#E0E0E0",
        "blinkit-success": "#4CAF50",
        "blinkit-error":   "#F44336",
        "blinkit-purple":  "#673AB7",
      },
    },
  },
  plugins: [],
};
