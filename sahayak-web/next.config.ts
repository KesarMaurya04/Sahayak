import type { NextConfig } from 'next';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API}/api/:path*` }];
  },
  reactStrictMode: true,
};

export default nextConfig;