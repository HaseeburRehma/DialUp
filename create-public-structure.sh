#!/bin/bash
# create-public-structure.sh
# Run this script to create the missing public directory structure

echo "Creating public directory structure..."

# Create public directory
mkdir -p public

# Add a basic favicon if none exists
if [ ! -f "public/favicon.ico" ]; then
    echo "Creating placeholder favicon..."
    # Create a simple 1x1 pixel ICO file (base64 encoded)
    echo -n "AAABAAEAEBAAAAAAAABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A" | base64 -d > public/favicon.ico
fi

# Add robots.txt if none exists
if [ ! -f "public/robots.txt" ]; then
    echo "Creating robots.txt..."
    cat > public/robots.txt << EOF
User-agent: *
Allow: /

Sitemap: https://yourdomain.com/sitemap.xml
EOF
fi

# Add a basic manifest.json
if [ ! -f "public/manifest.json" ]; then
    echo "Creating manifest.json..."
    cat > public/manifest.json << EOF
{
  "name": "Voice to Text AI",
  "short_name": "VoiceAI",
  "description": "Voice to Text AI Application",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "/favicon.ico",
      "sizes": "16x16",
      "type": "image/x-icon"
    }
  ]
}
EOF
fi

echo "Public directory structure created successfully!"
echo "Contents:"
ls -la public/