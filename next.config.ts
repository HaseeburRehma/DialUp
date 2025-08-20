import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        'localhost:3001',
        'your-site.netlify.app'
      ],
    },
    serverComponentsExternalPackages: ['fluent-ffmpeg'],

  },
  output: 'standalone',

  async rewrites() {
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/auth/:path*',
          destination: 'https://voiceai-production-01d6.up.railway.app/api/auth/:path*'
        }
      ]
    }
    return []
  },
}

export default nextConfig
