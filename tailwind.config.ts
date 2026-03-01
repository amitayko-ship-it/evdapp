import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./client/src/**/*.{ts,tsx}", "./client/index.html"],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#2C5F8A",
          "blue-light": "#4A90C2",
          green: "#5A8F3C",
          "green-light": "#7CB342",
          yellow: "#E8C820",
          "yellow-light": "#F5D835",
        },
        status: {
          ordered: "#4A90C2",
          "ordered-bg": "#EBF3FA",
          ready: "#E8C820",
          "ready-bg": "#FDF8E1",
          pickedup: "#2C5F8A",
          "pickedup-bg": "#E3EDF5",
          returned: "#5A8F3C",
          "returned-bg": "#EDF5E8",
          safety: "#C0392B",
          "safety-bg": "#FDECEA",
        },
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
      boxShadow: {
        stone: "0 2px 8px rgba(44, 95, 138, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)",
        "stone-lg": "0 4px 16px rgba(44, 95, 138, 0.10), 0 2px 6px rgba(0, 0, 0, 0.04)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
