import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        redhorse: {
          red: '#9b2c2c',
          red700: '#7a2222',
          gold: '#c9a86a',
          gold700: '#a78b52',
          ink: '#141414'
        }
      },
      container: { center: true, padding: '1rem', screens: { '2xl': '1200px' } }
    }
  },
  plugins: []
}

export default config

