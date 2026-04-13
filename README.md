# TreasureHunt: Smart Sale Navigator

**Discover hidden treasures in your neighborhood** — A full-stack web application that helps users find local sales, yard sales, and marketplace listings using intelligent search, geolocation, and route optimization.

[![GitHub](https://img.shields.io/badge/GitHub-yardsalemapus--dev%2Ftreasure--hunt-blue)](https://github.com/yardsalemapus-dev/treasure-hunt)
[![License](https://img.shields.io/badge/License-MIT-green)]()
[![Node.js](https://img.shields.io/badge/Node.js-22+-green)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)

## 🚀 Quick Start

### Local Development

```bash
# Clone repository
git clone https://github.com/yardsalemapus-dev/treasure-hunt.git
cd treasure-hunt

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your configuration

# Setup database
pnpm db:push

# Start development server
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Docker Deployment

```bash
# Build image
docker build -t treasure-hunt:latest .

# Run container
docker run -d -p 8080:8080 \
  -e DATABASE_URL="mysql://user:pass@host:3306/treasure_hunt" \
  -e JWT_SECRET="your-secret-key" \
  treasure-hunt:latest
```

Access at [http://localhost:8080](http://localhost:8080)

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **[SETUP.md](./SETUP.md)** | Quick start guide for local development and Docker |
| **[DEPLOYMENT.md](./DEPLOYMENT.md)** | Comprehensive deployment guide for all platforms |
| **[STARTUP_GUIDE.md](./STARTUP_GUIDE.md)** | Initial setup and configuration instructions |

## 🌍 Deployment Options

TreasureHunt can be deployed to any environment. Choose your preferred platform:

### Free Cloud Platforms

| Platform | Cost | Setup Time | Docs |
|----------|------|-----------|------|
| **Oracle Cloud** | Free tier | 15 min | [Guide](./DEPLOYMENT.md#oracle-cloud-deployment) |
| **Railway** | Free tier | 5 min | [Guide](./DEPLOYMENT.md#railway-deployment) |
| **Render** | Free tier | 5 min | [Guide](./DEPLOYMENT.md#render-deployment) |
| **Docker** | Self-hosted | 10 min | [Guide](./DEPLOYMENT.md#docker-deployment) |

### Local Development

- **macOS/Linux/Windows**: See [SETUP.md](./SETUP.md)

## 🛠 Technology Stack

### Frontend
- **React 19** — Modern UI framework with hooks
- **Tailwind CSS 4** — Utility-first styling
- **TypeScript** — Type-safe JavaScript
- **Vite** — Lightning-fast build tool
- **shadcn/ui** — High-quality UI components
- **Google Maps API** — Location-based services

### Backend
- **Node.js 22** — JavaScript runtime
- **Express 4** — Web framework
- **tRPC 11** — Type-safe RPC framework
- **Drizzle ORM** — Type-safe database queries
- **MySQL/PostgreSQL** — Relational database

### Infrastructure
- **Docker** — Containerization
- **OAuth 2.0** — Authentication (Manus)
- **Stripe** — Payment processing
- **S3** — File storage

## 📋 Features

### Core Functionality
- 🗺️ **Location-based Search** — Find sales near you using geolocation
- 🔍 **Smart Search** — Filter by category, price range, distance
- 📍 **Route Optimization** — Plan efficient routes to visit multiple sales
- 💾 **Listing Management** — Create, edit, delete your own listings
- 💬 **Messaging** — Communicate with buyers/sellers
- ⭐ **Favorites** — Save listings for later

### Admin Features
- 👥 **User Management** — Manage users and roles
- 📊 **Analytics** — View platform statistics
- 🛡️ **Moderation** — Review and moderate listings
- 📧 **Email Campaigns** — Send notifications to users

### Technical Features
- 🔐 **OAuth Authentication** — Secure login with Manus
- 💳 **Stripe Integration** — Process payments
- 🌐 **Bilingual Support** — English and Spanish
- 📱 **Responsive Design** — Works on all devices
- ♿ **Accessibility** — WCAG 2.1 compliant
- 🚀 **Performance** — Optimized for speed

## 🔧 Environment Variables

### Required Variables

```env
# Database
DATABASE_URL=mysql://user:password@host:3306/treasure_hunt

# Authentication
JWT_SECRET=your-secret-key-min-32-chars
VITE_APP_ID=your_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://api.manus.im

# Owner Information
OWNER_OPEN_ID=your_owner_id
OWNER_NAME=Your Name

# API Keys
BUILT_IN_FORGE_API_URL=https://forge.butterfly-effect.dev
BUILT_IN_FORGE_API_KEY=your_api_key
VITE_FRONTEND_FORGE_API_KEY=your_frontend_key
VITE_FRONTEND_FORGE_API_URL=https://forge.butterfly-effect.dev
```

### Optional Variables

```env
# Stripe (for payments)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Server
NODE_ENV=production
PORT=3000
```

See [DEPLOYMENT.md](./DEPLOYMENT.md#environment-variables) for complete reference.

## 📦 Project Structure

```
treasure-hunt/
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable UI components
│   │   ├── lib/           # Utilities and helpers
│   │   └── main.tsx       # Entry point
│   └── index.html         # HTML template
├── server/                # Express backend
│   ├── routers/           # tRPC procedures
│   ├── db.ts              # Database queries
│   ├── _core/             # Core infrastructure
│   └── index.ts           # Server entry point
├── drizzle/               # Database schema
│   └── schema.ts          # Table definitions
├── shared/                # Shared types and constants
├── Dockerfile             # Docker configuration
├── docker-compose.yml     # Docker Compose setup
├── DEPLOYMENT.md          # Deployment guide
├── SETUP.md               # Setup guide
└── package.json           # Dependencies
```

## 🚀 Deployment Checklist

- [ ] Clone repository
- [ ] Install dependencies: `pnpm install`
- [ ] Configure environment variables
- [ ] Setup database: `pnpm db:push`
- [ ] Run tests: `pnpm test`
- [ ] Build application: `pnpm run build`
- [ ] Deploy to your platform
- [ ] Verify application is running
- [ ] Setup admin user
- [ ] Configure OAuth in Manus dashboard
- [ ] Setup Stripe (if using payments)

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run specific test file
pnpm test server/auth.logout.test.ts
```

## 📊 Database

### Setup

```bash
# Push schema changes
pnpm db:push

# Generate migration files
pnpm db:generate

# Run migrations
pnpm db:migrate
```

### Supported Databases

- **MySQL 8+** — Recommended for production
- **PostgreSQL 12+** — Alternative option
- **SQLite** — For local development

## 🔐 Security

- ✅ Environment variables never committed to git
- ✅ OAuth 2.0 for secure authentication
- ✅ JWT tokens for session management
- ✅ HTTPS enforced in production
- ✅ SQL injection prevention via ORM
- ✅ CORS properly configured
- ✅ Rate limiting on API endpoints
- ✅ Input validation and sanitization

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License — see the LICENSE file for details.

## 🆘 Support

For help and support:

1. **Documentation**: Read [SETUP.md](./SETUP.md) and [DEPLOYMENT.md](./DEPLOYMENT.md)
2. **Issues**: Check [GitHub Issues](https://github.com/yardsalemapus-dev/treasure-hunt/issues)
3. **Troubleshooting**: See [DEPLOYMENT.md#troubleshooting](./DEPLOYMENT.md#troubleshooting)

## 📞 Contact

- **GitHub**: [@yardsalemapus-dev](https://github.com/yardsalemapus-dev)
- **Repository**: [treasure-hunt](https://github.com/yardsalemapus-dev/treasure-hunt)

## 🎯 Roadmap

### Phase 1: Core Features ✅
- Location-based search
- Listing management
- User authentication
- Route optimization

### Phase 2: Enhanced Features 🚧
- Messaging system
- User ratings and reviews
- Advanced filtering
- Mobile app

### Phase 3: Monetization
- Premium listings
- Featured placements
- Seller analytics
- Advertising

## 🙏 Acknowledgments

- Built with [React](https://react.dev/) and [Express](https://expressjs.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Database with [Drizzle ORM](https://orm.drizzle.team/)
- Authentication via [Manus OAuth](https://api.manus.im/)
- Maps powered by [Google Maps API](https://developers.google.com/maps)
- Payments with [Stripe](https://stripe.com/)

---

**Ready to get started?** See [SETUP.md](./SETUP.md) for quick start instructions or [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment guides.

**Questions?** Check the [Troubleshooting](./DEPLOYMENT.md#troubleshooting) section or open an [issue](https://github.com/yardsalemapus-dev/treasure-hunt/issues).
