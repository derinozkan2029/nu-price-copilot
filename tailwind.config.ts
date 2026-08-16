import type { Config } from "tailwindcss";

// Each token points at a CSS custom property (defined per-theme in
// globals.css); the <alpha-value> placeholder lets Tailwind still resolve
// opacity modifiers like `border-amber/40`.
const cssVar = (variable: string) => `rgb(var(${variable}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: cssVar("--color-paper"),
          raised: cssVar("--color-paper-raised"),
        },
        ink: {
          DEFAULT: cssVar("--color-ink"),
          soft: cssVar("--color-ink-soft"),
          faint: cssVar("--color-ink-faint"),
        },
        line: {
          DEFAULT: cssVar("--color-line"),
          soft: cssVar("--color-line-soft"),
        },
        purple: {
          DEFAULT: cssVar("--color-purple"),
          soft: cssVar("--color-purple-soft"),
          deep: cssVar("--color-purple-deep"),
        },
        amber: {
          DEFAULT: cssVar("--color-amber"),
          soft: cssVar("--color-amber-soft"),
          deep: cssVar("--color-amber-deep"),
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
