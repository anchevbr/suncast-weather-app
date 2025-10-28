#!/bin/bash

#########################################
# Suncast - Complete Deployment Script
# For Ubuntu/Raspberry Pi
# 
# Usage: 
#   Fresh install: sudo ./deploy.sh
#   Clean & reinstall: sudo ./deploy.sh --clean
#########################################

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
APP_DIR="/var/www/suncast"
BACKEND_PORT=3001
FRONTEND_PORT=5173
GITHUB_REPO="https://github.com/anchevbr/suncast-weather-app.git"

#########################################
# CLEANUP FUNCTION
#########################################
cleanup() {
    echo -e "${YELLOW}🧹 Cleaning up existing installation...${NC}"
    
    # Stop and remove PM2 processes
    pm2 delete suncast-backend 2>/dev/null || true
    pm2 delete suncast-frontend 2>/dev/null || true
    pm2 save 2>/dev/null || true
    
    # Remove PM2 startup
    pm2 unstartup systemd -u $SUDO_USER --hp /home/$SUDO_USER 2>/dev/null || true
    
    # Remove application directory
    rm -rf $APP_DIR
    
    # Remove Nginx configuration
    rm -f /etc/nginx/sites-available/suncast
    rm -f /etc/nginx/sites-enabled/suncast
    
    # Restore default Nginx site
    ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default 2>/dev/null || true
    
    # Reload Nginx
    nginx -t && systemctl reload nginx
    
    echo -e "${GREEN}✅ Cleanup complete${NC}"
}

#########################################
# MAIN INSTALLATION
#########################################

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

# Handle --clean flag
if [ "$1" == "--clean" ]; then
    cleanup
    echo -e "${YELLOW}Press Enter to continue with fresh installation, or Ctrl+C to exit${NC}"
    read
fi

echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════╗"
echo "║                                                        ║"
echo "║         🌅  Suncast Deployment Script  🌅             ║"
echo "║                                                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Detect architecture
ARCH=$(uname -m)
echo -e "${YELLOW}🔍 Detected architecture: $ARCH${NC}"

# Install system dependencies
echo -e "${YELLOW}📦 Installing system dependencies...${NC}"
apt update
apt install -y curl git nginx

# Install Node.js
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Node.js 20 LTS...${NC}"
    if [[ "$ARCH" == "aarch64" ]] || [[ "$ARCH" == "armv7l" ]] || [[ "$ARCH" == "armv6l" ]]; then
        echo -e "${YELLOW}📱 ARM architecture detected (Raspberry Pi)${NC}"
    fi
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi

echo -e "${GREEN}✅ Node.js: $(node --version)${NC}"
echo -e "${GREEN}✅ NPM: $(npm --version)${NC}"

# Install PM2
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}📦 Installing PM2...${NC}"
    npm install -g pm2
fi

# Create app directory
echo -e "${YELLOW}📁 Setting up application directory...${NC}"
mkdir -p $APP_DIR
chown -R $SUDO_USER:$SUDO_USER $APP_DIR

# Clone or update repository
if [ -d "$APP_DIR/.git" ]; then
    echo -e "${YELLOW}🔄 Updating existing repository...${NC}"
    cd $APP_DIR
    sudo -u $SUDO_USER git pull origin main
else
    echo -e "${YELLOW}📥 Cloning repository...${NC}"
    sudo -u $SUDO_USER git clone $GITHUB_REPO $APP_DIR
    cd $APP_DIR
    chown -R $SUDO_USER:$SUDO_USER $APP_DIR
fi

# Install backend dependencies
echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
cd $APP_DIR/backend
sudo -u $SUDO_USER npm install

# Install frontend dependencies
echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
cd $APP_DIR
sudo -u $SUDO_USER npm install

# Setup backend environment
echo -e "${YELLOW}⚙️  Setting up backend environment...${NC}"
if [ ! -f "$APP_DIR/backend/.env" ]; then
    cat > $APP_DIR/backend/.env << EOF
OPENMETEO_API_KEY=ldi3ld7WP7gJiKTK
PORT=$BACKEND_PORT
NODE_ENV=production
EOF
    chown $SUDO_USER:$SUDO_USER $APP_DIR/backend/.env
    echo -e "${GREEN}✅ Backend .env created${NC}"
else
    echo -e "${GREEN}✅ Backend .env already exists${NC}"
fi

# Setup frontend environment
echo -e "${YELLOW}⚙️  Setting up frontend environment...${NC}"
if [ ! -f "$APP_DIR/.env" ]; then
    cat > $APP_DIR/.env << EOF
VITE_USE_CACHE=true
VITE_CACHE_SERVER_URL=http://localhost:$BACKEND_PORT
VITE_OPENMETEO_API_KEY=ldi3ld7WP7gJiKTK
EOF
    chown $SUDO_USER:$SUDO_USER $APP_DIR/.env
    echo -e "${GREEN}✅ Frontend .env created${NC}"
else
    echo -e "${GREEN}✅ Frontend .env already exists${NC}"
fi

# Build frontend
echo -e "${YELLOW}🏗️  Building frontend...${NC}"
cd $APP_DIR
sudo -u $SUDO_USER npm run build
chown -R $SUDO_USER:$SUDO_USER $APP_DIR

# Stop existing PM2 processes
echo -e "${YELLOW}🛑 Stopping existing processes...${NC}"
sudo -u $SUDO_USER pm2 delete suncast-backend 2>/dev/null || true
sudo -u $SUDO_USER pm2 delete suncast-frontend 2>/dev/null || true

# Start backend with PM2
echo -e "${YELLOW}🚀 Starting backend server...${NC}"
cd $APP_DIR/backend
sudo -u $SUDO_USER pm2 start server.js --name suncast-backend

# Start frontend with PM2
echo -e "${YELLOW}🚀 Starting frontend server...${NC}"
cd $APP_DIR
sudo -u $SUDO_USER pm2 start npm --name suncast-frontend -- run preview -- --host --port $FRONTEND_PORT

# Save PM2 configuration
sudo -u $SUDO_USER pm2 save

# Setup PM2 startup
echo -e "${YELLOW}⚙️  Configuring PM2 startup...${NC}"
env PATH=$PATH:/usr/bin pm2 startup systemd -u $SUDO_USER --hp /home/$SUDO_USER
sudo -u $SUDO_USER pm2 save

# Configure Nginx
echo -e "${YELLOW}🔧 Configuring Nginx...${NC}"
cat > /etc/nginx/sites-available/suncast << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    # Frontend - serve built static files
    location / {
        root /var/www/suncast/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml+rss;
}
EOF

# Enable site and remove default
ln -sf /etc/nginx/sites-available/suncast /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
echo -e "${YELLOW}🧪 Testing Nginx configuration...${NC}"
nginx -t

echo -e "${YELLOW}🔄 Reloading Nginx...${NC}"
systemctl restart nginx
systemctl enable nginx

# Setup firewall
echo -e "${YELLOW}🔥 Configuring firewall...${NC}"
if command -v ufw &> /dev/null; then
    ufw allow 'Nginx Full'
    ufw allow OpenSSH
    ufw --force enable
fi

# Get IP address
SERVER_IP=$(hostname -I | awk '{print $1}')

# Final status
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                        ║${NC}"
echo -e "${GREEN}║  ✅  Suncast Deployed Successfully!  🌅               ║${NC}"
echo -e "${GREEN}║                                                        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}📍 Application Info:${NC}"
echo -e "   Architecture:     $ARCH"
echo -e "   App Directory:    $APP_DIR"
echo -e "   App URL:          ${GREEN}http://$SERVER_IP${NC}"
echo -e "   Backend Port:     $BACKEND_PORT"
echo -e "   Frontend Port:    $FRONTEND_PORT"
echo ""
echo -e "${YELLOW}🔧 Useful Commands:${NC}"
echo -e "   View logs:        pm2 logs"
echo -e "   Check status:     pm2 status"
echo -e "   Restart:          pm2 restart all"
echo -e "   Update app:       cd $APP_DIR && git pull && npm install && npm run build && pm2 restart all"
echo ""
echo -e "${YELLOW}🔄 To reinstall from scratch:${NC}"
echo -e "   sudo ./deploy.sh --clean"
echo ""

# Display PM2 status
sudo -u $SUDO_USER pm2 status

if [[ "$ARCH" == "aarch64" ]] || [[ "$ARCH" == "armv7l" ]] || [[ "$ARCH" == "armv6l" ]]; then
    echo ""
    echo -e "${YELLOW}🍓 Raspberry Pi Tips:${NC}"
    echo -e "   • Cache is enabled to reduce API calls"
    echo -e "   • PM2 auto-starts on boot"
    echo -e "   • Nginx serves static files efficiently"
    echo ""
fi

echo -e "${GREEN}🎉 Visit http://$SERVER_IP to see your Suncast app!${NC}"
