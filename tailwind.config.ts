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
        // --- BASE COLORS (ZINC) ---
        background: "hsl(var(--background))",
        'background-secondary': "hsl(var(--background-secondary))",
        foreground: "hsl(var(--foreground))",
        
        // --- CARDS & SURFACES ---
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
          hover: "hsl(var(--card-hover))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        modal: {
          DEFAULT: "hsl(var(--modal))",
          border: "hsl(var(--modal-border))",
        },
        overlay: "hsl(var(--overlay))",
        
        // --- INPUTS & BORDERS ---
        border: "hsl(var(--border))",
        'border-strong': "hsl(var(--border-strong))",
        ring: "hsl(var(--ring))",
        input: "hsl(var(--input))",
        'input-bg': "hsl(var(--input-bg))",
        'input-foreground': "hsl(var(--input-foreground))",
        'input-placeholder': "hsl(var(--input-placeholder))",

        // --- PRIMARY & SECONDARY ---
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover: "hsl(var(--primary-hover))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        
        // --- SEMANTIC STATES ---
        destructive: {
          DEFAULT: "hsl(var(--error))",
          foreground: "hsl(var(--error-foreground))",
        },
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
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
          bg: "hsl(var(--info-bg))",
        },
        error: {
          DEFAULT: "hsl(var(--error))",
          foreground: "hsl(var(--error-foreground))",
          bg: "hsl(var(--error-bg))",
        },
        
        // Menu Colors System (Preserved)
        "menu-green": {
          DEFAULT: "hsl(var(--menu-green))",
          hover: "hsl(var(--menu-green-hover))",
        },
        "menu-blue": {
          DEFAULT: "hsl(var(--menu-blue))",
          hover: "hsl(var(--menu-blue-hover))",
        },
        "menu-dark-blue": { 
          DEFAULT: "hsl(var(--menu-dark-blue))",
          hover: "hsl(var(--menu-dark-blue-hover))",
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
        // NOVO: Keyframes para a animação de entrada do conteúdo
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        fadeIn: "fadeIn 0.5s ease-out",
        slideIn: "slideIn 0.3s ease-out",
        // NOVO: Animação de entrada
        'fade-in': 'fade-in 0.5s ease-out forwards',
      },
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-lg)',
        '2xl': 'var(--shadow-lg)',
      }
    },
  },
  // Adicionando classes dinâmicas ao safelist
  safelist: [
    'bg-primary/20',
    'bg-violet-500/20',
  ],
  plugins: [require("tailwindcss-animate")],
} satisfies Config;