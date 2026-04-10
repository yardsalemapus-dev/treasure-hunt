#!/bin/bash

# TreasureHunt VPS Deployment Script
# This script deploys the application to a VPS with Docker

set -e

echo "🚀 TreasureHunt Deployment Script"
echo "=================================="

# Configuration
VPS_IP=${1:-103.195.100.158}
VPS_USER=${2:-root}
VPS_PORT=${3:-22}
APP_DIR="/opt/treasure_hunt"
DOCKER_COMPOSE_FILE="docker-compose.yml"

echo "📋 Configuration:"
echo "  VPS IP: $VPS_IP"
echo "  VPS User: $VPS_USER"
echo "  VPS Port: $VPS_PORT"
echo "  App Directory: $APP_DIR"

# Step 1: Check SSH connectivity
echo ""
echo "🔍 Checking SSH connectivity..."
ssh -p $VPS_PORT $VPS_USER@$VPS_IP "echo 'SSH connection successful'"

# Step 2: Create app directory
echo ""
echo "📁 Creating application directory..."
ssh -p $VPS_PORT $VPS_USER@$VPS_IP "mkdir -p $APP_DIR && cd $APP_DIR && pwd"

# Step 3: Copy files to VPS
echo ""
echo "📤 Copying files to VPS..."
scp -P $VPS_PORT -r \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=dist \
  --exclude=client/dist \
  --exclude=.env \
  . $VPS_USER@$VPS_IP:$APP_DIR/

# Step 4: Copy docker-compose.yml
echo ""
echo "🐳 Copying Docker Compose configuration..."
scp -P $VPS_PORT docker-compose.yml $VPS_USER@$VPS_IP:$APP_DIR/

# Step 5: Setup environment variables
echo ""
echo "⚙️  Setting up environment variables..."
ssh -p $VPS_PORT $VPS_USER@$VPS_IP "cat > $APP_DIR/.env << 'EOF'
# Add your environment variables here
# See .env.example for reference
DATABASE_URL=mysql://treasure_hunt:treasure_hunt_pass@db:3306/treasure_hunt
JWT_SECRET=your-secret-key-change-this
VITE_APP_ID=your_app_id
# ... add other required variables
EOF"

# Step 6: Install Docker if not present
echo ""
echo "🐳 Checking Docker installation..."
ssh -p $VPS_PORT $VPS_USER@$VPS_IP "which docker || (curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh)"

# Step 7: Install Docker Compose if not present
echo ""
echo "📦 Checking Docker Compose installation..."
ssh -p $VPS_PORT $VPS_USER@$VPS_IP "which docker-compose || (curl -L https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m) -o /usr/local/bin/docker-compose && chmod +x /usr/local/bin/docker-compose)"

# Step 8: Build and start containers
echo ""
echo "🔨 Building and starting Docker containers..."
ssh -p $VPS_PORT $VPS_USER@$VPS_IP "cd $APP_DIR && docker-compose build --no-cache"

# Step 9: Start services
echo ""
echo "▶️  Starting services..."
ssh -p $VPS_PORT $VPS_USER@$VPS_IP "cd $APP_DIR && docker-compose up -d"

# Step 10: Wait for services to be healthy
echo ""
echo "⏳ Waiting for services to be healthy..."
ssh -p $VPS_PORT $VPS_USER@$VPS_IP "cd $APP_DIR && docker-compose ps"

# Step 11: Run database migrations
echo ""
echo "🗄️  Running database migrations..."
ssh -p $VPS_PORT $VPS_USER@$VPS_IP "cd $APP_DIR && docker-compose exec -T app pnpm db:push"

# Step 12: Verify deployment
echo ""
echo "✅ Verifying deployment..."
ssh -p $VPS_PORT $VPS_USER@$VPS_IP "curl -s http://localhost:8080/health | head -20 || echo 'Waiting for app to start...'"

echo ""
echo "🎉 Deployment complete!"
echo "=================================="
echo "Application URL: http://$VPS_IP:8080"
echo "Admin Dashboard: http://$VPS_IP:8080/admin"
echo ""
echo "📝 Next steps:"
echo "1. Update your domain DNS to point to $VPS_IP"
echo "2. Configure SSL/TLS certificate"
echo "3. Set up environment variables in .env file"
echo "4. Promote a user to admin role in the database"
echo "5. Access admin dashboard at /admin"
echo ""
echo "📚 For more information, see DEPLOYMENT_GUIDE.md"
