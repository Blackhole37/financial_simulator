/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        orange: {
          500: "#ff9800",
          600: "#fb8c00",
          700: "#f57c00",
        },
      },
      backgroundImage: {
        "orange-white": "linear-gradient(135deg, #ff9800 0%, #fff 100%)",
        "orange-black": "linear-gradient(135deg, #ff9800 0%, #000 100%)",
        "black-orange": "linear-gradient(135deg, #000 0%, #ff9800 100%)",
        "orange-dark": "linear-gradient(135deg, #fb8c00 0%, #181818 100%)",
      },
      animation: {
        "bounce-slow": "bounce 1.5s infinite",
        "bounce-slower": "bounce 1.7s infinite 0.2s",
        "bounce-slowest": "bounce 1.9s infinite 0.4s",
        shimmer: "shimmer 2s ease-in-out infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
    },
  },
  plugins: [],
};
