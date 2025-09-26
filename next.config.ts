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

    
  },
  serverExternalPackages: ['fluent-ffmpeg'],
  output: 'standalone',

  async rewrites() {
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/auth/:path*',
          destination: 'https://voiceai.wordpressstagingsite.com/api/auth/:path*'
        }
      ]
    }
    return []
  },
}

export default nextConfig
