import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FAF8F5",
        ink: "#2D2A26",
        accent: "#C4A882",
      },
    },
  },
  plugins: [],
} satisfies Config;
