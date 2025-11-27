#!/bin/bash

# Lumina Color Customization Tool
# Easily change the theme colors

echo "🎨 Lumina Color Customization Tool"
echo "==================================="
echo ""

# Current theme
echo "Current Theme: Golden Yellow & Black"
echo ""

# Show color presets
echo "Available Color Presets:"
echo ""
echo "1. 🟡 Golden Yellow & Black (Current)"
echo "   Primary: #FFD700, Dark: #000000"
echo ""
echo "2. 💙 Royal Blue & Navy"
echo "   Primary: #4169E1, Dark: #0A1929"
echo ""
echo "3. 💜 Purple & Dark Gray"
echo "   Primary: #9D4EDD, Dark: #1a1a1a"
echo ""
echo "4. ❤️  Ruby Red & Black"
echo "   Primary: #DC143C, Dark: #000000"
echo ""
echo "5. 💚 Emerald Green & Black"
echo "   Primary: #50C878, Dark: #000000"
echo ""
echo "6. 🧡 Sunset Orange & Navy"
echo "   Primary: #FF6B35, Dark: #16213E"
echo ""
echo "7. 🩵 Cyan & Dark Blue"
echo "   Primary: #00D9FF, Dark: #0D1B2A"
echo ""
echo "8. ✨ Custom Colors"
echo ""

read -p "Select a preset (1-8): " preset

case $preset in
  1)
    PRIMARY="#FFD700"
    SECONDARY="#FDB931"
    ACCENT="#FAFAD2"
    DARK="#000000"
    DARK_LIGHT="#1a1a1a"
    THEME_NAME="Golden Yellow & Black"
    ;;
  2)
    PRIMARY="#4169E1"
    SECONDARY="#1E90FF"
    ACCENT="#87CEEB"
    DARK="#0A1929"
    DARK_LIGHT="#1a2332"
    THEME_NAME="Royal Blue & Navy"
    ;;
  3)
    PRIMARY="#9D4EDD"
    SECONDARY="#C77DFF"
    ACCENT="#E0AAFF"
    DARK="#1a1a1a"
    DARK_LIGHT="#2a2a2a"
    THEME_NAME="Purple & Dark Gray"
    ;;
  4)
    PRIMARY="#DC143C"
    SECONDARY="#FF1744"
    ACCENT="#FF6B9D"
    DARK="#000000"
    DARK_LIGHT="#1a0000"
    THEME_NAME="Ruby Red & Black"
    ;;
  5)
    PRIMARY="#50C878"
    SECONDARY="#2ECC71"
    ACCENT="#A8E6CF"
    DARK="#000000"
    DARK_LIGHT="#001a00"
    THEME_NAME="Emerald Green & Black"
    ;;
  6)
    PRIMARY="#FF6B35"
    SECONDARY="#F77F00"
    ACCENT="#FCBF49"
    DARK="#16213E"
    DARK_LIGHT="#0F1B2F"
    THEME_NAME="Sunset Orange & Navy"
    ;;
  7)
    PRIMARY="#00D9FF"
    SECONDARY="#00B4D8"
    ACCENT="#90E0EF"
    DARK="#0D1B2A"
    DARK_LIGHT="#1B263B"
    THEME_NAME="Cyan & Dark Blue"
    ;;
  8)
    echo ""
    echo "Enter custom colors (hex format, e.g., #FF6B35):"
    read -p "Primary color: " PRIMARY
    read -p "Secondary color: " SECONDARY
    read -p "Accent color: " ACCENT
    read -p "Dark background: " DARK
    read -p "Dark light background: " DARK_LIGHT
    THEME_NAME="Custom Theme"
    ;;
  *)
    echo "Invalid selection"
    exit 1
    ;;
esac

echo ""
echo "🎨 Applying theme: $THEME_NAME"
echo "================================"

# Update tailwind.config.ts
cat > tailwind.config.ts << EOF
import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                // Lumina Brand Colors - $THEME_NAME
                lumina: {
                    primary: '$PRIMARY',
                    'primary-dark': '$PRIMARY',
                    'primary-light': '$PRIMARY',
                    secondary: '$SECONDARY',
                    accent: '$ACCENT',
                    dark: '$DARK',
                    'dark-light': '$DARK_LIGHT',
                    'dark-gray': '#2a2a2a',
                    glass: 'rgba(${PRIMARY:1}, 0.1)',
                },
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
            },
            borderRadius: {
                xs: '2px',
            },
            boxShadow: {
                'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
                'glow': '0 0 30px rgba(${PRIMARY:1:6}, 0.6)',
                'gold-glow': '0 0 40px rgba(${PRIMARY:1:6}, 0.8)',
            },
            animation: {
                'float': 'float 6s ease-in-out infinite',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'shimmer': 'shimmer 2s linear infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '0% 0%' },
                    '100%': { backgroundPosition: '200% 0%' },
                },
            },
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
        require('@tailwindcss/typography'),
    ],
};

export default config;
EOF

echo "✓ Updated tailwind.config.ts"

# Update page description
sed -i '' "s/Now with Premium .* Theme/Now with Premium $THEME_NAME ✨/" src/app/page.tsx 2>/dev/null || true

echo "✓ Updated page description"
echo ""
echo "✅ Theme applied successfully!"
echo ""
echo "To see the changes:"
echo "  1. Rebuild: npm run build (or docker-compose restart app)"
echo "  2. Refresh browser: http://localhost:1234"
echo ""
echo "Your new theme colors:"
echo "  Primary: $PRIMARY"
echo "  Secondary: $SECONDARY"
echo "  Accent: $ACCENT"
echo "  Dark: $DARK"
echo ""
