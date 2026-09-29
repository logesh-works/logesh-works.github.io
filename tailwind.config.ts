import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

/** Width of N grid columns (16-column grid, fluid). See docs/design-spec.md §1.2. */
const col = (n: number) => `calc(var(--col) * ${n} + var(--gutter) * ${n - 1})`;

const config: Config = {
  content: ["./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}"],
  theme: {
    screens: {
      xs: "450px",
      sm: "600px",
      md: "768px",
      lg: "1024px",
      lx: "1100px",
      xl: "1340px",
      "2xl": "1440px",
      "3xl": "1920px",
    },
    container: {
      center: true,
      padding: { DEFAULT: "20px", lg: "50px" },
    },
    extend: {
      colors: {
        ink: "rgb(var(--ink) / <alpha-value>)",
        panel: "rgb(var(--panel) / <alpha-value>)",
        raised: "rgb(var(--raised) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        fg: "rgb(var(--fg) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        signal: "rgb(var(--accent) / <alpha-value>)",
        steel: "rgb(var(--accent-deep) / <alpha-value>)",
      },
      fontFamily: {
        display: ["var(--font-archivo)", "Helvetica", "Arial", "sans-serif"],
        sans: ["var(--font-archivo)", "Helvetica", "Arial", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      spacing: {
        edge: "var(--edge)",
      },
      width: Object.fromEntries(Array.from({ length: 16 }, (_, i) => [`col-${i + 1}`, col(i + 1)])),
      maxWidth: Object.fromEntries(Array.from({ length: 16 }, (_, i) => [`col-${i + 1}`, col(i + 1)])),
      opacity: {
        15: "0.15",
        35: "0.35",
        45: "0.45",
        55: "0.55",
        65: "0.65",
        85: "0.85",
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.165, 0.84, 0.44, 1)",
        inout: "cubic-bezier(0.77, 0, 0.175, 1)",
        wipe: "cubic-bezier(1, 0.01, 0.24, 0.995)",
      },
    },
  },
  plugins: [
    // Width axis of Archivo: display type runs wide like the reference's extended faces.
    plugin(({ addUtilities }) => {
      addUtilities({
        ".wide": { "font-variation-settings": '"wdth" var(--display-wdth, 125)' },
        ".semi-wide": { "font-variation-settings": '"wdth" 112' },
      });
    }),
  ],
};

export default config;
