#!/bin/bash

# Script to push Medidoc AI to GitHub
# Make sure you've created the repository on GitHub first!

set -e

echo "🚀 Pushing Medidoc AI to GitHub"
echo "================================"
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "Initializing git repository..."
    git init
    echo "✅ Git initialized"
else
    echo "✅ Git already initialized"
fi

echo ""

# Add all files
echo "Adding files to git..."
git add .
echo "✅ Files added"

echo ""

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "⚠️  No changes to commit"
else
    # Create commit
    echo "Creating commit..."
    git commit -m "Initial commit: Medidoc AI - Medical Documentation Assistant

- Next.js 14 with TypeScript
- PostgreSQL database with Prisma ORM
- Docker setup for easy development
- Comprehensive coding standards
- One-command setup script"
    echo "✅ Commit created"
fi

echo ""

# Check if remote exists
if git remote | grep -q "^origin$"; then
    echo "⚠️  Remote 'origin' already exists"
    echo "   Current remote: $(git remote get-url origin)"
    read -p "   Do you want to update it? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "   Enter your repository URL: " REPO_URL
        git remote set-url origin "$REPO_URL"
        echo "✅ Remote updated"
    fi
else
    echo "Please enter your GitHub repository URL:"
    echo "   Example: https://github.com/karthikrkmed0180-glitch/medidoc-ai.git"
    read -p "   Repository URL: " REPO_URL
    
    if [ -z "$REPO_URL" ]; then
        echo "❌ Repository URL is required"
        exit 1
    fi
    
    git remote add origin "$REPO_URL"
    echo "✅ Remote added"
fi

echo ""

# Rename branch to main
echo "Setting branch to main..."
git branch -M main 2>/dev/null || echo "✅ Already on main branch"

echo ""

# Push to GitHub
echo "Pushing to GitHub..."
echo "   (You may be asked for GitHub credentials)"
echo ""
git push -u origin main

echo ""
echo "================================"
echo "✅ Successfully pushed to GitHub!"
echo ""
echo "Your repository is now live at:"
git remote get-url origin | sed 's/\.git$//' | sed 's/^git@github.com:/https:\/\/github.com\//'
echo ""
