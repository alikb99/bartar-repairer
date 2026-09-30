import type { Config } from "tailwindcss";

/* Colours live as RGB channels in app/globals.css (the single source of truth)
   so the hand-written CSS there and these utilities can never drift apart.
   The channel form is what keeps opacity modifiers (`border-accent/40`,
   `via-ink-950/86`) working — Tailwind substitutes <alpha-value> per usage. */
const c = (token: string) => `rgb(var(${token}) / <alpha-value>)`;

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    // Frozen pages are raw HTML served from public/ (docs/frozen-pages.md).
    // Without them here Tailwind purges the utilities only they use — the
    // /prices/ hero gradient — and they render half-styled. /acer/, /app/ and
    // /warranty/ are excluded: each ships its own inline stylesheet.
    "./public/prices/index.html",
    "./public/mobile-repair-online/index.html",
  ],
  theme: {
    extend: {
      colors: {
        // Single accent color used across the entire site (ui design system)
        accent: {
          DEFAULT: c("--c-red-500"),
          soft: c("--c-red-400"),
          deep: c("--c-red-600"),
          tint: c("--c-red-50"),
        },
        // Blue-tinted neutral ramp. 950-850 are dark surfaces, 800-500 body
        // text, 400-100 muted text, borders on dark, and disabled states.
        ink: {
          950: c("--c-ink-950"),
          925: c("--c-ink-925"),
          900: c("--c-ink-900"),
          875: c("--c-ink-875"),
          850: c("--c-ink-850"),
          800: c("--c-ink-800"),
          700: c("--c-ink-700"),
          500: c("--c-ink-500"),
          400: c("--c-ink-400"),
          300: c("--c-ink-300"),
          200: c("--c-ink-200"),
          100: c("--c-ink-100"),
        },
        // Light surfaces, lightest to most sunken.
        surface: {
          DEFAULT: c("--c-white"),
          muted: c("--c-sand-50"),
          subtle: c("--c-sand-100"),
          sunken: c("--c-sand-300"),
        },
        paper: c("--c-sand-200"),
        line: c("--c-sand-400"),
        hairline: c("--c-sand-500"),
        edge: c("--c-sand-700"),
        // Status. `whatsapp` is a third-party brand colour: never re-theme it.
        success: c("--c-green-500"),
        whatsapp: c("--c-whatsapp"),
      },
      fontFamily: {
        sans: ["Vazirmatn", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        tightest: "-0.04em",
      },
      borderRadius: {
        pill: "var(--radius-pill)",
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        card: "var(--shadow-card)",
        float: "var(--shadow-float)",
        lift: "var(--shadow-lift)",
        inset: "var(--shadow-inset)",
      },
      transitionTimingFunction: {
        premium: "var(--ease-premium)",
      },
      transitionDuration: {
        fast: "var(--duration-fast)",
        normal: "var(--duration-normal)",
        slow: "var(--duration-slow)",
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
