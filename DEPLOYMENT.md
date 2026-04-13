# TreasureHunt Deployment Guide

This guide covers deploying TreasureHunt to various environments: local development, Docker, Oracle Cloud, Railway, Render, and other cloud platforms.

## Table of Contents

1. [Local Development](#local-development)
2. [Docker Deployment](#docker-deployment)
3. [Oracle Cloud Deployment](#oracle-cloud-deployment)
4. [Railway Deployment](#railway-deployment)
5. [Render Deployment](#render-deployment)
6. [Environment Variables](#environment-variables)
7. [Database Setup](#database-setup)
8. [Troubleshooting](#troubleshooting)

---

## Local Development

### Prerequisites

- **Node.js**: 22.x or higher
- **pnpm**: 9.x or higher
- **Git**: Latest version

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/yardsalemapus-dev/treasure-hunt.git
   cd treasure-hunt
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your configuration (see [Environment Variables](#environment-variables))

4. **Set up the database**
   ```bash
   pnpm db:push
   ```

5. **Start development server**
   ```bash
   pnpm run dev
   ```
   The app will be available at `http://localhost:3000`

### Development Commands

- `pnpm run dev` - Start development server with hot reload
- `pnpm run build` - Build for production
- `pnpm test` - Run all tests
- `pnpm db:push` - Push database schema changes
- `pnpm lint` - Run linting checks

---

## Docker Deployment

### Build Docker Image

```bash
# Build with default environment variables
docker build -t treasure-hunt:latest .

# Build with custom VITE variables (recommended for production)
docker build \
  --build-arg VITE_APP_ID=your_app_id \
  --build-arg VITE_OAUTH_PORTAL_URL=https://api.manus.im \
  --build-arg VITE_FRONTEND_FORGE_API_KEY=your_api_key \
  --build-arg VITE_FRONTEND_FORGE_API_URL=https://forge.butterfly-effect.dev \
  --build-arg VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key \
  -t treasure-hunt:latest .
```

### Run Docker Container

```bash
docker run -d \
  --name treasure-hunt \
  -p 8080:8080 \
  -e DATABASE_URL="mysql://user:password@host:3306/treasure_hunt" \
  -e JWT_SECRET="your_jwt_secret" \
  -e VITE_APP_ID="your_app_id" \
  -e OAUTH_SERVER_URL="https://api.manus.im" \
  -e VITE_OAUTH_PORTAL_URL="https://api.manus.im" \
  -e OWNER_OPEN_ID="your_owner_id" \
  -e OWNER_NAME="Your Name" \
  -e BUILT_IN_FORGE_API_URL="https://forge.butterfly-effect.dev" \
  -e BUILT_IN_FORGE_API_KEY="your_forge_key" \
  -e VITE_FRONTEND_FORGE_API_KEY="your_frontend_key" \
  -e VITE_FRONTEND_FORGE_API_URL="https://forge.butterfly-effect.dev" \
  -e STRIPE_SECRET_KEY="your_stripe_secret" \
  -e STRIPE_WEBHOOK_SECRET="your_webhook_secret" \
  -e VITE_STRIPE_PUBLISHABLE_KEY="your_stripe_publishable" \
  treasure-hunt:latest
```

### Using Docker Compose

```bash
# Create .env file with your environment variables
cp .env.example .env

# Start the application
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop the application
docker-compose down
```

---

## Oracle Cloud Deployment

### Prerequisites

- Oracle Cloud account with free tier access
- OCI CLI installed and configured
- Docker installed locally

### Deployment Steps

1. **Create a Container Registry**
   ```bash
   oci artifacts container repository create \
     --compartment-id <COMPARTMENT_ID> \
     --repository-name treasure-hunt
   ```

2. **Build and push Docker image**
   ```bash
   # Tag the image
   docker tag treasure-hunt:latest <REGISTRY_URL>/treasure-hunt:latest
   
   # Push to Oracle Registry
   docker push <REGISTRY_URL>/treasure-hunt:latest
   ```

3. **Create a Container Instance**
   - Go to Oracle Cloud Console → Containers → Container Instances
   - Click "Create Container Instance"
   - Select your compartment
   - Choose the treasure-hunt image from your registry
   - Configure environment variables (see [Environment Variables](#environment-variables))
   - Set port mapping: 8080 → 80
   - Create the instance

4. **Configure networking**
   - Ensure security list allows inbound traffic on port 80
   - Assign a public IP address to the container instance

5. **Access the application**
   ```
   http://<PUBLIC_IP>
   ```

### Monitoring

```bash
# View container logs
oci compute-container-instance container-instance get \
  --container-instance-id <INSTANCE_ID>

# Update container
oci compute-container-instance container-instance update \
  --container-instance-id <INSTANCE_ID> \
  --containers '[{"imageUrl":"<NEW_IMAGE_URL>"}]'
```

---

## Railway Deployment

### Prerequisites

- Railway account (free tier available)
- GitHub repository connected to Railway

### Deployment Steps

1. **Connect GitHub repository**
   - Go to [Railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select `yardsalemapus-dev/treasure-hunt`

2. **Add environment variables**
   - In Railway dashboard, go to Variables
   - Add all required environment variables (see [Environment Variables](#environment-variables))

3. **Configure build settings**
   - Build command: `pnpm install && pnpm run build`
   - Start command: `node dist/index.js`
   - Port: `3000`

4. **Add MySQL database**
   - Click "Add Service" → "MySQL"
   - Railway will automatically set `DATABASE_URL`

5. **Deploy**
   - Railway automatically deploys on git push to main branch

### Access the application

```
https://<PROJECT_NAME>.up.railway.app
```

---

## Render Deployment

### Prerequisites

- Render account (free tier available)
- GitHub repository connected to Render

### Deployment Steps

1. **Create new Web Service**
   - Go to [Render.com](https://render.com)
   - Click "New" → "Web Service"
   - Connect GitHub repository

2. **Configure build settings**
   - Build command: `pnpm install && pnpm run build`
   - Start command: `node dist/index.js`
   - Environment: `Node`

3. **Add environment variables**
   - In Render dashboard, go to Environment
   - Add all required environment variables (see [Environment Variables](#environment-variables))

4. **Add PostgreSQL database**
   - Click "Create" → "PostgreSQL"
   - Render will provide `DATABASE_URL`

5. **Deploy**
   - Render automatically deploys on git push to main branch

### Access the application

```
https://<SERVICE_NAME>.onrender.com
```

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | MySQL/PostgreSQL connection string | `mysql://user:pass@host:3306/db` |
| `JWT_SECRET` | Secret key for JWT signing | `your-secret-key-min-32-chars` |
| `VITE_APP_ID` | Manus OAuth app ID | `app_123456` |
| `OAUTH_SERVER_URL` | OAuth server URL | `https://api.manus.im` |
| `VITE_OAUTH_PORTAL_URL` | OAuth portal URL | `https://api.manus.im` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_FRONTEND_FORGE_API_KEY` | Frontend API key | (empty) |
| `VITE_FRONTEND_FORGE_API_URL` | Frontend API URL | `https://forge.butterfly-effect.dev` |
| `STRIPE_SECRET_KEY` | Stripe secret key (for payments) | (empty) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | (empty) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | (empty) |
| `OWNER_OPEN_ID` | Owner's OpenID | (empty) |
| `OWNER_NAME` | Owner's name | (empty) |
| `BUILT_IN_FORGE_API_URL` | Built-in Forge API URL | `https://forge.butterfly-effect.dev` |
| `BUILT_IN_FORGE_API_KEY` | Built-in Forge API key | (empty) |
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `3000` |

### Setting Environment Variables

**Local development** (`.env.local`):
```
DATABASE_URL=mysql://localhost/treasure_hunt
JWT_SECRET=your-local-secret-key
VITE_APP_ID=local_app_id
# ... other variables
```

**Docker/Production**:
```bash
docker run -e DATABASE_URL="..." -e JWT_SECRET="..." ...
```

**Docker Compose** (`.env`):
```
DATABASE_URL=mysql://db:3306/treasure_hunt
JWT_SECRET=your-production-secret
# ... other variables
```

---

## Database Setup

### Local MySQL

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE treasure_hunt CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Run migrations
pnpm db:push
```

### Cloud Database Options

**Oracle Cloud MySQL**:
```bash
oci mysql db-system create \
  --compartment-id <COMPARTMENT_ID> \
  --display-name treasure-hunt-db \
  --admin-username admin \
  --admin-password <PASSWORD>
```

**Railway PostgreSQL** (automatic):
- Railway creates and manages the database automatically
- Set `DATABASE_URL` environment variable

**Render PostgreSQL** (automatic):
- Render creates and manages the database automatically
- Set `DATABASE_URL` environment variable

### Running Migrations

```bash
# Push schema changes
pnpm db:push

# Generate migration files
pnpm db:generate

# Migrate database
pnpm db:migrate
```

---

## Troubleshooting

### "Invalid URL" Error

**Cause**: Unresolved environment variables in build

**Solution**:
1. Ensure all `VITE_*` variables are set during Docker build
2. Use `--build-arg` flags when building Docker image
3. Check that `.env` file has all required variables

### Database Connection Errors

**Cause**: Incorrect `DATABASE_URL` format

**Solution**:
```bash
# MySQL format
mysql://user:password@host:3306/database

# PostgreSQL format
postgresql://user:password@host:5432/database
```

### OAuth Not Working

**Cause**: Incorrect OAuth configuration

**Solution**:
1. Verify `VITE_APP_ID` matches your Manus app ID
2. Ensure `OAUTH_SERVER_URL` is correct
3. Check redirect URL is configured in Manus dashboard

### Port Already in Use

**Cause**: Port 3000 or 8080 is already in use

**Solution**:
```bash
# Change port
PORT=3001 pnpm run dev

# Or kill process using port
lsof -i :3000
kill -9 <PID>
```

### Build Fails with Memory Error

**Cause**: Insufficient memory during build

**Solution**:
```bash
# Increase Node memory
NODE_OPTIONS=--max-old-space-size=4096 pnpm run build
```

### Stripe Webhook Not Receiving Events

**Cause**: Webhook endpoint not accessible or secret mismatch

**Solution**:
1. Ensure app is publicly accessible
2. Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
3. Check webhook endpoint is at `/api/stripe/webhook`
4. Review Stripe Dashboard → Developers → Webhooks for event logs

---

## Production Checklist

- [ ] All environment variables configured
- [ ] Database backups enabled
- [ ] SSL/TLS certificate configured
- [ ] OAuth credentials verified
- [ ] Stripe keys configured (if using payments)
- [ ] Email service configured
- [ ] Monitoring and logging enabled
- [ ] Health check endpoint working
- [ ] Database migrations run successfully
- [ ] All tests passing
- [ ] Security headers configured

---

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review application logs
3. Check environment variables are set correctly
4. Ensure database is accessible
5. Verify OAuth configuration

---

## Additional Resources

- [Node.js Documentation](https://nodejs.org/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [Oracle Cloud Documentation](https://docs.oracle.com/en-us/iaas/)
- [Railway Documentation](https://docs.railway.app/)
- [Render Documentation](https://render.com/docs)
- [Manus OAuth Documentation](https://api.manus.im/docs)
