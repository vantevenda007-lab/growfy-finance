import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1440px' },
    },
    extend: {
      colors: {
        // Brand cosmic palette (primary system)
        cosmos: {
          void: '#00072d',     // Rich Black
          deep: '#051650',     // Dark Navy
          ocean: '#0a2472',    // Bangladesh Blue
          azure: '#123499',    // Caribbean Blue
          mist: '#5eaf73',     // Teal accent
        },
        // Data palette (charts)
        data: {
          ink: '#0F0F0F',
          slate: '#202020',
          pulse: '#5DD62C',
          forest: '#337418',
          paper: '#F8F8F8',
        },
        // Semantic
        success: '#5DD62C',
        warning: '#F39C12',
        danger: '#E74C3C',

        // shadcn-style tokens (CSS vars wired in tokens.css)
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'ITC Avant Garde Gothic', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
      },
      fontSize: {
        'display-xl': ['clamp(3rem, 1.5rem + 5vw, 6rem)', { lineHeight: '0.95', letterSpacing: '-0.04em' }],
        'display-lg': ['clamp(2.25rem, 1.5rem + 3vw, 4rem)', { lineHeight: '1', letterSpacing: '-0.03em' }],
        'display-md': ['clamp(1.75rem, 1rem + 2vw, 2.75rem)', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 6px)',
      },
      boxShadow: {
        glow: '0 0 0 1px hsl(var(--ring) / 0.3), 0 8px 40px -8px hsl(var(--ring) / 0.4)',
        'glow-lg': '0 0 0 1px hsl(var(--ring) / 0.4), 0 24px 80px -20px hsl(var(--ring) / 0.6)',
        cinema: '0 1px 0 0 hsl(0 0% 100% / 0.05) inset, 0 24px 60px -20px rgb(0 0 0 / 0.6)',
      },
      backgroundImage: {
        'gradient-cosmos': 'radial-gradient(ellipse at top, hsl(var(--cosmos-glow) / 0.4) 0%, transparent 60%), linear-gradient(180deg, #00072d 0%, #051650 50%, #00072d 100%)',
        'gradient-azure': 'linear-gradient(135deg, #0a2472 0%, #123499 100%)',
        'gradient-pulse': 'linear-gradient(135deg, #5DD62C 0%, #337418 100%)',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.36 0 0 0 0 0.69 0 0 0 0 0.17 0 0 0 0.4 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.7' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'orbit': {
          from: { transform: 'rotate(0deg) translateX(40px) rotate(0deg)' },
          to: { transform: 'rotate(360deg) translateX(40px) rotate(-360deg)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fade-in 0.4s ease-out both',
        'glow-pulse': 'glow-pulse 4s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'orbit': 'orbit 8s linear infinite',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'out-back': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [animate],
};

export default config;
