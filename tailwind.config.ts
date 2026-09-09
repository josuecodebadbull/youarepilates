import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        tenant: {
          primary: "var(--tenant-primary, #1f2937)",
          secondary: "var(--tenant-secondary, #6b7280)",
        },
        // Our own product's identity (landing, admin chrome) — kept separate from
        // `tenant`, which is each studio's own branding inside the student PWA.
        ink: {
          DEFAULT: "#16181D",
          soft: "#5B5E67",
          faint: "#8A8D96",
        },
        canvas: "#FAF9F6",
        brand: {
          50: "#EEF6F4",
          100: "#D7EAE6",
          200: "#B0D5CC",
          300: "#82BDAF",
          400: "#55A491",
          500: "#328A78",
          600: "#206F60",
          700: "#1A594E",
          800: "#16473F",
          900: "#123A33",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(22,24,29,0.04), 0 8px 24px -8px rgba(22,24,29,0.10)",
        card: "0 1px 2px rgba(22,24,29,0.04), 0 2px 8px -2px rgba(22,24,29,0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
