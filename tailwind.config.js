/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        coral: {
          DEFAULT: "#EF6C5C",
          dark: "#DE5A49",
          light: "#FDEBE8",
        },
        ink: {
          DEFAULT: "#2E3A45",
          soft: "#5B6570",
        },
        cream: "#FBF3EA",
        mint: {
          DEFAULT: "#DCF2E3",
          dark: "#A9DCC0",
        },
        skyish: {
          DEFAULT: "#DCEBF7",
        },
        peach: {
          DEFAULT: "#FCE4E1",
        },
        lilac: {
          DEFAULT: "#EDE3F7",
        },
      },
      fontFamily: {
        sans: ["'Noto Sans JP'", "'Hiragino Sans'", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
