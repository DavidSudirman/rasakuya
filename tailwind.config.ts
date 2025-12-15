// tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
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
          glow: "hsl(var(--primary-glow))",
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
        mood: {
          happy: "hsl(var(--mood-happy))",
          good: "hsl(var(--mood-good))",
          neutral: "hsl(var(--mood-neutral))",
          sad: "hsl(var(--mood-sad))",
          angry: "hsl(var(--mood-angry))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },

      // 🌄 Background images
      backgroundImage: {
        "gradient-sunrise": "var(--gradient-sunrise)",
        "gradient-calm": "var(--gradient-calm)",
        "gradient-nature": "var(--gradient-nature)",

        // 🌅 Mood backgrounds
        "mood-happy": "url('/themes/happy1.jpg')", // with trees
        "mood-happy-plain": "url('/themes/happy1-no-trees.jpg')", // no trees background
      },

      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      // 🎬 Keyframes
      keyframes: {
        // Accordion UI
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },

        // ⚡ White flash cinematic effect
        whiteflash: {
          "0%": { opacity: "0", background: "rgba(255,255,255,0)" },
          "20%": { opacity: "0.6", background: "rgba(255,255,255,0.6)" },
          "40%": { opacity: "1", background: "rgba(255,255,255,1)" },
          "70%": { opacity: "1", background: "rgba(255,255,255,1)" },
          "100%": { opacity: "0", background: "rgba(255,255,255,0)" },
        },

        // 🌳 Tree growth effect
        "trees-grow": {
          "0%": { transform: "translateZ(0) scale(0.60)", opacity: "0" },
          "100%": { transform: "translateZ(0) scale(1.00)", opacity: "1" },
        },

        // 🍃 Leaf effects
        "leaf-fall-once": {
          "0%": { transform: "translateY(-10vh)", opacity: "0" },
          "10%": { opacity: "1" },
          "100%": { transform: "translateY(110vh)", opacity: "1" },
        },
        "leaf-sway": {
          "0%": { transform: "translateX(-25px)" },
          "50%": { transform: "translateX(25px)" },
          "100%": { transform: "translateX(-25px)" },
        },
        "leaf-spin": {
          "0%": { rotate: "0deg" },
          "100%": { rotate: "360deg" },
        },
      },

      // 🌀 Animation setup
      animation: {
        // Core components
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",

        // Cinematic effects
        whiteflash: "whiteflash 1s ease-in-out",
        "trees-grow": "trees-grow 2.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",

        // Leaves VFX
        "leaf-fall-once": "leaf-fall-once var(--fallDur,6s) linear forwards",
        "leaf-sway": "leaf-sway var(--swayDur,3s) ease-in-out infinite",
        "leaf-spin": "leaf-spin var(--spinDur,10s) linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
