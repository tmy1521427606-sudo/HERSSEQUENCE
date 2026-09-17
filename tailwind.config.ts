import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./content.ts",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1A1A2E",
        rose: "#E86C8D",
        lilac: "#F5F0FF",
        cream: "#FFF9F8",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        soft: "0 24px 70px rgba(56, 37, 66, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
