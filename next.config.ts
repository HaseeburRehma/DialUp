// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  experimental: {
    serverActions: {
      // add your deployed domains here too
      allowedOrigins: ['localhost:3000', 'localhost:3001', 'your-site.netlify.app'],
    },
  },
  async rewrites() {
    if (process.env.NODE_ENV === 'development') {
      return [
        { source: '/api/server/:path*', destination: 'http://localhost:8000/api/:path*' },
      ]
    }
    return []
  },
}

export default nextConfig
