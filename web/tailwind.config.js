/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class', // Manual toggling for that "Code Rabbit" feel
  theme: {
    extend: {
      colors: {
        primary: "#3b82f6",
        dark: "#0f172a",
        darker: "#020617",
      },
    },
  },
  plugins: [],
}
