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
        // Core Colors
        background: "hsl(var(--background))",
        "background-secondary": "hsl(var(--background-secondary))",
        foreground: "hsl(var(--foreground))",
        
        // Surfaces
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
          hover: "hsl(var(--card-hover))",
        },
        modal: {
          DEFAULT: "hsl(var(--modal))",
          border: "hsl(var(--modal-border))",
        },
        overlay: "hsl(var(--overlay))",
        
        // Inputs
        input: "hsl(var(--input))",
        "input-bg": "hsl(var(--input-bg))",
        "input-foreground": "hsl(var(--input-foreground))",
        "input-placeholder": "hsl(var(--input-placeholder))",

        // Primary Button
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover: "hsl(var(--primary-hover))",
        },
        
        // States
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--error))",
          foreground: "hsl(var(--error-foreground))",
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
        
        // Semantic Colors
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
          bg: "hsl(var(--success-bg))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
          bg: "hsl(var(--warning-bg))",
        },
        error: {
          DEFAULT: "hsl(var(--error))",
          foreground: "hsl(var(--error-foreground))",
          bg: "hsl(var(--error-bg))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
          bg: "hsl(var(--info-bg))",
        },
        
        // Borders & Rings
        border: "hsl(var(--border))",
        "border-strong": "hsl(var(--border-strong))",
        ring: "hsl(var(--ring))",
        
        // Menu Colors System (Mantidos, mas ajustados no index.css dark mode)
        "menu-green": {
          DEFAULT: "hsl(var(--menu-green))",
          hover: "hsl(var(--menu-green-hover))",
        },
        "menu-blue": {
          DEFAULT: "hsl(var(--menu-blue))",
          hover: "hsl(var(--menu-blue-hover))",
        },
        "menu-dark-blue": { 
          DEFAULT: "hsl(213 90% 35%)",
          hover: "hsl(213 90% 30%)",
        },
        "menu-violet": {
          DEFAULT: "hsl(var(--menu-violet))",
          hover: "hsl(var(--menu-violet-hover))",
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
        // Back Button System (Removido, pois não é mais usado)
      },
      borderRadius: {
        lg: "var(--radius-lg)",
        md: "var(--radius)",
        sm: "var(--radius-sm)",
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