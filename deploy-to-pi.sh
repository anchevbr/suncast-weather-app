#!/bin/bash

#########################################
# Deploy to Raspberry Pi
# Run from your Mac
#########################################

SERVER_USER="boris"
SERVER_IP="10.19.2.132"
SERVER_PATH="/var/www/suncast"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🍓 Deploying to Raspberry Pi...${NC}"

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

# Update Raspberry Pi
echo -e "${YELLOW}🚀 Updating Raspberry Pi server...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} "cd ${SERVER_PATH} && ./update.sh"

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "   Visit http://${SERVER_IP} to see your app"
