# TreasureHunt Service Startup Guide

## Quick Start Options

### Option 1: Local Development (Fastest)

```bash
cd /home/ubuntu/treasure_hunt
pnpm install
pnpm dev
```

**Access**: http://localhost:5173 (frontend) + http://localhost:3000 (backend)

---

### Option 2: Docker Compose (Recommended for Production)

#### Prerequisites
- Docker installed
- Docker Compose installed
- `.env` file configured with your variables

#### Start Services

```bash
# Navigate to project directory
cd /home/ubuntu/treasure_hunt

# Start all services (app, database, nginx)
docker-compose up -d

# Verify services are running
docker-compose ps

# View logs
docker-compose logs -f app
```

**Access**: http://localhost:8080 (or your VPS IP)

#### Stop Services

```bash
docker-compose down
```

#### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f db

# Last 50 lines
docker-compose logs --tail=50 app
```

---

### Option 3: Manual Node.js (Development)

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your values

# Run database migrations
pnpm db:push

# Start development server
pnpm dev
```

**Access**: http://localhost:5173

---

### Option 4: Production Build

```bash
# Build for production
pnpm run build

# Start production server
node dist/index.js
```

---

## Environment Setup

### Create `.env` File

```bash
# Copy template
cp .env.example .env

# Edit with your values
nano .env
```

### Required Environment Variables

```env
# Database
DATABASE_URL=mysql://treasure_hunt:treasure_hunt_pass@localhost:3306/treasure_hunt

# Auth
JWT_SECRET=your-secret-key-here
VITE_APP_ID=your_app_id

# OAuth
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im

# Owner
OWNER_NAME=Your Name
OWNER_OPEN_ID=your_open_id

# APIs
BUILT_IN_FORGE_API_KEY=your_key
VITE_FRONTEND_FORGE_API_KEY=your_key

# Analytics
VITE_ANALYTICS_ENDPOINT=https://your-analytics.com/api/send
VITE_ANALYTICS_WEBSITE_ID=your_id

# Stripe (optional)
STRIPE_SECRET_KEY=sk_test_xxx
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

---

## Database Setup

### Option A: Docker Database (Easiest)

```bash
# Start just the database
docker-compose up -d db

# Wait 30 seconds for MySQL to initialize

# Run migrations
pnpm db:push
```

### Option B: Local MySQL

```bash
# Install MySQL (macOS)
brew install mysql

# Start MySQL
brew services start mysql

# Create database
mysql -u root -e "CREATE DATABASE treasure_hunt;"

# Run migrations
pnpm db:push
```

### Option C: Docker Database Only

```bash
# Start MySQL container
docker run -d \
  --name treasure_hunt_db \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=treasure_hunt \
  -e MYSQL_USER=treasure_hunt \
  -e MYSQL_PASSWORD=treasure_hunt_pass \
  -p 3306:3306 \
  mysql:8.0

# Run migrations
pnpm db:push
```

---

## Verification Checklist

After starting the service, verify everything is working:

### 1. Check Services Running

```bash
# Docker Compose
docker-compose ps

# Expected output:
# NAME                 STATUS
# treasure_hunt_db     Up (healthy)
# treasure_hunt_app    Up (healthy)
```

### 2. Test API Endpoints

```bash
# Health check
curl http://localhost:8080/health

# tRPC endpoint
curl http://localhost:8080/api/trpc/auth.me
```

### 3. Access Web Interface

```
http://localhost:8080
```

### 4. Check Logs for Errors

```bash
docker-compose logs app | grep -i error
```

### 5. Verify Database Connection

```bash
docker-compose exec db mysql -u treasure_hunt -ptreasure_hunt_pass -e "SELECT 1;"
```

---

## Common Issues & Solutions

### Issue: Port Already in Use

```bash
# Find process using port 8080
lsof -i :8080

# Kill process
kill -9 <PID>

# Or change port in docker-compose.yml
```

### Issue: Database Connection Failed

```bash
# Wait longer for MySQL to start
sleep 60
docker-compose up -d

# Check MySQL logs
docker-compose logs db

# Verify credentials in .env
```

### Issue: Environment Variables Not Set

```bash
# Rebuild without cache
docker-compose build --no-cache

# Restart services
docker-compose restart app
```

### Issue: Vite Build Error

```bash
# Clear cache
rm -rf node_modules dist client/dist

# Reinstall
pnpm install

# Rebuild
pnpm run build
```

### Issue: TypeScript Errors

```bash
# Check for errors
pnpm tsc --noEmit

# Fix errors
pnpm tsc --noEmit --pretty

# Run tests
pnpm test
```

---

## Useful Commands

### Development

```bash
# Start dev server with hot reload
pnpm dev

# Run tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Type check
pnpm tsc --noEmit

# Lint code
pnpm lint

# Format code
pnpm format
```

### Database

```bash
# Run migrations
pnpm db:push

# Generate migration files
pnpm db:generate

# Reset database (WARNING: deletes all data)
pnpm db:reset

# Seed database
pnpm db:seed
```

### Docker

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Execute command in container
docker-compose exec app pnpm test

# Rebuild and restart
docker-compose up -d --build
```

---

## Accessing Admin Dashboard

### 1. Start the Service

```bash
docker-compose up -d
```

### 2. Create User Account

Navigate to http://localhost:8080 and sign up

### 3. Promote to Admin

```bash
# SSH into database
docker-compose exec db mysql -u treasure_hunt -ptreasure_hunt_pass treasure_hunt

# Run SQL command
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

### 4. Access Admin Dashboard

```
http://localhost:8080/admin
```

---

## Monitoring

### Real-time Logs

```bash
docker-compose logs -f app
```

### Health Status

```bash
# Check all services
docker-compose ps

# Check app health
curl http://localhost:8080/health

# Check database health
docker-compose exec db mysqladmin ping -u treasure_hunt -ptreasure_hunt_pass
```

### Performance Metrics

```bash
# Docker stats
docker stats treasure_hunt_app treasure_hunt_db

# System resources
docker-compose exec app node -e "console.log(require('os').cpus().length, 'CPUs')"
```

---

## Troubleshooting

### Enable Debug Logging

```bash
# Set debug environment variable
export DEBUG=*

# Start service
docker-compose up app
```

### Check Application Logs

```bash
# View logs directory
ls -la .manus-logs/

# Check dev server log
tail -f .manus-logs/devserver.log

# Check browser console log
tail -f .manus-logs/browserConsole.log

# Check network requests
tail -f .manus-logs/networkRequests.log
```

### Reset Everything

```bash
# Stop all services
docker-compose down -v

# Remove all containers and volumes
docker system prune -a --volumes

# Start fresh
docker-compose up -d
```

---

## Next Steps

1. **Configure Admin Panel**: Access `/admin` to set up scrapers
2. **Test Scrapers**: Trigger a test scrape from admin dashboard
3. **Set Up Monitoring**: Configure alerts for scraper failures
4. **Enable SSL**: Set up HTTPS with Let's Encrypt
5. **Configure Domain**: Point your domain to the VPS IP

---

## Support

For detailed information, see:
- **DEPLOYMENT_GUIDE.md** - Scraper configuration and admin features
- **VPS_DEPLOYMENT_GUIDE.md** - VPS-specific deployment instructions
- **README.md** - Project overview and architecture
