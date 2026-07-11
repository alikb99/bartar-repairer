import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Single accent color used across the entire site (ui design system)
        accent: {
          DEFAULT: "#DA251C",
          soft: "#E0473F",
          deep: "#B3170F",
          tint: "#FBEAE9",
        },
        ink: {
          950: "#13161C",
          900: "#1B1F27",
          800: "#3A4150",
          700: "#4A5160",
          500: "#5B6270",
          300: "#9098A6",
        },
        paper: "#F5F6F8",
        line: "#EDEFF3",
        hairline: "#E7E9EE",
      },
      fontFamily: {
        sans: ["var(--font-vazir)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        tightest: "-0.04em",
      },
      boxShadow: {
        soft: "0 16px 50px -24px rgba(17,17,17,0.22)",
        card: "0 2px 12px -4px rgba(17,17,17,0.07)",
        float: "0 30px 80px -40px rgba(17,17,17,0.3)",
      },
      transitionTimingFunction: {
        premium: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        floaty: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        btfloat: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-16px)" },
        },
        btfloat2: {
          "0%, 100%": { transform: "translateY(0) rotate(-4deg)" },
          "50%": { transform: "translateY(-22px) rotate(-4deg)" },
        },
        btpulse: {
          "0%, 100%": { opacity: ".5", transform: "scale(1)" },
          "50%": { opacity: ".85", transform: "scale(1.05)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.25" },
        },
      },
      animation: {
        floaty: "floaty 7s ease-in-out infinite",
        btfloat: "btfloat 6.5s ease-in-out infinite",
        btfloat2: "btfloat2 5.5s ease-in-out infinite",
        btpulse: "btpulse 7s ease-in-out infinite",
        marquee: "marquee 38s linear infinite",
        blink: "blink 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
