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
      },
    },
  },
  plugins: [],
};

export default config;
