# TreasureHunt: Smart Sale Navigator - Project Plan

## Overview
A web application that helps users discover and plan efficient routes to local garage, yard, and estate sales. Features AI-powered recommendations, interactive mapping, and subscription management.

## Architecture

### Frontend Stack
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS 4
- **Mapping**: Leaflet + OpenStreetMap (no API keys required)
- **State Management**: React Query + tRPC hooks
- **UI Components**: shadcn/ui (pre-built components)

### Backend Stack
- **Server**: Express 4 + tRPC 11
- **Database**: MySQL (via Drizzle ORM)
- **Authentication**: Manus OAuth + JWT sessions
- **LLM Integration**: Built-in Forge API (GPT-4)
- **Payment**: Stripe API
- **File Storage**: S3 (for scraped data exports)

### Key Services
- **Scraper Engine**: Node.js-based scrapers for Craigslist, Facebook Marketplace, EstateSales.net
- **Route Optimizer**: Haversine distance calculation + greedy TSP approximation
- **Amenity Mapper**: Integration with OpenStreetMap Nominatim API for bathrooms/refreshments
- **AI Manager**: LLM-powered listing categorization and route suggestions

## Database Schema

### Core Tables
1. **users** - User accounts with trial tracking
2. **subscriptions** - Subscription status and Stripe integration
3. **listings** - Scraped sales (garage, yard, estate)
4. **user_listings** - User-submitted sales
5. **saved_routes** - User's saved route plans
6. **route_items** - Individual items in a route
7. **amenities** - Cached bathroom/refreshment locations
8. **scraper_logs** - Audit trail for scraper runs

## Feature Breakdown

### Phase 1: Foundation
- [x] Project initialization with web-db-user scaffold
- [ ] Database schema design and migration
- [ ] User authentication with trial tracking
- [ ] Stripe integration setup

### Phase 2: Data Collection
- [ ] Craigslist scraper (garage/yard/estate sales)
- [ ] Facebook Marketplace scraper
- [ ] EstateSales.net scraper
- [ ] Keyword filtering and validation

### Phase 3: Core Features
- [ ] Interactive map with Leaflet/OpenStreetMap
- [ ] Listing display and filtering
- [ ] Route optimization algorithm
- [ ] Amenity layer (bathrooms, refreshments)

### Phase 4: AI & Intelligence
- [ ] LLM-powered listing categorization
- [ ] Route suggestion engine
- [ ] Smart ordering based on sale type

### Phase 5: Monetization
- [ ] Free tier: single item search
- [ ] Free tier: user-submitted listings
- [ ] Trial period management
- [ ] Subscription enforcement

### Phase 6: Polish & Testing
- [ ] Admin dashboard
- [ ] Terminal-based testing tools
- [ ] End-to-end testing
- [ ] Performance optimization

## Development Workflow

### Local Development
```bash
# Start dev server
pnpm dev

# Run scrapers manually
node scripts/scrape-craigslist.mjs
node scripts/scrape-facebook.mjs
node scripts/scrape-estatesales.mjs

# Run tests
pnpm test

# Database migrations
pnpm db:push
```

### Testing Strategy
- Unit tests for scrapers, route optimization, and AI categorization
- Integration tests for API endpoints
- E2E tests for user flows (signup → trial → payment)
- Manual testing via admin dashboard

## Timeline & Milestones
1. **Week 1**: Database schema + authentication + Stripe setup
2. **Week 2**: Scraper engine development
3. **Week 3**: Map UI + route optimization
4. **Week 4**: AI integration + free tier features
5. **Week 5**: Testing, polish, and deployment

## Success Metrics
- Scrapers successfully collect 100+ listings per run
- Route optimization completes in <2 seconds for 20 locations
- Trial-to-paid conversion rate >10%
- 99.9% uptime for map and search features
- <500ms page load time

## Risk Mitigation
- **Scraper blocking**: Implement rotating proxies and user-agent rotation
- **Payment failures**: Robust error handling and retry logic for Stripe
- **Route optimization timeout**: Set max locations limit (50) with fallback to simple ordering
- **Map performance**: Implement marker clustering for 1000+ locations
