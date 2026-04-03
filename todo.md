# TreasureHunt Project TODO

## Phase 1: Database & Authentication
- [ ] Design and implement database schema (users, listings, subscriptions, routes)
- [ ] Set up Drizzle ORM migrations
- [ ] Implement user trial tracking (7-day free trial)
- [ ] Create authentication middleware and protected procedures
- [ ] Add user profile management endpoints

## Phase 2: Stripe Integration
- [x] Configure Stripe API keys and webhooks
- [x] Implement subscription creation and management
- [x] Build trial expiration and payment collection flow
- [x] Add subscription status checking in protected procedures
- [ ] Create billing history and invoice tracking

## Phase 3: Scraper Engine
- [x] Build geolocation service to detect phone location
- [x] Build Craigslist scraper for garage sales
- [x] Build Craigslist scraper for yard sales
- [x] Build Craigslist scraper for multi-family sales
- [x] Build Craigslist scraper for block sales
- [x] Build Craigslist scraper for estate sales
- [x] Build Craigslist scraper for free stuff
- [ ] Build Facebook Marketplace scraper for all sale types
- [x] Implement location-based filtering (radius from phone location)
- [x] Add scraper scheduling and error handling
- [x] Create scraper logs and audit trail
- [x] Write unit tests for scraper logic

## Phase 4: Map & UI Foundation
- [x] Set up Leaflet/OpenStreetMap integration
- [x] Create map component with marker display
- [x] Implement listing card component
- [x] Build search and filter interface
- [x] Add listing detail modal/page
- [ ] Implement map clustering for performance

## Phase 5: Route Optimization
- [x] Build route optimization algorithm (TSP with 2-opt)
- [x] Create route calculation API endpoints
- [x] Implement distance and time estimation
- [x] Add route saving for authenticated users
- [x] Write comprehensive unit tests (9 tests)

## Phase 6: Facebook Marketplace Scraper
- [x] Build Facebook Marketplace scraper
- [x] Implement multi-type sale detection
- [x] Add category determination logic
- [x] Create database conversion helpers

## Phase 7: Explorer Page
- [x] Build main Explorer page with geolocation
- [x] Implement category filters
- [x] Add listing selection and route planning
- [x] Create route summary display
- [x] Integrate map and route optimization

## Phase 5: Route Optimization
- [ ] Implement Haversine distance calculation
- [ ] Build greedy TSP approximation algorithm
- [ ] Create route optimization endpoint
- [ ] Add route preview on map
- [ ] Implement route saving and history
- [ ] Write unit tests for optimization algorithm

## Phase 6: Amenity Layer
- [ ] Integrate OpenStreetMap Nominatim API
- [ ] Build bathroom location finder
- [ ] Build refreshment location finder (gas stations, coffee, restaurants)
- [ ] Display amenities on map along route
- [ ] Cache amenity data for performance
- [ ] Create amenity filtering options

## Phase 7: AI-Powered Features
- [ ] Implement LLM-based listing categorization
- [ ] Build AI route suggestion engine
- [ ] Create smart ordering based on sale type and location
- [ ] Add user preference learning
- [ ] Implement AI-powered search recommendations
- [ ] Write tests for AI categorization accuracy

## Phase 8: Free Tier Features
- [ ] Build single item search (no login required)
- [ ] Implement user-submitted listing form
- [ ] Create listing submission validation
- [ ] Add admin approval workflow for user listings
- [ ] Display user-submitted listings on map
- [ ] Implement free tier access controls

## Phase 9: Frontend Pages & Flows
- [x] Create landing page with interactive map background
- [x] Implement geolocation permission request on landing
- [x] Add dynamic sales count display (nearby sales)
- [x] Build filter toggles (bathrooms, refreshments, categories)
- [x] Implement 3-day trial + $7.99/month Stripe checkout
- [x] Build authentication pages (login/signup)
- [x] Create main dashboard/map page
- [x] Build route planning page
- [x] Create user profile and account settings page
- [x] Build subscription management page
- [ ] Create admin dashboard

## Phase 10: Route Optimization & Sharing Features
- [x] Add thrift stores and antique stores to filter toggles
- [x] Build route optimization UI with multi-select markers
- [x] Implement route generation with turn-by-turn directions
- [x] Add saved routes feature with database persistence
- [x] Implement social sharing (link, Facebook, Twitter)
- [x] Add route statistics (total distance, estimated time, number of stops)

## Phase 10: Admin & Testing Tools
- [ ] Build admin dashboard for scraper management
- [ ] Create manual scraper trigger buttons
- [ ] Build listing management interface
- [ ] Create user management tools
- [ ] Build subscription override tools
- [ ] Create terminal-based CLI for testing
- [ ] Add database seeding scripts

## Phase 11: Testing & Quality Assurance
- [ ] Write unit tests for all scrapers
- [ ] Write integration tests for API endpoints
- [ ] Write E2E tests for user flows
- [ ] Test trial-to-paid conversion flow
- [ ] Test route optimization with various inputs
- [ ] Performance testing (load, response times)
- [ ] Security testing (auth, data validation)

## Phase 12: Deployment & Documentation
- [ ] Create deployment guide
- [ ] Set up CI/CD pipeline
- [ ] Create API documentation
- [ ] Write user guide and FAQ
- [ ] Set up monitoring and alerting
- [ ] Create backup and recovery procedures
- [ ] Final end-to-end testing

## Known Issues & Blockers
- None yet

## Completed Features
- [x] Project initialization with web-db-user scaffold
