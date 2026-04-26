import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        "claux-bg": "#0A0B0F",
        "claux-surface": "#12141A",
        "claux-border": "#1E2130",
        "claux-text": "#F0F2F8",
        "claux-teal": "#1D9E75",
        "claux-purple": "#7F77DD"
      },
      borderRadius: {
        lg: "0.875rem",
        md: "0.65rem",
        sm: "0.5rem"
      }
    }
  },
  plugins: []
};

export default config;
