/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand palette
        navy: {
          950: '#060D1F',
          900: '#0A1628',
          800: '#0F2040',
          700: '#1A3056',
          600: '#1E3A6B',
          500: '#264B87',
          400: '#3B6BA8',
          300: '#5E8EC9',
          200: '#8DB4E0',
          100: '#C5D9F0',
          50:  '#EBF2FB',
        },
        ivory: {
          50:  '#FAFAF7',
          100: '#F5F0E8',
          200: '#EDE8DF',
          300: '#E0D9CF',
        },
        // Semantic
        income:  '#10B981',  // emerald
        expense: '#EF4444',  // coral-red
        savings: '#8B5CF6',  // violet
        warning: '#F59E0B',  // amber
        // shadcn/ui tokens (mapped to our palette)
        border:     'hsl(var(--border))',
        input:      'hsl(var(--input))',
        ring:       'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT:    'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'display-2xl': ['4.5rem',  { lineHeight: '5.625rem', letterSpacing: '-0.02em' }],
        'display-xl':  ['3.75rem', { lineHeight: '4.5rem',   letterSpacing: '-0.02em' }],
        'display-lg':  ['3rem',    { lineHeight: '3.75rem',  letterSpacing: '-0.02em' }],
        'display-md':  ['2.25rem', { lineHeight: '2.75rem',  letterSpacing: '-0.02em' }],
        'display-sm':  ['1.875rem',{ lineHeight: '2.375rem' }],
        'display-xs':  ['1.5rem',  { lineHeight: '2rem' }],
      },
      boxShadow: {
        'card':      '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)',
        'card-md':   '0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)',
        'card-lg':   '0 10px 25px rgba(0,0,0,0.12), 0 4px 10px rgba(0,0,0,0.08)',
        'glow-sm':   '0 0 15px rgba(99,102,241,0.15)',
        'glow-md':   '0 0 30px rgba(99,102,241,0.20)',
        'inner-sm':  'inset 0 1px 2px rgba(0,0,0,0.1)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
        'fade-in':        'fadeIn 0.3s ease-out',
        'slide-up':       'slideUp 0.3s ease-out',
        'pulse-soft':     'pulseSoft 2s ease-in-out infinite',
        'shimmer':        'shimmer 1.5s infinite',
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up':   { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        fadeIn:    { from: { opacity: '0', transform: 'translateY(4px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseSoft: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.6' } },
        shimmer:   { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
