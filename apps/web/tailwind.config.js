module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./ee/components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    fontFamily: {
      sans: ["Roboto", "sans-serif"],
    },
    extend: {
      colors: {
        /* your primary brand color */
        brand: "var(--brand-color)",
        brandcontrast: "var(--brand-text-color)",
        darkmodebrand: "var(--brand-color-dark-mode)",
        darkmodebrandcontrast: "var(--brand-text-color-dark-mode)",
        black: "#111111",
        gray: {
          50: "#F8F8F8",
          100: "#F5F5F5",
          200: "#E1E1E1",
          300: "#CFCFCF",
          400: "#ACACAC",
          500: "#888888",
          600: "#494949",
          700: "#3E3E3E",
          800: "#313131",
          900: "#292929",
        },
        neutral: {
          50: "#F8F8F8",
          100: "#F5F5F5",
          200: "#E1E1E1",
          300: "#CFCFCF",
          400: "#ACACAC",
          500: "#888888",
          600: "#494949",
          700: "#3E3E3E",
          800: "#313131",
          900: "#292929",
        },
        primary: {
          50: "#F4F4F4",
          100: "#E8E8E8",
          200: "#C6C6C6",
          300: "#A3A3A3",
          400: "#5F5F5F",
          500: "#1A1A1A",
          600: "#171717",
          700: "#141414",
          800: "#101010",
          900: "#0D0D0D",
        },
        secondary: {
          50: "#F5F8F7",
          100: "#EBF0F0",
          200: "#CDDAD9",
          300: "#AEC4C2",
          400: "#729894",
          500: "#356C66",
          600: "#30615C",
          700: "#28514D",
          800: "#20413D",
          900: "#223B41",
        },
        red: {
          50: "#FEF2F2",
          100: "#FEE2E2",
          200: "#FECACA",
          300: "#FCA5A5",
          400: "#F87171",
          500: "#EF4444",
          600: "#DC2626",
          700: "#B91C1C",
          800: "#991B1B",
          900: "#7F1D1D",
        },
        orange: {
          50: "#FFF7ED",
          100: "#FFEDD5",
          200: "#FED7AA",
          300: "#FDBA74",
          400: "#FB923C",
          500: "#F97316",
          600: "#EA580C",
          700: "#C2410C",
          800: "#9A3412",
          900: "#7C2D12",
        },
        green: {
          50: "#ECFDF5",
          100: "#D1FAE5",
          200: "#A7F3D0",
          300: "#6EE7B7",
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
          700: "#047857",
          800: "#065F46",
          900: "#064E3B",
        },
      },
      fontFamily: {
        cal: ["Cal Sans", "sans-serif"],
      },
      maxHeight: (theme) => ({
        0: "0",
        97: "25rem",
        ...theme("spacing"),
        full: "100%",
        screen: "100vh",
      }),
      minHeight: (theme) => ({
        0: "0",
        ...theme("spacing"),
        full: "100%",
        screen: "100vh",
      }),
      minWidth: (theme) => ({
        0: "0",
        ...theme("spacing"),
        full: "100%",
        screen: "100vw",
      }),
      maxWidth: (theme, { breakpoints }) => ({
        0: "0",
        ...theme("spacing"),
        ...breakpoints(theme("screens")),
        full: "100%",
        screen: "100vw",
      }),
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
