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
    },
    plugins: [],
};
export default config;
