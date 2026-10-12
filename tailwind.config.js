/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { ink: "#2a1d14", brand: "#e87524", canvas: "#fff8f2", mist: "#fff3e8" },
      boxShadow: {
        card: "0 1px 2px rgba(91,54,26,.05), 0 8px 24px rgba(91,54,26,.07)",
      },
    },
  },
  plugins: [],
};
