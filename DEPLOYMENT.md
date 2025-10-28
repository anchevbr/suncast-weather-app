# Suncast Weather App - Deployment Guide

## 🚀 Initial Deployment on Ubuntu Server

### 1. Upload deployment script to your server
```bash
# From your PC (Mac)
scp deploy.sh user@your-server-ip:/tmp/
```

### 2. Run the deployment script on the server
```bash
# SSH into your Ubuntu server
ssh user@your-server-ip

# Make script executable and run it
chmod +x /tmp/deploy.sh
sudo /tmp/deploy.sh your-domain.com
```

The script will:
- ✅ Install Node.js, Nginx, PM2
- ✅ Clone the repository from GitHub
- ✅ Install all dependencies
- ✅ Build the frontend
- ✅ Start backend and frontend with PM2
- ✅ Configure Nginx as reverse proxy
- ✅ Setup automatic startup on server reboot

---

## 🔄 How to Update the App from Your PC

There are **3 ways** to update your deployed app:

### Method 1: Manual Update (Simple)
```bash
# On your PC (Mac):
# 1. Make your changes
# 2. Commit and push to GitHub
git add .
git commit -m "Your changes"
git push origin main

# 3. SSH into your server and run update script
ssh user@your-server-ip
/var/www/suncast/update.sh
```

### Method 2: One-Command Update via SSH (Faster)
```bash
# From your PC, after pushing to GitHub:
ssh user@your-server-ip "/var/www/suncast/update.sh"
```

### Method 3: Automatic Deployment with GitHub Webhook (Best!)

Set up automatic deployment so the server updates itself when you push to GitHub:

#### A. On your server, create webhook listener:
```bash
# SSH into server
ssh user@your-server-ip

# Create webhook handler
sudo npm install -g github-webhook-handler pm2

# Create webhook service
sudo nano /var/www/suncast/webhook.js
```

Paste this code:
```javascript
const http = require('http');
const createHandler = require('github-webhook-handler');
const { exec } = require('child_process');

const handler = createHandler({ path: '/webhook', secret: 'your-secret-key' });

http.createServer((req, res) => {
  handler(req, res, () => {
    res.statusCode = 404;
    res.end('no such location');
  });
}).listen(7777);

handler.on('error', (err) => {
  console.error('Error:', err.message);
});

handler.on('push', (event) => {
  console.log('Received push event for %s to %s',
    event.payload.repository.name,
    event.payload.ref);
  
  if (event.payload.ref === 'refs/heads/main') {
    console.log('Updating app...');
    exec('cd /var/www/suncast && ./update.sh', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error}`);
        return;
      }
      console.log(`Output: ${stdout}`);
      if (stderr) console.error(`Stderr: ${stderr}`);
    });
  }
});

console.log('Webhook server running on port 7777');
```

#### B. Start webhook with PM2:
```bash
pm2 start /var/www/suncast/webhook.js --name suncast-webhook
pm2 save
```

#### C. Configure Nginx for webhook:
```bash
sudo nano /etc/nginx/sites-available/suncast
```

Add this location block:
```nginx
    # Webhook endpoint
    location /webhook {
        proxy_pass http://localhost:7777;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
```

Restart Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

#### D. Setup GitHub webhook:
1. Go to your GitHub repo: https://github.com/anchevbr/suncast-weather-app
2. Click **Settings** → **Webhooks** → **Add webhook**
3. Configure:
   - **Payload URL**: `http://your-domain.com/webhook`
   - **Content type**: `application/json`
   - **Secret**: `your-secret-key` (same as in webhook.js)
   - **Events**: Just the push event
4. Click **Add webhook**

Now every time you push to GitHub, your server will automatically update! 🎉

---

## 🛠️ Useful Server Commands

```bash
# View application logs
pm2 logs

# Check application status
pm2 status

# Restart services
pm2 restart suncast-backend
pm2 restart suncast-frontend

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Manual update
/var/www/suncast/update.sh
```

---

## 🔒 Optional: Setup SSL (HTTPS)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Certificate will auto-renew
```

---

## 📁 File Structure on Server

```
/var/www/suncast/
├── backend/
│   ├── server.js
│   ├── cacheManager.js
│   ├── .env
│   └── cache/
├── dist/               # Built frontend
├── src/               # Source files
├── update.sh          # Update script
└── webhook.js         # Auto-deploy listener (optional)
```

---

## 🚨 Troubleshooting

**App not accessible:**
```bash
# Check if services are running
pm2 status

# Check Nginx status
sudo systemctl status nginx

# Check firewall
sudo ufw status
```

**After update, changes not visible:**
```bash
# Clear browser cache or hard reload (Cmd+Shift+R)
# Force rebuild frontend
cd /var/www/suncast
npm run build
pm2 restart suncast-frontend
```

**Backend errors:**
```bash
# Check backend logs
pm2 logs suncast-backend

# Restart backend
pm2 restart suncast-backend
```
