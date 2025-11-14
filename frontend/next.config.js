/**
 * Minimal Next.js config to enable useful rewrites for local development
 * and keep default behaviour for Vercel production deployments.
 */
module.exports = {
  reactStrictMode: true,
  async rewrites() {
    // In development, proxy /api/* to the API server so the frontend can call /api/* directly
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:3001/api/:path*'
        }
      ];
    }
    return [];
  }
};
