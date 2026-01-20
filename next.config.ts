// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  output: 'standalone',

  serverExternalPackages: ['fluent-ffmpeg'],
}

export default nextConfig
