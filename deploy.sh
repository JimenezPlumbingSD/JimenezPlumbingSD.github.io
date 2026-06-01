#!/bin/bash
# JPS Website Deployment Script
# This script deploys the website to GitHub Pages

set -e  # Exit on any error

echo "🚀 Starting JPS Website Deployment..."

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"

# Make sure we're on main branch
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "⚠️  Switching to main branch..."
  git checkout main
fi

# Check for uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
  echo "📦 Committing changes..."
  git add .
  git commit -m "feat: deploy website updates $(date)"
else
  echo "✅ No changes to commit"
fi

# Push to GitHub Pages
echo "📤 Pushing to GitHub Pages..."
git push origin main

echo "✅ Deployment complete!"
echo "🌍 Website should be live at https://jps33sd.com in a few minutes"