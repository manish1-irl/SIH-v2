import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["Lora", "Georgia", "serif"],
        sans: ["Montserrat", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      colors: {
        antigravity: {
          cream: "#FDFBF7",
          navy: "#0A2540",
          sage: "#87A96B",
          orange: "#D96B27",
          charcoal: "#2B1C03",
        },
      },
      boxShadow: {
        subtle: "0 8px 22px -4px rgba(180, 160, 135, 0.22), 0 3px 8px -2px rgba(180, 160, 135, 0.12)",
        elevated: "0 16px 36px -6px rgba(180, 160, 135, 0.28), 0 6px 14px -3px rgba(180, 160, 135, 0.16)",
        warm: "0 10px 25px -4px rgba(180, 160, 135, 0.28), 0 4px 10px -2px rgba(180, 160, 135, 0.16)",
      },
    },
  },
  plugins: [],
};
export default config;
