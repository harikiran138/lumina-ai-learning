import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                lumina: {
                    primary: '#FFD700', // Gold
                    secondary: '#FDB931', // Darker Gold
                    dark: '#000000', // Black
                    light: '#FFFFFF', // White
                    gray: '#1F2937', // Dark Gray
                },
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
        },
        animation: {
            'pulse-slow': 'pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        },
        keyframes: {
            'pulse-slow': {
                '0%, 100%': { opacity: '1' },
                '50%': { opacity: '0.5' },
            },
        },
    },
    plugins: [],
};
export default config;
