/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html','./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        skill: {
          primary: '#0B2A44',
          accent: '#2B6CB0',
          ink: '#0B1220'
        }
      },
      boxShadow: {
        soft: '0 10px 30px rgba(11,42,68,0.12)'
      }
    }
  },
  plugins: []
}

  