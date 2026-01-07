// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'localhost:3001'],
    },
    workerThreads: false,
    cpus: 1,
  },

  serverExternalPackages: ['fluent-ffmpeg'],
  output: 'standalone',
  outputFileTracingRoot: __dirname,

  async rewrites() {
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/auth/:path*',
          destination:
            'https://voiceai.wordpressstagingsite.com/api/auth/:path*',
        },
      ]
    }
    return []
  },
}

export default nextConfig
