/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    darkMode: 'class',
    theme: {
        extend: {
            /* ─ COLOR SYSTEM ─ */
            colors: {
                // Semantic color tokens using CSS variables
                background: 'var(--bg-primary)',
                surface: 'var(--bg-surface)',
                elevated: 'var(--bg-elevated)',
                foreground: 'var(--text-primary)',
                muted: 'var(--text-secondary)',
                'muted-foreground': 'var(--text-tertiary)',

                // Legacy brand colors
                brand: {
                    50: '#eff6ff',
                    100: '#dbeafe',
                    200: '#bfdbfe',
                    300: '#93c5fd',
                    400: '#60a5fa',
                    500: '#3b82f6',
                    600: '#2563eb',
                    700: '#1d4ed8',
                    800: '#1e40af',
                    900: '#1e3a8a',
                    950: '#172554',
                },

                // Neutral scale
                neutral: {
                    50: 'var(--neutral-50)',
                    100: 'var(--neutral-100)',
                    150: 'var(--neutral-150)',
                    200: 'var(--neutral-200)',
                    300: 'var(--neutral-300)',
                    400: 'var(--neutral-400)',
                    500: 'var(--neutral-500)',
                    600: 'var(--neutral-600)',
                    700: 'var(--neutral-700)',
                    800: 'var(--neutral-800)',
                    900: 'var(--neutral-900)',
                },

                // Status colors
                success: 'var(--color-success)',
                warning: 'var(--color-warning)',
                danger: 'var(--color-danger)',
                info: 'var(--color-info)',
            },

            /* ─ TYPOGRAPHY ─ */
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
                mono: ['Menlo', 'Monaco', 'Courier New', 'monospace'],
            },

            /* ─ SPACING ─ */
            spacing: {
                'sidebar': 'var(--sidebar-width)',
                'sidebar-collapsed': 'var(--sidebar-width-collapsed)',
                'header': 'var(--header-height)',
            },

            /* ─ BORDER RADIUS ─ */
            borderRadius: {
                'sm': 'var(--radius-sm)',
                'base': 'var(--radius-base)',
                'md': 'var(--radius-md)',
                'lg': 'var(--radius-lg)',
                'xl': 'var(--radius-xl)',
                '2xl': 'var(--radius-2xl)',
            },

            /* ─ SHADOWS ─ */
            boxShadow: {
                'elevation-1': '0 1px 2px rgba(0, 0, 0, 0.02), 0 1px 4px rgba(0, 0, 0, 0.02)',
                'elevation-2': '0 2px 4px rgba(0, 0, 0, 0.03), 0 2px 6px rgba(0, 0, 0, 0.02)',
                'elevation-3': '0 4px 12px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.02)',
                'elevation-4': '0 8px 20px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.02)',
                'elevation-5': '0 12px 32px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.04)',
                'overlay': '0 25px 50px rgba(0, 0, 0, 0.15)',
            },

            /* ─ Z-INDEX ─ */
            zIndex: {
                'base': 'var(--z-base)',
                'sticky': 'var(--z-sticky)',
                'dropdown': 'var(--z-dropdown)',
                'sidebar-nav': 'var(--z-sidebar-nav)',
                'overlay': 'var(--z-overlay)',
                'modal': 'var(--z-modal)',
                'tooltip': 'var(--z-tooltip)',
            },

            /* ─ ANIMATIONS ─ */
            animation: {
                'skeleton': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'fade-in': 'fadeIn 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
                'slide-up': 'slideUp 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
                'scale-in': 'scaleIn 0.25s cubic-bezier(0.23, 1, 0.32, 1)',
                'shimmer': 'shimmer 2s linear infinite',
                'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'spin': 'spin 1s linear infinite',
            },

            /* ─ KEYFRAMES ─ */
            keyframes: {
                skeleton: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.5' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(16px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                scaleIn: {
                    '0%': { transform: 'scale(0.95)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-1000px 0' },
                    '100%': { backgroundPosition: '1000px 0' },
                },
                pulse: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.5' },
                },
                spin: {
                    'from': { transform: 'rotate(0deg)' },
                    'to': { transform: 'rotate(360deg)' },
                },
            },

            /* ─ TRANSITIONS ─ */
            transitionDuration: {
                '75': '75ms',
                '100': '100ms',
                '150': '150ms',
                '200': '200ms',
                '250': '250ms',
                '300': '300ms',
                '400': '400ms',
                '600': '600ms',
            },

            /* ─ BACKDROP FILTERS ─ */
            backdropBlur: {
                'xs': '2px',
                'sm': '4px',
                'md': '12px',
                'lg': '16px',
            },
        },
    },
    plugins: [],
}
