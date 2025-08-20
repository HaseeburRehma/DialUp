#!/bin/bash
# build.sh - Optimized build script

set -e  # Exit on error

echo "🧹 Cleaning previous build artifacts..."
rm -rf .next .output dist node_modules/.cache

echo "📦 Installing dependencies (production only)..."
npm ci --only=production --prefer-offline

echo "🏗️  Building for production..."
NODE_ENV=production npm run build

# Clean up dev dependencies and caches to reduce image size
echo "🗑️  Cleaning up build artifacts..."
npm prune --production
npm cache clean --force

echo "✅ Build completed successfully!"