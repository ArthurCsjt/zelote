import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
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
        // Menu Colors System
        "menu-green": {
          DEFAULT: "hsl(var(--menu-green))",
          hover: "hsl(var(--menu-green-hover))",
        },
        "menu-blue": {
          DEFAULT: "hsl(var(--menu-blue))",
          hover: "hsl(var(--menu-blue-hover))",
        },
        "menu-dark-blue": { // NOVO AZUL ESCURO
          DEFAULT: "hsl(213 90% 35%)",
          hover: "hsl(213 90% 30%)",
        },
        "menu-violet": {
          DEFAULT: "hsl(258 70% 45%)",
          hover: "hsl(258 70% 40%)",
        },
        "menu-amber": {
          DEFAULT: "hsl(var(--menu-amber))",
          hover: "hsl(var(--menu-amber-hover))",
        },
        "menu-rose": {
          DEFAULT: "hsl(var(--menu-rose))",
          hover: "hsl(var(--menu-rose-hover))",
        },
        "menu-teal": {
          DEFAULT: "hsl(var(--menu-teal))",
          hover: "hsl(var(--menu-teal-hover))",
        },
        // Back Button System
        "back-button": {
          DEFAULT: "hsl(var(--back-button))",
          foreground: "hsl(var(--back-button-foreground))",
          border: "hsl(var(--back-button-border))",
          hover: "hsl(var(--back-button-hover))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        fadeIn: "fadeIn 0.5s ease-out",
        slideIn: "slideIn 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;