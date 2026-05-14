/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './lib/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: '#2A2B2A',
        'bg-elevated': '#353635',
        'bg-input': '#3F4040',
        border: '#454645',
        accent: '#61988E',
        'accent-muted': '#3F5F58',
        text: '#F5F5F0',
        'text-muted': '#9B9B96',
        'text-dim': '#6B6B66',
        danger: '#C97064',
        warning: '#D4A574',
      },
      fontFamily: {
        serif: ['InstrumentSerif_400Regular'],
        'serif-italic': ['InstrumentSerif_400Regular_Italic'],
        sans: ['Inter_400Regular'],
        'sans-medium': ['Inter_500Medium'],
        'sans-semibold': ['Inter_600SemiBold'],
      },
    },
  },
  plugins: [],
};
