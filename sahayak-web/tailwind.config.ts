import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6", // main purple
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
        },
        lavender: "#E6E6FA",
      },
      boxShadow: {
        soft: "0 6px 30px rgba(124,58,237,0.12)",
      },
      borderRadius: {
        "2xl": "1rem",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pop: {
          "0%": { transform: "scale(.98)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        fadeUp: "fadeUp .4s ease-out",
        pop: "pop .12s ease-out",
      },
    },
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1200px" },
    },
  },
  plugins: [],
};

export default config;
