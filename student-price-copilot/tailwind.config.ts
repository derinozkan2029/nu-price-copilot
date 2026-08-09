import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f7ff",
          100: "#dcecff",
          500: "#3b7dff",
          600: "#2c63e6",
          700: "#214db3",
        },
      },
    },
  },
  plugins: [],
};

export default config;
