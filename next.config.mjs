/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // Note: Static export disabled because Firebase Hosting doesn't support Next.js Server Actions
    // Deploy to Vercel instead for full Next.js support
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
