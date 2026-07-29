module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'nouriva-green': '#062e33',
        'nouriva-cream': '#fbfbfa',
        'nouriva-gold': '#c29f63',
        'nouriva-charcoal': '#2a2724',
      },
      animation: {
        'fadeIn': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      }
    },
  },
  plugins: [],
}
