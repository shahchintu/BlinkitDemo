/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        'blinkit-green':  '#0C831F',
        'blinkit-yellow': '#F8C200',
        'blinkit-bg':     '#F8F8F8',
        'blinkit-dark':   '#1A1A1A',
        'blinkit-muted':  '#666666',
        'blinkit-border': '#E0E0E0',
        'blinkit-success':'#4CAF50',
        'blinkit-error':  '#F44336',
        'blinkit-purple': '#673AB7',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl':  '12px',
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '24px',
      },
      boxShadow: {
        'card':      '0 2px 8px rgba(0,0,0,0.08)',
        'card-hover':'0 8px 24px rgba(0,0,0,0.12)',
        'dropdown':  '0 8px 32px rgba(0,0,0,0.15)',
        'sidebar':   '-4px 0 24px rgba(0,0,0,0.10)',
      },
      animation: {
        'shimmer':   'shimmer 1.5s infinite',
        'fadeInUp':  'fadeInUp 250ms ease forwards',
      },
    },
  },
  plugins: [],
};
