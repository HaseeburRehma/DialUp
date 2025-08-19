#!/bin/bash
# build.sh - Clean build script

echo "Cleaning previous build..."
rm -rf .nuxt .output dist

echo "Installing dependencies..."
npm ci --omit=dev

echo "Building for production..."
NODE_ENV=production npm run build

echo "Build completed successfully!"
