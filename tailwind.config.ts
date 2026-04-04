import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core brand palette
        obsidian: {
          DEFAULT: "#08080C",
          50: "#F4F4F6",
          100: "#E9E9ED",
          200: "#C8C8D2",
          300: "#A7A7B7",
          400: "#65659C",
          500: "#232341",
          600: "#1A1A33",
          700: "#111124",
          800: "#0D0D1A",
          900: "#08080C",
        },
        gold: {
          DEFAULT: "#C9A96E",
          50: "#FDF8EF",
          100: "#F8EDDA",
          200: "#F1DEB6",
          300: "#E8C98A",
          400: "#DEBA6E",
          500: "#C9A96E",
          600: "#B8964E",
          700: "#8B7142",
          800: "#5E4C2D",
          900: "#3D2E1A",
        },
        cream: {
          DEFAULT: "#F8F4EE",
          50: "#FFFFFF",
          100: "#FDFCFA",
          200: "#F8F4EE",
          300: "#EDE6D9",
          400: "#D8CDB8",
          500: "#BFB09A",
        },
        surface: {
          DEFAULT: "#111117",
          card: "#16161E",
          hover: "#1E1E28",
          border: "#242430",
        },
      },
      fontFamily: {
        display: ["var(--font-cormorant)", "Georgia", "serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-2xl": ["clamp(3.5rem, 8vw, 7rem)", { lineHeight: "1.0", letterSpacing: "-0.02em" }],
        "display-xl": ["clamp(2.8rem, 6vw, 5.5rem)", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
        "display-lg": ["clamp(2.2rem, 4.5vw, 4rem)", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "display-md": ["clamp(1.75rem, 3vw, 2.75rem)", { lineHeight: "1.15", letterSpacing: "-0.015em" }],
        "display-sm": ["clamp(1.4rem, 2.5vw, 2rem)", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, #C9A96E 0%, #E8C98A 50%, #C9A96E 100%)",
        "gold-shimmer": "linear-gradient(90deg, transparent 0%, rgba(201,169,110,0.3) 50%, transparent 100%)",
        "dark-radial": "radial-gradient(ellipse at center, #1A1A24 0%, #08080C 70%)",
        "hero-gradient": "linear-gradient(to bottom, rgba(8,8,12,0.3) 0%, rgba(8,8,12,0.7) 60%, rgba(8,8,12,1) 100%)",
        "card-gradient": "linear-gradient(135deg, rgba(201,169,110,0.08) 0%, rgba(201,169,110,0.02) 100%)",
        "glow-gold": "radial-gradient(ellipse at 50% 0%, rgba(201,169,110,0.15) 0%, transparent 70%)",
      },
      boxShadow: {
        "gold-sm": "0 0 20px rgba(201,169,110,0.15)",
        "gold-md": "0 0 40px rgba(201,169,110,0.2)",
        "gold-lg": "0 0 80px rgba(201,169,110,0.25)",
        "glass": "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
        "card": "0 4px 24px rgba(0,0,0,0.3), 0 1px 0 rgba(255,255,255,0.04)",
        "card-hover": "0 8px 48px rgba(0,0,0,0.4), 0 1px 0 rgba(201,169,110,0.1)",
        "form": "0 24px 80px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.06)",
        "button": "0 4px 20px rgba(201,169,110,0.3), 0 1px 0 rgba(255,255,255,0.15) inset",
        "button-hover": "0 8px 32px rgba(201,169,110,0.4), 0 1px 0 rgba(255,255,255,0.2) inset",
      },
      animation: {
        "shimmer": "shimmer 2.5s linear infinite",
        "float": "float 6s ease-in-out infinite",
        "pulse-gold": "pulse-gold 3s ease-in-out infinite",
        "grain": "grain 8s steps(10) infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-100% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        "pulse-gold": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
        grain: {
          "0%, 100%": { transform: "translate(0, 0)" },
          "10%": { transform: "translate(-2%, -3%)" },
          "20%": { transform: "translate(3%, 2%)" },
          "30%": { transform: "translate(-1%, 4%)" },
          "40%": { transform: "translate(2%, -1%)" },
          "50%": { transform: "translate(-3%, 2%)" },
          "60%": { transform: "translate(1%, -4%)" },
          "70%": { transform: "translate(3%, 3%)" },
          "80%": { transform: "translate(-2%, 1%)" },
          "90%": { transform: "translate(1%, -2%)" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

export default config;
