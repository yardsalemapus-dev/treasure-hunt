# VPS Deployment Guide - TreasureHunt

## Quick Start

Deploy to your VPS at `103.195.100.158` using the automated script:

```bash
chmod +x deploy.sh
./deploy.sh 103.195.100.158 root 22
```

---

## Manual Deployment Steps

### 1. SSH into VPS

```bash
ssh root@103.195.100.158
```

### 2. Install Docker & Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### 3. Clone Repository

```bash
cd /opt
git clone https://github.com/yardsalemapus-dev/treasure-hunt.git
cd treasure-hunt
```

### 4. Configure Environment Variables

```bash
# Copy example env file
cp .env.example .env

# Edit with your values
nano .env
```

**Critical Variables to Set:**
```env
# Database
DATABASE_URL=mysql://treasure_hunt:treasure_hunt_pass@db:3306/treasure_hunt

# Auth
JWT_SECRET=your-secure-random-string-here
VITE_APP_ID=your_manus_app_id

# OAuth
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im

# Owner Info
OWNER_NAME=Your Name
OWNER_OPEN_ID=your_open_id

# Manus APIs
BUILT_IN_FORGE_API_KEY=your_key
VITE_FRONTEND_FORGE_API_KEY=your_key

# Analytics (FIX FOR UMAMI ERROR)
VITE_ANALYTICS_ENDPOINT=https://your-analytics-domain.com/api/send
VITE_ANALYTICS_WEBSITE_ID=your_website_id

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

### 5. Fix Docker Environment Variable Injection

**Problem**: `%VITE_ANALYTICS_ENDPOINT%` not being replaced in Docker

**Solution**: Update `docker-compose.yml` to use `--build-arg`:

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        - VITE_ANALYTICS_ENDPOINT=${VITE_ANALYTICS_ENDPOINT}
        - VITE_ANALYTICS_WEBSITE_ID=${VITE_ANALYTICS_WEBSITE_ID}
```

Update `Dockerfile` to accept build args:

```dockerfile
ARG VITE_ANALYTICS_ENDPOINT
ARG VITE_ANALYTICS_WEBSITE_ID

ENV VITE_ANALYTICS_ENDPOINT=${VITE_ANALYTICS_ENDPOINT}
ENV VITE_ANALYTICS_WEBSITE_ID=${VITE_ANALYTICS_WEBSITE_ID}
```

### 6. Build and Start Services

```bash
# Build images
docker-compose build --no-cache

# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f app
```

### 7. Run Database Migrations

```bash
# Wait for MySQL to be ready (30-60 seconds)
docker-compose exec app pnpm db:push

# Seed initial data (optional)
docker-compose exec app pnpm db:seed
```

### 8. Verify Deployment

```bash
# Check if app is running
curl http://localhost:8080

# Check health endpoint
curl http://localhost:8080/health

# View app logs
docker-compose logs app | tail -50
```

---

## Fixing the Umami Analytics Error

### Error Message
```
Failed to load resource: the server responded with a status of 400 (Bad Request)
Refused to execute script from 'http://103.195.100.158:8080/%VITE_ANALYTICS_ENDPOINT%/umami'
```

### Root Cause
Environment variables are not being injected into the Vite build during Docker build.

### Solution

**Step 1**: Update `docker-compose.yml`

```yaml
app:
  build:
    context: .
    dockerfile: Dockerfile
    args:
      VITE_ANALYTICS_ENDPOINT: ${VITE_ANALYTICS_ENDPOINT}
      VITE_ANALYTICS_WEBSITE_ID: ${VITE_ANALYTICS_WEBSITE_ID}
      VITE_APP_ID: ${VITE_APP_ID}
      VITE_FRONTEND_FORGE_API_KEY: ${VITE_FRONTEND_FORGE_API_KEY}
      VITE_FRONTEND_FORGE_API_URL: ${VITE_FRONTEND_FORGE_API_URL}
      VITE_OAUTH_PORTAL_URL: ${VITE_OAUTH_PORTAL_URL}
      VITE_STRIPE_PUBLISHABLE_KEY: ${VITE_STRIPE_PUBLISHABLE_KEY}
```

**Step 2**: Update `Dockerfile`

```dockerfile
# Add ARG declarations at the top
ARG VITE_ANALYTICS_ENDPOINT
ARG VITE_ANALYTICS_WEBSITE_ID
ARG VITE_APP_ID
ARG VITE_FRONTEND_FORGE_API_KEY
ARG VITE_FRONTEND_FORGE_API_URL
ARG VITE_OAUTH_PORTAL_URL
ARG VITE_STRIPE_PUBLISHABLE_KEY

# In builder stage, set ENV from ARG
ENV VITE_ANALYTICS_ENDPOINT=${VITE_ANALYTICS_ENDPOINT}
ENV VITE_ANALYTICS_WEBSITE_ID=${VITE_ANALYTICS_WEBSITE_ID}
ENV VITE_APP_ID=${VITE_APP_ID}
ENV VITE_FRONTEND_FORGE_API_KEY=${VITE_FRONTEND_FORGE_API_KEY}
ENV VITE_FRONTEND_FORGE_API_URL=${VITE_FRONTEND_FORGE_API_URL}
ENV VITE_OAUTH_PORTAL_URL=${VITE_OAUTH_PORTAL_URL}
ENV VITE_STRIPE_PUBLISHABLE_KEY=${VITE_STRIPE_PUBLISHABLE_KEY}
```

**Step 3**: Rebuild and restart

```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## Accessing the Application

### URLs

| Service | URL |
|---------|-----|
| **Main App** | `http://103.195.100.158:8080` |
| **Admin Dashboard** | `http://103.195.100.158:8080/admin` |
| **API** | `http://103.195.100.158:8080/api` |
| **Database** | `localhost:3306` |

### Admin Access

1. Create a user account in the app
2. SSH into VPS and update user role:

```bash
docker-compose exec db mysql -u treasure_hunt -ptreasure_hunt_pass treasure_hunt
```

```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

3. Access `/admin` dashboard

---

## Troubleshooting

### Docker Container Won't Start

```bash
# Check logs
docker-compose logs app

# Common issues:
# - Port 8080 already in use: Change PORT in docker-compose.yml
# - Database not ready: Wait 30-60 seconds and retry
# - Out of disk space: Run `docker system prune -a`
```

### Database Connection Error

```bash
# Check if MySQL is running
docker-compose ps db

# Check MySQL logs
docker-compose logs db

# Verify connection
docker-compose exec db mysql -u treasure_hunt -ptreasure_hunt_pass -e "SELECT 1;"
```

### Environment Variables Not Applied

```bash
# Rebuild with no cache
docker-compose build --no-cache

# Check env in running container
docker-compose exec app env | grep VITE_

# Restart app
docker-compose restart app
```

### Analytics Script Error

```bash
# Verify analytics endpoint is set
docker-compose exec app env | grep VITE_ANALYTICS

# Check if endpoint is reachable
curl ${VITE_ANALYTICS_ENDPOINT}/api/send

# If not reachable, update .env and rebuild
```

---

## Production Checklist

- [ ] Update all environment variables in `.env`
- [ ] Set strong `JWT_SECRET` and `COOKIE_SECRET`
- [ ] Configure SSL/TLS certificate (use Let's Encrypt)
- [ ] Set up domain name pointing to VPS IP
- [ ] Configure Nginx reverse proxy for HTTPS
- [ ] Promote admin user in database
- [ ] Test admin dashboard at `/admin`
- [ ] Configure scraper settings in admin panel
- [ ] Set up automated backups for database
- [ ] Monitor logs regularly: `docker-compose logs -f`
- [ ] Test all scrapers manually from admin panel

---

## Monitoring & Logs

### View Real-time Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f db

# Last 100 lines
docker-compose logs --tail=100 app
```

### Check Service Status

```bash
docker-compose ps

# Expected output:
# NAME                 STATUS
# treasure_hunt_db     Up (healthy)
# treasure_hunt_app    Up (healthy)
```

### Health Checks

```bash
# App health
curl http://localhost:8080/health

# Database health
docker-compose exec db mysqladmin ping -u treasure_hunt -ptreasure_hunt_pass
```

---

## Backup & Restore

### Backup Database

```bash
docker-compose exec db mysqldump -u treasure_hunt -ptreasure_hunt_pass treasure_hunt > backup.sql
```

### Restore Database

```bash
docker-compose exec -T db mysql -u treasure_hunt -ptreasure_hunt_pass treasure_hunt < backup.sql
```

---

## Updating Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Run migrations
docker-compose exec app pnpm db:push
```

---

## Support

For issues or questions:
1. Check logs: `docker-compose logs -f app`
2. Review DEPLOYMENT_GUIDE.md for scraper configuration
3. Check admin dashboard for scraper job status
4. Verify environment variables are set correctly
