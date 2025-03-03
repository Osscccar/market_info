/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    // If you have a `ui` folder inside `components`:
    "./components/ui/**/*.{js,ts,jsx,tsx}",
    // If you're using shadcn from node_modules:
    "./node_modules/@shadcn/ui/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [require("@tailwindcss/typography")],
};
