/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ice: "#F0F8FF",
        primary: "#5BC8F5",
        accent: "#00D4FF",
        navy: "#0D1B2A",
      },
      boxShadow: {
        frost: "0 10px 30px rgba(13, 27, 42, 0.10)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
