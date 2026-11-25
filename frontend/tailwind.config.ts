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
        // Reference Retro Editorial Palette
        paper: {
          DEFAULT: "#F7F3EA", // Main background: warm off-white
          cream: "#F1E6D0",   // Secondary background: light warm cream
          light: "#FBF8F1",   // Cards & Input background: light cream
          dark: "#E6DBC3",    // Darker cream for borders/accents
        },
        ink: {
          DEFAULT: "#111111", // Primary text: almost black
          border: "#171717",  // Borders: dark black
          muted: "#77736C",   // Muted text: warm grey
          soft: "#3F3D39",    // Secondary body text
        },
        coral: {
          DEFAULT: "#F15B5D", // Primary accent: coral red
          hover: "#E0484A",   // Hover coral
          light: "#FDECEC",   // Light coral tint
          dark: "#C93B3D",    // Deep coral
        },
        retroBlue: {
          DEFAULT: "#1769B0", // Secondary accent: deep blue
          light: "#E3EFFB",   // Blue tint
          dark: "#12548D",
        },
        retroGreen: {
          DEFAULT: "#269B72", // Supporting accent: muted green
          light: "#E4F6EF",   // Green tint
          dark: "#1E825F",
        },
        retroSand: "#EFE7D8",

        // Compatibility Aliases for Smooth Fallback
        forest: {
          DEFAULT: "#171717",
          dark: "#111111",
          light: "#2A2A2A",
          hover: "#333333",
        },
        ivory: {
          DEFAULT: "#F7F3EA",
          dark: "#F1E6D0",
          light: "#FBF8F1",
        },
        warmStone: {
          DEFAULT: "#F1E6D0",
          light: "#FBF8F1",
          dark: "#E2D7C0",
        },
        sage: {
          DEFAULT: "#269B72",
          light: "#E4F6EF",
          dark: "#1E825F",
        },
        terracotta: {
          DEFAULT: "#F15B5D",
          light: "#FDECEC",
          dark: "#C93B3D",
        },
        charcoal: "#111111",
        mutedText: "#77736C",
        borderTone: "#171717",
      },
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans"',
          "Outfit",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        serif: [
          '"Plus Jakarta Sans"',
          "Outfit",
          "Newsreader",
          "serif",
        ],
        mono: [
          '"JetBrains Mono"',
          "Fira Code",
          "Consolas",
          "monospace",
        ],
      },
      boxShadow: {
        retro: "2px 2px 0px #171717",
        "retro-md": "3px 3px 0px #171717",
        "retro-lg": "5px 5px 0px #171717",
        "retro-xl": "7px 7px 0px #171717",
      },
      borderRadius: {
        sm: "3px",
        DEFAULT: "4px",
        md: "6px",
        lg: "8px",
      },
      maxWidth: {
        measure: "760px",
      },
    },
  },
  plugins: [],
};

export default config;
