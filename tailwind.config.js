/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./index.tsx",
    "./components/**/*.{ts,tsx}",
    "./agents/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: "var(--bg-primary)",
        foreground: "var(--text-primary)",
        card: {
          DEFAULT: "var(--bg-card)",
          foreground: "var(--text-primary)"
        },
        popover: {
          DEFAULT: "var(--bg-elevated)",
          foreground: "var(--text-primary)"
        },
        primary: {
          DEFAULT: "var(--brand-red-600)",
          foreground: "#FFFFFF"
        },
        secondary: {
          DEFAULT: "var(--bg-secondary)",
          foreground: "var(--text-secondary)"
        },
        muted: {
          DEFAULT: "var(--bg-tertiary)",
          foreground: "var(--text-muted)"
        },
        accent: {
          DEFAULT: "var(--accent-red)",
          foreground: "#FFFFFF"
        },
        destructive: {
          DEFAULT: "#DC2626",
          foreground: "#FFFFFF"
        },
        success: "#10B981",
        border: "var(--border-default)",
        input: "var(--glass-border)",
        ring: "var(--brand-red-600)",
      },
      borderRadius: {
        lg: "var(--radius-lg)",
        md: "var(--radius-md)",
        sm: "var(--radius-sm)",
      },
      fontFamily: {
        'telugu': ['"Noto Sans Telugu"', 'sans-serif'],
        'serif-telugu': ['"Noto Serif Telugu"', 'serif'],
        'cinema': ['"Playfair Display"', 'serif'],
        'sans': ['"Outfit"', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' }
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-20px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' }
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(220, 38, 38, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(220, 38, 38, 0.6)' }
        }
      }
    }
  },
  plugins: [],
}
