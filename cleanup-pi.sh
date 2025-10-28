#!/bin/bash

#########################################
# Cleanup Script for Raspberry Pi
# Removes all Suncast installation
#########################################

echo "🧹 Cleaning up Suncast deployment..."

# Stop and remove PM2 processes
pm2 delete suncast-backend 2>/dev/null || true
pm2 delete suncast-frontend 2>/dev/null || true
pm2 save

# Remove PM2 startup
sudo pm2 unstartup systemd -u boris --hp /home/boris 2>/dev/null || true

# Remove application directory
sudo rm -rf /var/www/suncast

# Remove Nginx configuration
sudo rm -f /etc/nginx/sites-available/suncast
sudo rm -f /etc/nginx/sites-enabled/suncast

# Restore default Nginx site (optional)
sudo ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default 2>/dev/null || true

# Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx

echo "✅ Cleanup complete!"
echo "   - PM2 processes removed"
echo "   - /var/www/suncast deleted"
echo "   - Nginx config removed"
echo ""
echo "You can now run deploy.sh again for a fresh installation"
