import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // HackerRank brand palette
        terminal: '#141419',
        terrain: '#003333',
        canvas: '#FFFFFF',
        cursor: '#05C770',
        aurora: '#AEF96C',
        sprout: '#DBFFC2',
        dew: '#EFFFE5',
        ember: '#D26F6C',
        dune: '#FABD83',
        universe: '#3355FF',
        glacier: '#C3EDFF',
        ice: '#E7F8FF',
        comet: '#AA99FF',
        sunrise: '#FCF283',
        // Surface shades built on terminal
        surface: '#1C1C24',
        'surface-raised': '#23232D',
        'surface-border': '#2E2E3A',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-newsreader)', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;
