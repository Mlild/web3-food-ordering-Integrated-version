import type { Config } from "tailwindcss";

// MealVote warm-earth design tokens.
// Source of truth: design-system/mealvote-main-app/MASTER.md
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
        border: "hsl(40 22% 84%)",
        "border-soft": "hsla(40 22% 84% / 0.72)",
        input: "hsl(40 22% 84%)",
        ring: "hsl(24 66% 34%)",
        background: "hsl(42 36% 95%)",
        "background-deep": "hsl(38 29% 88%)",
        foreground: "hsl(24 26% 17%)",
        "foreground-soft": "hsl(29 12% 38%)",

        primary: {
          DEFAULT: "hsl(24 66% 34%)",
          foreground: "hsl(39 90% 97%)"
        },
        secondary: {
          DEFAULT: "hsl(38 29% 88%)",
          foreground: "hsl(24 26% 17%)"
        },
        destructive: {
          DEFAULT: "hsl(0 72% 51%)",
          foreground: "#FFFFFF"
        },
        accent: {
          DEFAULT: "hsl(30 80% 52%)",
          foreground: "hsl(39 90% 97%)"
        },
        muted: {
          DEFAULT: "hsl(40 26% 90%)",
          foreground: "hsl(29 12% 38%)"
        },
        card: {
          DEFAULT: "hsl(39 90% 98%)",
          foreground: "hsl(24 26% 17%)"
        },
        popover: {
          DEFAULT: "hsl(39 90% 98%)",
          foreground: "hsl(24 26% 17%)"
        },

        marker: {
          red: "hsl(30 80% 52%)",
          blue: "hsl(24 66% 34%)",
          green: "hsl(142 38% 36%)",
          yellow: "hsl(41 82% 68%)"
        },
        pencil: "hsl(24 26% 17%)",
        paper: "hsl(42 36% 95%)",
        "kraft-brown": "hsl(31 34% 73%)",

        "chain-gold": {
          DEFAULT: "hsl(30 80% 52%)",
          soft: "hsl(38 80% 74%)"
        },
        "verified-emerald": "hsl(142 38% 36%)"
      },
      fontFamily: {
        display: ["Manrope", '"Noto Sans TC"', "system-ui", "sans-serif"],
        body: ['"Noto Sans TC"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "monospace"]
      },
      borderRadius: {
        sketch: "15px 25px 20px 10px",
        "sketch-alt": "25px 10px 15px 20px",
        "sketch-sm": "10px 15px 12px 8px",
        "sketch-lg": "20px 30px 25px 15px",
        sm: "0.5rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.25rem",
        "2xl": "1.5rem"
      },
      boxShadow: {
        sketch: "0 18px 40px rgba(76, 49, 28, 0.14)",
        "sketch-sm": "0 10px 24px rgba(76, 49, 28, 0.1)",
        "sketch-lg": "0 24px 56px rgba(76, 49, 28, 0.18)",
        "sketch-hover": "0 24px 52px rgba(76, 49, 28, 0.2)",
        "sketch-active": "0 12px 26px rgba(76, 49, 28, 0.14)",
        "sketch-gold": "0 18px 38px rgba(186, 110, 39, 0.24)",
        "sketch-red": "0 18px 38px rgba(125, 68, 29, 0.24)",
        float: "0 20px 50px rgba(76, 49, 28, 0.12)"
      },
      keyframes: {
        wiggle: {
          "0%, 100%": { transform: "rotate(-1deg)" },
          "50%": { transform: "rotate(1deg)" }
        },
        jiggle: {
          "0%, 100%": { transform: "rotate(-2deg)" },
          "25%": { transform: "rotate(2deg)" },
          "75%": { transform: "rotate(-1deg)" }
        },
        "sketch-in": {
          "0%": { opacity: "0", transform: "scale(0.95) rotate(-2deg)" },
          "100%": { opacity: "1", transform: "scale(1) rotate(0deg)" }
        },
        "pencil-draw": {
          "0%": { strokeDashoffset: "100" },
          "100%": { strokeDashoffset: "0" }
        }
      },
      animation: {
        wiggle: "wiggle 3s ease-in-out infinite",
        jiggle: "jiggle 0.4s ease-in-out",
        "sketch-in": "sketch-in 0.3s ease-out",
        "pencil-draw": "pencil-draw 0.8s ease-out forwards"
      }
    }
  },
  plugins: []
};

export default config;
