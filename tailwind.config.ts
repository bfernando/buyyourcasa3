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
        // Mi Casa Investment Group palette sourced from the original Netlify site
        obsidian: {
          DEFAULT: "#F3EDE4",
          50: "#FFFDF9",
          100: "#FFFAF4",
          200: "#F6F1E9",
          300: "#ECE4D9",
          400: "#E5D7C2",
          500: "#D4C2A8",
          600: "#C2AA85",
          700: "#B59563",
          800: "#6A573E",
          900: "#F3EDE4",
        },
        gold: {
          DEFAULT: "#0D6D66",
          50: "#E9F6F3",
          100: "#CBE8E3",
          200: "#9CD0C8",
          300: "#6CB8AD",
          400: "#2C8E84",
          500: "#0D6D66",
          600: "#0B5F59",
          700: "#094D49",
          800: "#073B38",
          900: "#052926",
        },
        cream: {
          DEFAULT: "#10181C",
          50: "#F8F4EE",
          100: "#ECE4D9",
          200: "#B7A98F",
          300: "#667177",
          400: "#3F494D",
          500: "#10181C",
        },
        surface: {
          DEFAULT: "#FFFAF4",
          card: "#FFFDF9",
          hover: "#F6F1E9",
          border: "#D8C7AA",
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
        "gold-gradient": "linear-gradient(135deg, #094D49 0%, #0D6D66 55%, #16867D 100%)",
        "gold-shimmer": "linear-gradient(90deg, transparent 0%, rgba(13,109,102,0.28) 50%, transparent 100%)",
        "dark-radial": "radial-gradient(ellipse at center, #FFFDF9 0%, #F3EDE4 70%)",
        "hero-gradient": "linear-gradient(to bottom, rgba(255,253,249,0.08) 0%, rgba(255,250,244,0.75) 70%, #F3EDE4 100%)",
        "card-gradient": "linear-gradient(135deg, rgba(13,109,102,0.08) 0%, rgba(181,149,99,0.08) 100%)",
        "glow-gold": "radial-gradient(ellipse at 50% 0%, rgba(13,109,102,0.14) 0%, transparent 70%)",
      },
      boxShadow: {
        "gold-sm": "0 0 20px rgba(13,109,102,0.14)",
        "gold-md": "0 0 40px rgba(13,109,102,0.18)",
        "gold-lg": "0 0 80px rgba(13,109,102,0.22)",
        "glass": "0 18px 40px rgba(54,37,20,0.08), inset 0 1px 0 rgba(255,255,255,0.75)",
        "card": "0 14px 34px rgba(54,37,20,0.08), 0 1px 0 rgba(255,255,255,0.75)",
        "card-hover": "0 22px 48px rgba(54,37,20,0.12), 0 1px 0 rgba(13,109,102,0.12)",
        "form": "0 24px 70px rgba(30,19,9,0.14), 0 1px 0 rgba(255,255,255,0.75)",
        "button": "0 14px 34px rgba(13,109,102,0.24), 0 1px 0 rgba(255,255,255,0.18) inset",
        "button-hover": "0 18px 42px rgba(13,109,102,0.28), 0 1px 0 rgba(255,255,255,0.22) inset",
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
