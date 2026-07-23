/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef8ff",
          100: "#d9efff",
          200: "#bce4ff",
          300: "#8ed4ff",
          400: "#59baff",
          500: "#3399ff",
          600: "#1a78f5",
          700: "#1361e1",
          800: "#164eb6",
          900: "#18448f",
          950: "#132a57",
        },
        ink: {
          50: "#f6f8fb",
          100: "#eceff5",
          200: "#d5dce8",
          300: "#b3bfd3",
          400: "#8b9bb9",
          500: "#6d7ea0",
          600: "#566685",
          700: "#46536c",
          800: "#3c465b",
          900: "#353d4e",
          950: "#232833",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        soft: "0 12px 40px -16px rgba(19, 42, 87, 0.25)",
      },
    },
  },
  plugins: [],
};
