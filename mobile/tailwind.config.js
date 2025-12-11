/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}",
    "./firebase/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        apple: {
          gray: {
            50: '#F9FAFB',
            100: '#F2F2F7', // iOS System Gray 6
            200: '#E5E5EA', // iOS System Gray 5
            300: '#D1D1D6', // iOS System Gray 4
            400: '#C7C7CC', // iOS System Gray 3
            500: '#AEAEB2', // iOS System Gray 2
            600: '#8E8E93', // iOS System Gray
            700: '#636366',
            800: '#48484A',
            900: '#1C1C1E', // iOS Dark Background
          }
        },
        orange: {
          500: '#F97316', // Primary Accent
          600: '#EA580C',
        }
      }
    },
  },
  plugins: [],
}
