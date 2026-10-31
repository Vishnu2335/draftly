import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: "#202923",
          dark: "#151C17",
          light: "#2C3931",
          hover: "#2A362E",
        },
        ivory: {
          DEFAULT: "#F8F7F2",
          dark: "#EFECE3",
          light: "#FCFBF8",
        },
        warmStone: {
          DEFAULT: "#E8E5DB",
          light: "#F4F2ED",
          dark: "#D2CDC0",
        },
        sage: {
          DEFAULT: "#A6B69F",
          light: "#E7ECE4",
          dark: "#788A72",
        },
        terracotta: {
          DEFAULT: "#C58C65",
          light: "#F7EFE9",
          dark: "#9F6642",
        },
        charcoal: "#202923",
        mutedText: "#5D685E",
        borderTone: "#E2DFD5",
      },
      fontFamily: {
        serif: ["Newsreader", "Georgia", "Cambria", "serif"],
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "Cascadia Code",
          "Consolas",
          "monospace",
        ],
      },
      maxWidth: {
        measure: "760px",
      },
    },
  },
  plugins: [],
};

export default config;

