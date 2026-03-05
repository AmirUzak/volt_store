import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        volt: {
          primary: '#0ea5e9',
          dark: '#0f172a',
          card: '#1e293b',
          muted: '#64748b',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 20px rgba(0,0,0,0.08), 0 0 1px rgba(0,0,0,0.05)',
        'card-hover': '0 12px 40px rgba(0,0,0,0.12), 0 0 1px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
};

export default config;
