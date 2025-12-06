#!/bin/bash

# Lumina AI Learning - Firebase Deployment Script
# This script helps deploy the application to Firebase Hosting

set -e  # Exit on error

echo "🚀 Lumina AI Learning - Firebase Deployment"
echo "============================================"
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed."
    echo "Installing Firebase CLI..."
    npm install -g firebase-tools
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local not found!"
    echo "Please create .env.local from .env.firebase.template"
    echo ""
    echo "Run: cp .env.firebase.template .env.local"
    echo "Then edit .env.local with your Firebase credentials"
    exit 1
fi

# Check if Firebase is initialized
if [ ! -f "firebase.json" ]; then
    echo "⚠️  Firebase not initialized!"
    echo "Running: firebase init"
    firebase init
fi

echo ""
echo "📦 Building production bundle..."
npm run build

echo ""
echo "🌐 Deploying to Firebase Hosting..."
firebase deploy --only hosting

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🎉 Your app should now be live at your Firebase Hosting URL"
echo "Check the Firebase Console for the URL: https://console.firebase.google.com/"
