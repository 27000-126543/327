/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'deep-space': '#0a1628',
        'space-blue': '#112240',
        'panel-bg': 'rgba(17, 34, 64, 0.85)',
        'cyber-blue': '#00d4ff',
        'fire-red': '#ff4444',
        'life-green': '#00ff88',
        'warn-orange': '#ff8800',
        'power-yellow': '#ffcc00',
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        sans: ['"Noto Sans SC"', 'sans-serif'],
      },
      boxShadow: {
        'neon-blue': '0 0 15px rgba(0, 212, 255, 0.5), inset 0 0 15px rgba(0, 212, 255, 0.1)',
        'neon-red': '0 0 15px rgba(255, 68, 68, 0.6), inset 0 0 15px rgba(255, 68, 68, 0.1)',
        'neon-green': '0 0 15px rgba(0, 255, 136, 0.5), inset 0 0 15px rgba(0, 255, 136, 0.1)',
        'neon-orange': '0 0 15px rgba(255, 136, 0, 0.5), inset 0 0 15px rgba(255, 136, 0, 0.1)',
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan': 'scan 2s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'blink-orange': 'blink-orange 1s step-start infinite',
        'scroll-left': 'scroll-left 20s linear infinite',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        glow: {
          '0%': { filter: 'drop-shadow(0 0 5px currentColor)' },
          '100%': { filter: 'drop-shadow(0 0 20px currentColor)' },
        },
        'blink-orange': {
          '50%': { backgroundColor: '#ff8800', color: '#000' },
        },
        'scroll-left': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
    },
  },
  plugins: [],
};
