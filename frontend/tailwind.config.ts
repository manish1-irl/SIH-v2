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
        subtle: "0 10px 25px -5px rgba(10, 37, 64, 0.08)",
        elevated: "0 20px 35px -10px rgba(10, 37, 64, 0.14)",
      },
    },
  },
  plugins: [],
};
export default config;
