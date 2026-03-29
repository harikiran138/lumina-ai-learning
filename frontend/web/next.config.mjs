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
};

export default nextConfig;
