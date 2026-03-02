import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "rgba(160, 183, 164, 0.18)",
        input: "rgba(160, 183, 164, 0.18)",
        ring: "#8da693",
        background: "#f2f2f2",
        foreground: "#454c49",
        primary: {
          DEFAULT: "#8da693",
          foreground: "#fffaf3",
        },
        secondary: {
          DEFAULT: "#fff7f0",
          foreground: "#454c49",
        },
        muted: {
          DEFAULT: "#f7f3ee",
          foreground: "#727975",
        },
        accent: {
          DEFAULT: "#dfe8df",
          foreground: "#454c49",
        },
        card: {
          DEFAULT: "rgba(255, 255, 255, 0.76)",
          foreground: "#454c49",
        },
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        soft: "0 16px 40px rgba(160, 183, 164, 0.08)",
      },
      fontFamily: {
        sans: ["Jost", "Avenir Next", "Segoe UI", "sans-serif"],
        serif: ["Cormorant Garamond", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;

export default config;
