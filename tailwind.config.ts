import type { Config } from 'tailwindcss';
export default {
  content: ['./app/**/*.tsx', './components/**/*.tsx'],
  theme: { extend: {
    colors: { ink: '#050505', char: '#141414', silver: '#C0C0C0', chrome: '#E5E5E5', gun: '#555B61', off: '#F5F5F5', muted: '#A5A5A5' },
    fontFamily: { display: ['var(--font-display)', 'serif'], sans: ['var(--font-sans)', 'system-ui', 'sans-serif'] },
  } },
} satisfies Config;
