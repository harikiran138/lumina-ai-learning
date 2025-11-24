#!/bin/bash

# Simple build: Bundle only the entry points, copy the rest
echo "Building entry points with Parcel..."
npx parcel build src/index.html src/login.html --public-url ./

# Copy all dashboard and page HTML files directly  
echo "Copying dashboard pages..."
mkdir -p dist/admin dist/student dist/teacher

# Copy all admin pages
cp -r src/admin/*.html dist/admin/ 2>/dev/null || true

# Copy all student pages  
cp -r src/student/*.html dist/student/ 2>/dev/null || true

# Copy all teacher pages
cp -r src/teacher/*.html dist/teacher/ 2>/dev/null || true

# Copy JavaScript files that are imported
echo "Copying JS, CSS, and assets..."
mkdir -p dist/js dist/css
cp -r src/js/*.js dist/js/ 2>/dev/null || true
cp -r src/css/*.css dist/css/ 2>/dev/null || true

echo "Build complete!"
