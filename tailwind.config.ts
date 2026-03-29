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
        // Surfaces (light-mode only)
        surface: "#fbf9f9",
        "surface-container-low": "#f5f3f3",
        "surface-container": "#efeded",
        "surface-container-high": "#e9e8e8",
        "surface-container-highest": "#e4e2e2",
        "surface-container-lowest": "#ffffff",

        // Text
        "on-surface": "#1b1c1c",
        "on-surface-variant": "#424753",
        outline: "#727785",
        "outline-variant": "#c2c6d5",

        // Brand Spectrum
        primary: "#0058bd",
        "primary-container": "#2771df",
        "primary-fixed": "#d8e2ff",
        "on-primary-container": "#fefcff",
        secondary: "#006e2c",
        "secondary-container": "#86f898",
        "on-secondary-container": "#002107",
        tertiary: "#b51b15",
        "tertiary-container": "#d9372b",
        warning: "#FBBC05",
        error: "#ba1a1a",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-lg": [
          "60px",
          { fontWeight: "900", letterSpacing: "-0.02em", lineHeight: "1.1" },
        ],
        "headline-lg": [
          "32px",
          { fontWeight: "800", letterSpacing: "-0.02em", lineHeight: "1.2" },
        ],
        "headline-md": [
          "24px",
          { fontWeight: "700", letterSpacing: "-0.02em", lineHeight: "1.3" },
        ],
        "headline-sm": [
          "20px",
          { fontWeight: "700", letterSpacing: "-0.02em", lineHeight: "1.3" },
        ],
        "title-lg": [
          "18px",
          { fontWeight: "600", letterSpacing: "0", lineHeight: "1.4" },
        ],
        "body-md": [
          "14px",
          { fontWeight: "400", letterSpacing: "0", lineHeight: "1.5" },
        ],
        "label-md": [
          "12px",
          { fontWeight: "700", letterSpacing: "0.05em", lineHeight: "1.4" },
        ],
      },
      borderRadius: {
        DEFAULT: "1rem",
      },
      boxShadow: {
        ghost: "0 20px 40px rgba(17,17,24,0.04)",
        mic: "0 20px 60px rgba(186,26,26,0.40)",
      },
    },
  },
  plugins: [],
};

export default config;
