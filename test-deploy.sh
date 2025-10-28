#!/bin/bash

#########################################
# Test Deployment Script (macOS/Local)
# Simulates deployment without system changes
#########################################

set -e

echo "🧪 Testing deployment script (dry-run mode)..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Get absolute path
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Test configuration
APP_DIR="$SCRIPT_DIR/test-deploy"
BACKEND_PORT=3001
FRONTEND_PORT=5173
DOMAIN="test.local"

echo -e "${YELLOW}📦 Checking dependencies...${NC}"

# Check Node.js
if command -v node &> /dev/null; then
    echo -e "${GREEN}✅ Node.js: $(node --version)${NC}"
else
    echo -e "${RED}❌ Node.js not found${NC}"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    echo -e "${GREEN}✅ NPM: $(npm --version)${NC}"
else
    echo -e "${RED}❌ NPM not found${NC}"
    exit 1
fi

# Check git
if command -v git &> /dev/null; then
    echo -e "${GREEN}✅ Git: $(git --version)${NC}"
else
    echo -e "${RED}❌ Git not found${NC}"
    exit 1
fi

# Create test directory
echo -e "${YELLOW}📁 Creating test directory...${NC}"
rm -rf $APP_DIR
mkdir -p $APP_DIR

# Simulate clone (copy current directory)
echo -e "${YELLOW}📥 Simulating repository clone...${NC}"
rsync -a --exclude='node_modules' --exclude='dist' --exclude='test-deploy' --exclude='.git' "$SCRIPT_DIR/" "$APP_DIR/"
echo -e "${GREEN}✅ Repository copied to $APP_DIR${NC}"

# Test backend setup
echo -e "${YELLOW}📦 Testing backend setup...${NC}"

# Check if package.json exists
if [ ! -f "$APP_DIR/backend/package.json" ]; then
    echo -e "${RED}❌ backend/package.json not found${NC}"
    exit 1
fi
echo -e "${GREEN}✅ backend/package.json found${NC}"

# Test .env creation
echo -e "${YELLOW}⚙️  Testing backend .env creation...${NC}"
cat > "$APP_DIR/backend/.env" << EOF
OPENMETEO_API_KEY=ldi3ld7WP7gJiKTK
PORT=3001
NODE_ENV=production
EOF
echo -e "${GREEN}✅ Backend .env created${NC}"
cat "$APP_DIR/backend/.env"

# Test frontend setup
echo -e "${YELLOW}📦 Testing frontend setup...${NC}"

# Check if package.json exists
if [ ! -f "$APP_DIR/package.json" ]; then
    echo -e "${RED}❌ package.json not found${NC}"
    exit 1
fi
echo -e "${GREEN}✅ package.json found${NC}"

# Test frontend .env creation
echo -e "${YELLOW}⚙️  Testing frontend .env creation...${NC}"
cat > "$APP_DIR/.env" << EOF
VITE_USE_CACHE=true
VITE_CACHE_SERVER_URL=http://localhost:3001
VITE_OPENMETEO_API_KEY=ldi3ld7WP7gJiKTK
EOF
echo -e "${GREEN}✅ Frontend .env created${NC}"
cat "$APP_DIR/.env"

# Test npm install (optional, can be slow)
read -p "Run npm install in test directory? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
    cd $APP_DIR/backend
    npm install
    echo -e "${GREEN}✅ Backend dependencies installed${NC}"
    
    echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
    cd $APP_DIR
    npm install
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
    
    # Test build
    echo -e "${YELLOW}🏗️  Testing frontend build...${NC}"
    npm run build
    echo -e "${GREEN}✅ Frontend built successfully${NC}"
    
    # Check dist directory
    if [ -d "dist" ]; then
        echo -e "${GREEN}✅ dist/ directory created${NC}"
        ls -lh dist/
    fi
    
    # Go back to original directory
    cd ..
fi

# Test update script creation
echo -e "${YELLOW}📝 Testing update script creation...${NC}"
cat > "$APP_DIR/update.sh" << 'UPDATEEOF'
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

chmod +x "$APP_DIR/update.sh"
echo -e "${GREEN}✅ update.sh created${NC}"

# Test Nginx config generation
echo -e "${YELLOW}🔧 Testing Nginx config generation...${NC}"
cat > "$APP_DIR/nginx-test.conf" << EOF
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
echo -e "${GREEN}✅ Nginx config created${NC}"
cat "$APP_DIR/nginx-test.conf"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                        ║${NC}"
echo -e "${GREEN}║  ✅  Deployment Script Test PASSED!                    ║${NC}"
echo -e "${GREEN}║                                                        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}📍 Test Results:${NC}"
echo -e "   ✅ All dependencies available"
echo -e "   ✅ Repository structure valid"
echo -e "   ✅ Environment files generated correctly"
echo -e "   ✅ Update script created"
echo -e "   ✅ Nginx config generated"
echo ""
echo -e "${YELLOW}📁 Test files location:${NC}"
echo -e "   $APP_DIR/"
echo ""
echo -e "${YELLOW}🧹 Cleanup:${NC}"
echo -e "   To remove test files: rm -rf $APP_DIR"
echo ""
