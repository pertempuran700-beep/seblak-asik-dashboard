/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#E94560',
        secondary: '#F4B400',
        success: '#00B894',
        warning: '#FDCB6E',
        danger: '#FF6B6B',
        bg: '#0F0F23',
        surface: '#1A1A3E',
        surface2: '#252550',
        text: '#FFFFFF',
        textmuted: '#A0A0C0',
      },
      borderRadius: {
        card: '16px',
        button: '10px',
        input: '8px',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 24px rgba(233,69,96,0.3)',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
