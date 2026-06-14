/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f0f0f',
        surface: '#1a1a1a',
        border: '#2a2a2a',
        text: {
          primary: '#ffffff',
          secondary: '#a0a0a0',
          muted: '#606060',
        },
        accent: {
          DEFAULT: '#ff6b6b',
          hover: '#ff5252',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      spacing: {
        'sidebar': '280px',
        'panel': '320px',
      },
    },
  },
  plugins: [],
}
