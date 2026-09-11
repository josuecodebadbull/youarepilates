import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: "class",
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
        // shadcn/kibo-ui token names, mapped onto our own palette above (via HSL
        // CSS variables in globals.css) so vendored components from kibo-ui match
        // our look instead of their generic default theme.
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
  plugins: [animate],
};

export default config;
