#!/bin/bash

#########################################
# Quick Update Script (run on server)
# Updates app from GitHub
#########################################

set -e

APP_DIR="/var/www/suncast"

echo "🔄 Updating Suncast from GitHub..."

cd $APP_DIR

# Stash any local changes
git stash

# Pull latest changes
git pull origin main

# Update backend dependencies and restart
echo "📦 Updating backend..."
cd backend
npm install
pm2 restart suncast-backend

# Update frontend, rebuild, and restart
echo "📦 Updating frontend..."
cd ..
npm install
npm run build
pm2 restart suncast-frontend

# Reload nginx
sudo systemctl reload nginx

echo ""
echo "✅ Update complete!"
echo ""
pm2 status
