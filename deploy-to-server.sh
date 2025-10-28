#!/bin/bash

#########################################
# Deploy to Server (run from your Mac)
# Commits, pushes, and updates server
#########################################

# Configuration - EDIT THESE
SERVER_USER="your-username"
SERVER_IP="your-server-ip"
SERVER_PATH="/var/www/suncast"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}📦 Deploying Suncast to server...${NC}"

# Check if there are changes to commit
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}📝 Committing changes...${NC}"
    
    # Ask for commit message
    read -p "Commit message: " commit_msg
    
    if [ -z "$commit_msg" ]; then
        commit_msg="Update app"
    fi
    
    git add .
    git commit -m "$commit_msg"
else
    echo -e "${GREEN}✅ No local changes to commit${NC}"
fi

# Push to GitHub
echo -e "${YELLOW}⬆️  Pushing to GitHub...${NC}"
git push origin main

# Update server
echo -e "${YELLOW}🚀 Updating server...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} "cd ${SERVER_PATH} && ./update.sh"

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "   Visit your site to see the changes"
