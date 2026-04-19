# TreasureHunt Setup Guide

Quick setup instructions for getting TreasureHunt running locally or in production.

## Quick Start (Local Development)

### 1. Prerequisites

- Node.js 22+ ([Download](https://nodejs.org/))
- pnpm 9+ (`npm install -g pnpm`)
- MySQL 8+ or PostgreSQL 12+
- Git

### 2. Clone and Install

```bash
git clone https://github.com/yardsalemapus-dev/treasure-hunt.git
cd treasure-hunt
pnpm install
```

### 3. Configure Environment

Create a `.env.local` file in the project root with the following variables:

```bash
# Database (required)
DATABASE_URL=mysql:
# OAuth (required)
JWT_SECRET=
VITE_APP_ID=
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://api.manus.im

# Owner info (required)
OWNER_OPEN_ID=
OWNER_NAME=

# API Keys (required)
BUILT_IN_FORGE_API_URL=https://forge.butterfly-effect.dev
BUILT_IN_FORGE_API_KEY=
VITE_FRONTEND_FORGE_API_KEY=
VITE_FRONTEND_FORGE_API_URL=https://forge.butterfly-effect.dev

# Stripe (optional)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# OAuth (required)
JWT_SECRET=
VITE_APP_ID=
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://api.manus.im

# Owner info (required)
OWNER_OPEN_ID=
OWNER_NAME=

# API Keys (required)
BUILT_IN_FORGE_API_URL=https://forge.butterfly-effect.dev
BUILT_IN_FORGE_API_KEY=
VITE_FRONTEND_FORGE_API_KEY=
VITE_FRONTEND_FORGE_API_URL=https://forge.butterfly-effect.dev

# Stripe (optional)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=whsec_...
VITE_STRIPE_PUBLISHABLE_KEY=

```

### 4. Setup Database

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE treasure_hunt CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Run migrations
pnpm db:push
```

### 5. Start Development Server

```bash
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Docker Quick Start

### Build and Run

```bash
# Build image
docker build -t treasure-hunt:latest .

# Run container
docker run -d \
  --name treasure-hunt \
  -p 8080:8080 \
  -e DATABASE_URL="mysql://user:pass@host:3306/treasure_hunt" \
  -e JWT_SECRET="your-secret" \
  -e VITE_APP_ID="your_app_id" \
  -e OAUTH_SERVER_URL="https://api.manus.im" \
  -e VITE_OAUTH_PORTAL_URL="https://api.manus.im" \
  -e OWNER_OPEN_ID="your_owner_id" \
  -e OWNER_NAME="Your Name" \
  -e BUILT_IN_FORGE_API_URL="https://forge.butterfly-effect.dev" \
  -e BUILT_IN_FORGE_API_KEY="your_api_key" \
  -e VITE_FRONTEND_FORGE_API_KEY="your_frontend_key" \
  -e VITE_FRONTEND_FORGE_API_URL="https://forge.butterfly-effect.dev" \
  treasure-hunt:latest
```

Access at [http://localhost:8080](http://localhost:8080)

### Using Docker Compose

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your values
nano .env

# Start services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

---

## Cloud Deployment Options

### Oracle Cloud (Free Tier)

See [DEPLOYMENT.md - Oracle Cloud Deployment](./DEPLOYMENT.md#oracle-cloud-deployment)

### Railway (Free Tier)

See [DEPLOYMENT.md - Railway Deployment](./DEPLOYMENT.md#railway-deployment)

### Render (Free Tier)

See [DEPLOYMENT.md - Render Deployment](./DEPLOYMENT.md#render-deployment)

---

## Common Commands

```bash
# Development
pnpm run dev          # Start dev server with hot reload
pnpm run build        # Build for production
pnpm run preview      # Preview production build locally

# Database
pnpm db:push          # Push schema changes to database
pnpm db:generate      # Generate migration files
pnpm db:migrate       # Run migrations

# Testing & Quality
pnpm test             # Run all tests
pnpm test:watch       # Run tests in watch mode
pnpm lint             # Run linting checks
pnpm check            # Type check TypeScript

# Production
pnpm start            # Start production server
```

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | Database connection string |
| `JWT_SECRET` | ✅ | JWT signing secret (min 32 chars) |
| `VITE_APP_ID` | ✅ | Manus OAuth application ID |
| `OAUTH_SERVER_URL` | ✅ | OAuth server URL |
| `VITE_OAUTH_PORTAL_URL` | ✅ | OAuth portal URL |
| `OWNER_OPEN_ID` | ✅ | Owner's OpenID |
| `OWNER_NAME` | ✅ | Owner's name |
| `BUILT_IN_FORGE_API_URL` | ✅ | Forge API URL |
| `BUILT_IN_FORGE_API_KEY` | ✅ | Forge API key |
| `VITE_FRONTEND_FORGE_API_KEY` | ✅ | Frontend Forge API key |
| `VITE_FRONTEND_FORGE_API_URL` | ✅ | Frontend Forge API URL |
| `STRIPE_SECRET_KEY` | ❌ | Stripe secret key (for payments) |
| `STRIPE_WEBHOOK_SECRET` | ❌ | Stripe webhook secret |
| `VITE_STRIPE_PUBLISHABLE_KEY` | ❌ | Stripe publishable key |
| `NODE_ENV` | ❌ | `development` or `production` |
| `PORT` | ❌ | Server port (default: 3000) |

---

## Troubleshooting

### Port Already in Use

```bash
# Change port
PORT=3001 pnpm run dev

# Or kill process using port
lsof -i :3000
kill -9 <PID>
```

### Database Connection Failed

```bash
# Check MySQL is running
mysql -u root -p -e "SELECT 1;"

# Verify DATABASE_URL format
# MySQL: mysql://user:password@host:port/database
# PostgreSQL: postgresql://user:password@host:port/database
```

### OAuth Not Working

1. Verify `VITE_APP_ID` in `.env.local`
2. Check `OAUTH_SERVER_URL` is correct
3. Ensure redirect URL is configured in Manus dashboard

### Build Fails

```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Rebuild
pnpm run build
```

---

## Getting Help

- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment guides
- Review [README.md](./README.md) for project overview
- Check application logs: `docker-compose logs app`
- Review error messages carefully - they often indicate the solution

---

## Next Steps

1. ✅ Setup complete - application is running
2. 📝 Create admin user (see [Admin Setup](#admin-setup))
3. 🔑 Configure OAuth in Manus dashboard
4. 💳 Setup Stripe (if using payments)
5. 🚀 Deploy to production

---

## Admin Setup

After the application is running, promote your user to admin:

```bash
# Using MySQL
mysql -u root -p treasure_hunt
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';

# Or using the management UI (if available)
# Navigate to /admin/users and promote user
```

---

## Additional Resources

- [Full Deployment Guide](./DEPLOYMENT.md)
- [Project README](./README.md)
- [Manus Documentation](https://api.manus.im/docs)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/)
