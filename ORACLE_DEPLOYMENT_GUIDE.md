# TreasureHunt - Oracle Cloud Deployment Guide

This guide walks you through deploying TreasureHunt to Oracle Cloud and connecting your garagesalemap.app domain.

## Prerequisites

Before starting, ensure you have:
- Oracle Cloud free tier account (https://www.oracle.com/cloud/free/)
- GitHub account with this repository
- GoDaddy account with garagesalemap.app domain
- Access to Oracle Cloud Console

## Step 1: Set Up Oracle Cloud Infrastructure

### 1.1 Create an Oracle Container Registry (OCR)

1. Log in to Oracle Cloud Console (https://cloud.oracle.com)
2. Navigate to **Developer Services** → **Container Registry**
3. Click **Create Repository**
4. Fill in the details:
   - Repository name: `treasure-hunt`
   - Access: Public (for easier deployment)
5. Click **Create**

### 1.2 Create an Auth Token for GitHub

1. In Oracle Cloud Console, click your **Profile icon** (top right)
2. Select **My profile**
3. Under **Resources**, click **Auth Tokens**
4. Click **Generate Token**
5. Enter description: `GitHub Actions Deploy`
6. Copy the generated token and save it securely (you'll need it for GitHub Secrets)

### 1.3 Create a Container Instance

1. Navigate to **Compute** → **Instances**
2. Click **Create instance**
3. Configure the instance:
   - **Name**: `treasure-hunt-app`
   - **Image**: Ubuntu 22.04 (or latest available)
   - **Shape**: Ampere (ARM) - A1 Compute (free tier eligible)
   - **Network**: Create new VCN or use existing
   - **Public IP address**: Assign
4. Under **Advanced options**, add the following to **Initialization script**:

```bash
#!/bin/bash
apt-get update
apt-get install -y docker.io
systemctl start docker
systemctl enable docker
usermod -aG docker ubuntu
```

5. Click **Create**
6. Wait for the instance to reach "Running" state
7. Note the **Public IP Address** (you'll need this for DNS)

### 1.4 Set Up Container Instance (Alternative - Simpler)

If you prefer a managed container service:

1. Navigate to **Compute** → **Container Instances**
2. Click **Create container instance**
3. Configure:
   - **Name**: `treasure-hunt-container`
   - **Compartment**: Default
   - **Availability domain**: Select any
   - **Image**: Select from registry
   - **Container image URL**: `ghcr.io/YOUR_GITHUB_USERNAME/treasure_hunt:latest`
   - **Port mappings**: 8080 → 8080
4. Under **Environment variables**, add all required secrets (see Step 2)
5. Click **Create**

## Step 2: Configure GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add the following:

| Secret Name | Value |
|---|---|
| `ORACLE_COMPARTMENT_ID` | Your Oracle compartment ID (from Oracle Cloud Console) |
| `ORACLE_CONTAINER_INSTANCE_ID` | Container instance ID from Step 1.4 |
| `ORACLE_AUTH_TOKEN` | Auth token from Step 1.2 |
| `ORACLE_REGION` | Your region (e.g., `us-phoenix-1`) |
| `ORACLE_CONFIG` | Your OCI config file contents |
| `ORACLE_PRIVATE_KEY` | Your OCI private key contents |

**To find your compartment ID:**
1. In Oracle Cloud Console, go to **Governance** → **Compartments**
2. Copy your compartment OCID

**To get your OCI config and private key:**
1. In Oracle Cloud Console, click your **Profile icon**
2. Select **My profile**
3. Under **Resources**, click **API Keys**
4. Click **Add API Key**
5. Select **Generate API Key Pair**
6. Download the private key
7. Copy the config file preview and save it

## Step 3: Connect Your Domain (GoDaddy)

1. Log in to GoDaddy (https://www.godaddy.com)
2. Go to **My Products** → **Domains**
3. Click **garagesalemap.app**
4. Under **DNS**, click **Manage DNS**
5. Find the **A record** (or create one if it doesn't exist)
6. Update the A record:
   - **Name**: @ (or leave blank)
   - **Type**: A
   - **Value**: Your Oracle Cloud instance public IP address (from Step 1.3)
   - **TTL**: 600 (or default)
7. Click **Save**
8. Wait 5-15 minutes for DNS to propagate

**To verify DNS propagation:**
```bash
nslookup garagesalemap.app
# or
dig garagesalemap.app
```

## Step 4: Set Up SSL Certificate (Let's Encrypt)

Once your domain is pointing to your Oracle Cloud instance:

1. SSH into your Oracle Cloud instance:
```bash
ssh -i your-private-key.key ubuntu@YOUR_ORACLE_IP
```

2. Install Certbot and Nginx:
```bash
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx nginx
```

3. Obtain SSL certificate:
```bash
sudo certbot certonly --standalone -d garagesalemap.app -d www.garagesalemap.app
```

4. Configure Nginx as reverse proxy:

Create `/etc/nginx/sites-available/treasure-hunt`:

```nginx
server {
    listen 80;
    server_name garagesalemap.app www.garagesalemap.app;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name garagesalemap.app www.garagesalemap.app;

    ssl_certificate /etc/letsencrypt/live/garagesalemap.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/garagesalemap.app/privkey.pem;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

5. Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/treasure-hunt /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

6. Set up auto-renewal:
```bash
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

## Step 5: Deploy Your Application

### Option A: Automatic Deployment (GitHub Actions)

1. Push your code to GitHub main branch:
```bash
git add .
git commit -m "Deploy to Oracle Cloud"
git push origin main
```

2. GitHub Actions will automatically:
   - Build the Docker image
   - Push to GitHub Container Registry
   - Deploy to Oracle Cloud

3. Monitor the deployment in GitHub Actions tab

### Option B: Manual Deployment

1. SSH into your Oracle Cloud instance
2. Pull the latest Docker image:
```bash
docker pull ghcr.io/YOUR_GITHUB_USERNAME/treasure_hunt:latest
```

3. Run the container:
```bash
docker run -d \
  -p 8080:8080 \
  -e NODE_ENV=production \
  -e DATABASE_URL="your_database_url" \
  -e JWT_SECRET="your_jwt_secret" \
  -e VITE_APP_ID="your_app_id" \
  -e OAUTH_SERVER_URL="your_oauth_url" \
  -e VITE_OAUTH_PORTAL_URL="your_oauth_portal_url" \
  -e OWNER_OPEN_ID="your_owner_id" \
  -e OWNER_NAME="your_name" \
  -e BUILT_IN_FORGE_API_URL="your_forge_url" \
  -e BUILT_IN_FORGE_API_KEY="your_forge_key" \
  -e VITE_FRONTEND_FORGE_API_KEY="your_frontend_key" \
  -e VITE_FRONTEND_FORGE_API_URL="your_frontend_url" \
  -e STRIPE_SECRET_KEY="your_stripe_key" \
  -e STRIPE_WEBHOOK_SECRET="your_webhook_secret" \
  -e VITE_STRIPE_PUBLISHABLE_KEY="your_publishable_key" \
  --name treasure-hunt \
  --restart unless-stopped \
  ghcr.io/YOUR_GITHUB_USERNAME/treasure_hunt:latest
```

## Step 6: Verify Deployment

1. Visit https://garagesalemap.app in your browser
2. You should see the TreasureHunt landing page
3. Navigate to https://garagesalemap.app/explore to test the map

## Troubleshooting

### DNS not resolving
- Wait 15-30 minutes for DNS propagation
- Clear your browser cache
- Try: `nslookup garagesalemap.app`

### SSL certificate errors
- Ensure your domain is pointing to the correct IP
- Check Nginx configuration: `sudo nginx -t`
- Review Certbot logs: `sudo certbot renew --dry-run`

### Application not responding
- SSH into instance and check Docker logs:
```bash
docker logs treasure-hunt
```
- Verify all environment variables are set correctly
- Check Nginx is running: `sudo systemctl status nginx`

### GitHub Actions deployment failing
- Check GitHub Actions logs in your repository
- Verify all secrets are correctly configured
- Ensure Oracle auth token is valid

## Monitoring and Maintenance

### View application logs
```bash
docker logs -f treasure-hunt
```

### Update application
```bash
git push origin main  # GitHub Actions handles the rest
```

### Restart application
```bash
docker restart treasure-hunt
```

### Monitor disk usage
```bash
df -h
docker system df
```

## Support

For issues or questions:
1. Check GitHub Actions logs for deployment errors
2. Review Oracle Cloud console for instance health
3. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
4. Review application logs: `docker logs treasure-hunt`

---

**Your TreasureHunt app is now live at https://garagesalemap.app! 🎉**
