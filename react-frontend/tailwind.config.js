/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary:   '#060816',
          secondary: '#0B1020',
          card:      'rgba(255,255,255,0.04)',
        },
        neon: {
          purple: '#8B5CF6',
          blue:   '#5B5CFF',
          pink:   '#C026D3',
          cyan:   '#22D3EE',
        },
        accent: {
          green:  '#22C55E',
          blue:   '#3B82F6',
          orange: '#F59E0B',
          pink:   '#EC4899',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        neon:         '0 0 20px rgba(139,92,246,0.35)',
        'neon-blue':  '0 0 20px rgba(91,92,255,0.35)',
        'neon-green': '0 0 20px rgba(34,197,94,0.35)',
        'neon-pink':  '0 0 20px rgba(192,38,211,0.35)',
        card:         '0 8px 32px rgba(0,0,0,0.4)',
      },
      backgroundImage: {
        'gradient-neon': 'linear-gradient(135deg,#5B5CFF,#8B5CF6,#C026D3)',
        'gradient-card': 'linear-gradient(135deg,rgba(91,92,255,0.1),rgba(139,92,246,0.05))',
      },
      borderRadius: {
        xl2: '20px',
        xl3: '28px',
      },
      animation: {
        'pulse-slow':    'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'glow':          'glow 2s ease-in-out infinite alternate',
        'float':         'float 6s ease-in-out infinite',
        'spin-slow':     'spin 8s linear infinite',
        'gradient-x':    'gradient-x 6s ease infinite',
      },
      keyframes: {
        glow: {
          '0%':   { boxShadow: '0 0 10px rgba(139,92,246,0.3)' },
          '100%': { boxShadow: '0 0 30px rgba(139,92,246,0.7)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%':     { transform: 'translateY(-10px)' },
        },
        'gradient-x': {
          '0%,100%': { backgroundPosition: '0% 50%' },
          '50%':     { backgroundPosition: '100% 50%' },
        },
      },
    },
  },
  plugins: [],
}
