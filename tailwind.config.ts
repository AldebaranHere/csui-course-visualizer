import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      colors: {
        canvas: "#111111",
        surface: "#1E1E1E",
        accent: "#C5A059",
        "txt-secondary": "#E2E8F0",
        "txt-primary": "#F8FAFC",
      },
    },
  },
  plugins: [],
};
export default config;
