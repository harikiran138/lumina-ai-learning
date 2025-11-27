import type { Config } from 'tailwindcss'

const config: Config = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                // Lumina Brand Colors - Golden Yellow & Black Theme
                lumina: {
                    primary: '#FFD700',        // Golden Yellow
                    'primary-dark': '#DAA520', // Goldenrod
                    'primary-light': '#FFEC8B', // Light Goldenrod
                    secondary: '#FDB931',      // Bright Gold
                    accent: '#FAFAD2',         // Light Golden Yellow
                    dark: '#000000',           // Pure Black
                    'dark-light': '#1a1a1a',   // Almost Black
                    'dark-gray': '#2a2a2a',    // Dark Gray
                    glass: 'rgba(255, 215, 0, 0.1)', // Golden glass
                },
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
                'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
            },
            backdropBlur: {
                xs: '2px',
            },
            boxShadow: {
                'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
                'glow': '0 0 30px rgba(255, 215, 0, 0.6)',
                'gold-glow': '0 0 40px rgba(255, 215, 0, 0.8)',
            },
            animation: {
                'float': 'float 6s ease-in-out infinite',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'shimmer': 'shimmer 2s linear infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-1000px 0' },
                    '100%': { backgroundPosition: '1000px 0' },
                },
            },
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
        require('@tailwindcss/typography'),
    ],
}
export default config
