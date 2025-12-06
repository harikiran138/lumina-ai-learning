/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // output: 'export', // Disabled to allow API routes for MongoDB
    distDir: 'dist', // Align with Vercel project settings expecting 'dist'
    trailingSlash: true,
    images: {
        unoptimized: true,
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'placehold.co',
            },
        ],
    },
};

export default nextConfig;
