#!/bin/bash
# Lumina Safe Maintenance Script
echo "🧹 Starting safe project cleanup..."
rm -rf node_modules
rm -rf backend/.venv
rm -rf frontend/.next
rm -rf **/dist
rm -rf **/build
rm -rf **/__pycache__
rm -rf **/.pytest_cache
find . -name "*.log" -delete
echo "✅ Cleanup complete."
