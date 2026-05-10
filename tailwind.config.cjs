/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Quicksand", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        cream: "#fff8ef",
        shell: "#e8fbff",
        lilac: "#e8dcff",
        coral: "#ff8b7d",
      },
      boxShadow: {
        bub: "0 8px 0 rgba(26, 50, 80, 0.12)",
      },
    },
  },
  plugins: [],
};
