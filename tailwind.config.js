/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'red-up': '#ef4444',
        'green-down': '#22c55e',
      }
    },
  },
  plugins: [],
}
