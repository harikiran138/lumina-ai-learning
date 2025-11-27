/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,

    experimental: {
        serverActions: {
            allowedOrigins: ["localhost:3000"],
        },
    },

    // Optimize images
    images: {
        domains: [],
        formats: ['image/webp', 'image/avif'],
    },

    // Environment variables to expose to the client
    env: {
        NEXT_PUBLIC_APP_NAME: 'Lumina AI Learning',
    },

    // Webpack configuration for better performance
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
            };
        }
        return config;
    },
};

export default nextConfig;
