import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        jp: {
          red: "#BC002D",
          dark: "#1A1A2E",
          card: "#16213E",
          accent: "#E94560",
          gold: "#D4A574",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        jp: ["Noto Sans JP", "Hiragino Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
