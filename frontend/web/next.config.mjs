/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,

    compress: true,
    poweredByHeader: false,
    // output: 'export', // Disabled for MongoDB dynamic rendering
    // distDir: 'dist', 
    trailingSlash: true,
    images: {
        unoptimized: true,
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'placehold.co',
            },
            {
                protocol: 'https',
                hostname: 'ui-avatars.com',
            },
        ],
    },
};

export default nextConfig;
