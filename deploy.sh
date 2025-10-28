#!/bin/bash

#########################################
# Suncast Weather App - Deployment Script
# For Ubuntu Server
#########################################

set -e  # Exit on error

echo "🚀 Starting Suncast deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/var/www/suncast"
BACKEND_PORT=3001
FRONTEND_PORT=5173
DOMAIN=${1:-"your-domain.com"}  # Pass domain as argument or use default

echo -e "${YELLOW}📦 Installing system dependencies...${NC}"
sudo apt update
sudo apt install -y curl git nginx

# Detect architecture
ARCH=$(uname -m)
echo -e "${YELLOW}🔍 Detected architecture: $ARCH${NC}"

# Install Node.js (if not installed)
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Node.js...${NC}"
    
    if [[ "$ARCH" == "aarch64" ]] || [[ "$ARCH" == "armv7l" ]] || [[ "$ARCH" == "armv6l" ]]; then
        # Raspberry Pi - use NodeSource for ARM
        echo -e "${YELLOW}📱 Detected ARM/Raspberry Pi - installing Node.js 20 LTS...${NC}"
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt install -y nodejs
    else
        # x86_64 - standard installation
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt install -y nodejs
    fi
fi

echo -e "${GREEN}✅ Node.js version: $(node --version)${NC}"
echo -e "${GREEN}✅ NPM version: $(npm --version)${NC}"

# Install PM2 for process management
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}📦 Installing PM2...${NC}"
    sudo npm install -g pm2
fi

# Create app directory
echo -e "${YELLOW}📁 Setting up application directory...${NC}"
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR

# Clone or update repository
if [ -d "$APP_DIR/.git" ]; then
    echo -e "${YELLOW}🔄 Updating existing repository...${NC}"
    cd $APP_DIR
    git pull origin main
else
    echo -e "${YELLOW}📥 Cloning repository...${NC}"
    git clone https://github.com/anchevbr/suncast-weather-app.git $APP_DIR
    cd $APP_DIR
    # Ensure correct ownership after clone
    sudo chown -R $USER:$USER $APP_DIR
fi

# Install backend dependencies
echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
cd $APP_DIR/backend
npm install

# Install frontend dependencies
echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
cd $APP_DIR
npm install

# Setup environment variables for backend
echo -e "${YELLOW}⚙️  Setting up backend environment...${NC}"
if [ ! -f "$APP_DIR/backend/.env" ]; then
    cat > $APP_DIR/backend/.env << EOF
OPENMETEO_API_KEY=ldi3ld7WP7gJiKTK
PORT=3001
NODE_ENV=production
EOF
    echo -e "${GREEN}✅ Backend .env created${NC}"
else
    echo -e "${GREEN}✅ Backend .env already exists${NC}"
fi

# Setup environment variables for frontend
echo -e "${YELLOW}⚙️  Setting up frontend environment...${NC}"
if [ ! -f "$APP_DIR/.env" ]; then
    cat > $APP_DIR/.env << EOF
VITE_USE_CACHE=true
VITE_CACHE_SERVER_URL=http://localhost:3001
VITE_OPENMETEO_API_KEY=ldi3ld7WP7gJiKTK
EOF
    echo -e "${GREEN}✅ Frontend .env created${NC}"
else
    echo -e "${GREEN}✅ Frontend .env already exists${NC}"
fi

# Build frontend
echo -e "${YELLOW}🏗️  Building frontend...${NC}"
cd $APP_DIR
npm run build

# Ensure ownership is correct after build
sudo chown -R $USER:$USER $APP_DIR

# Stop existing PM2 processes
echo -e "${YELLOW}🛑 Stopping existing processes...${NC}"
pm2 delete suncast-backend 2>/dev/null || true
pm2 delete suncast-frontend 2>/dev/null || true

# Start backend with PM2
echo -e "${YELLOW}🚀 Starting backend server...${NC}"
cd $APP_DIR/backend
pm2 start server.js --name suncast-backend

# Start frontend with PM2 (for development/preview)
# For production, nginx will serve the built files
echo -e "${YELLOW}🚀 Starting frontend (preview mode)...${NC}"
cd $APP_DIR
pm2 start npm --name suncast-frontend -- run preview -- --host --port $FRONTEND_PORT

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
echo -e "${YELLOW}⚙️  Configuring PM2 startup...${NC}"
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME
pm2 save

# Configure Nginx
echo -e "${YELLOW}🔧 Configuring Nginx...${NC}"
sudo tee /etc/nginx/sites-available/suncast > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN;

    # Frontend - serve built static files
    location / {
        root $APP_DIR/dist;
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml+rss;
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/suncast /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
echo -e "${YELLOW}🧪 Testing Nginx configuration...${NC}"
sudo nginx -t

# Restart nginx
echo -e "${YELLOW}🔄 Restarting Nginx...${NC}"
sudo systemctl restart nginx
sudo systemctl enable nginx

# Setup firewall
echo -e "${YELLOW}🔥 Configuring firewall...${NC}"
if command -v ufw &> /dev/null; then
    sudo ufw allow 'Nginx Full'
    sudo ufw allow OpenSSH
    sudo ufw --force enable
fi

# Create update script
echo -e "${YELLOW}📝 Creating update script...${NC}"
cat > $APP_DIR/update.sh << 'UPDATEEOF'
#!/bin/bash
set -e

echo "🔄 Updating Suncast app..."

cd /var/www/suncast

# Pull latest changes
git pull origin main

# Update backend
cd backend
npm install
pm2 restart suncast-backend

# Update frontend
cd ..
npm install
npm run build
pm2 restart suncast-frontend

# Reload nginx
sudo systemctl reload nginx

echo "✅ Update complete!"
pm2 status
UPDATEEOF

chmod +x $APP_DIR/update.sh

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                        ║${NC}"
echo -e "${GREEN}║  ✅  Suncast Weather App Deployed Successfully!        ║${NC}"
echo -e "${GREEN}║                                                        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}📍 Application Details:${NC}"
echo -e "   Architecture:     $ARCH"
echo -e "   App Directory:    $APP_DIR"
echo -e "   Frontend URL:     http://$DOMAIN"
echo -e "   Backend Port:     $BACKEND_PORT"
echo -e "   Nginx Config:     /etc/nginx/sites-available/suncast"
echo ""
echo -e "${YELLOW}🔧 Useful Commands:${NC}"
echo -e "   View logs:        pm2 logs"
echo -e "   Check status:     pm2 status"
echo -e "   Restart backend:  pm2 restart suncast-backend"
echo -e "   Restart frontend: pm2 restart suncast-frontend"
echo -e "   Update app:       $APP_DIR/update.sh"
echo ""
echo -e "${YELLOW}📚 Next Steps:${NC}"
echo -e "   1. Configure your domain DNS to point to this server"
echo -e "   2. (Optional) Setup SSL with: sudo certbot --nginx -d $DOMAIN"
echo -e "   3. Visit http://$DOMAIN to see your app"
echo ""
echo -e "${YELLOW}🔄 To update the app from your PC:${NC}"
echo -e "   1. Make changes locally and commit"
echo -e "   2. Push to GitHub: git push origin main"
echo -e "   3. On server, run: $APP_DIR/update.sh"
echo -e "   Or use the auto-deploy webhook (see documentation)"
echo ""

# Raspberry Pi specific notes
if [[ "$ARCH" == "aarch64" ]] || [[ "$ARCH" == "armv7l" ]] || [[ "$ARCH" == "armv6l" ]]; then
    echo -e "${YELLOW}🍓 Raspberry Pi Tips:${NC}"
    echo -e "   • First build may take 5-10 minutes (ARM is slower)"
    echo -e "   • Cache helps reduce API calls and improve performance"
    echo -e "   • Consider increasing swap if build fails: sudo dphys-swapfile swapoff"
    echo -e "                                              sudo nano /etc/dphys-swapfile"
    echo -e "                                              (set CONF_SWAPSIZE=2048)"
    echo -e "                                              sudo dphys-swapfile setup"
    echo -e "                                              sudo dphys-swapfile swapon"
    echo ""
fi
