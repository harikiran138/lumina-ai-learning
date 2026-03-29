import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // outputFileTracingRoot is only needed in local monorepo dev — Vercel handles it automatically
  ...(process.env.VERCEL ? {} : { outputFileTracingRoot: path.resolve("../..") }),
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/auth/:path*',
        destination: 'http://127.0.0.1:4000/api/auth/:path*',
      },
      // Note: other /api requests hit FastAPI which is typically configured via cross-origin in lib/api.ts
    ];
  },
};

export default nextConfig;
