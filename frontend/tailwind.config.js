/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Bricolage Grotesque"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        brand: {
          lightest: '#E3F2FD',
          light: '#90CAF9',
          primary: '#2196F3',
          dark: '#0D47A1',
        },
      }
    },
  },
  plugins: [],
}

