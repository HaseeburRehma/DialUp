#!/bin/bash
# build.sh - Clean build script

echo "Cleaning previous build..."
rm -rf .nuxt
rm -rf .output
rm -rf dist

echo "Installing dependencies..."
pnpm install --frozen-lockfile

echo "Building for production..."
NODE_ENV=production pnpm build

echo "Build completed successfully!"