# TreasureHunt Deployment & Admin Guide

## Scrapers Installed

The application includes **4 web scrapers** for aggregating garage sales and estate sales data:

### 1. **Craigslist Scraper**
- Scrapes garage sales and estate sales listings from Craigslist
- Supports multiple regions (NYC, SF, LA, Miami, Austin, Boston)
- Extracts: title, price, location, date, description, contact info
- Frequency: Configurable (default: every 6 hours)

### 2. **Facebook Marketplace Scraper**
- Aggregates marketplace listings from Facebook
- Targets: garage sales, yard sales, estate sales
- Extracts: seller info, item descriptions, prices, images
- Handles: pagination, filters by category and location

### 3. **eBay Scraper**
- Monitors eBay for bulk lots and estate sale items
- Focuses on: local pickup items, auctions ending soon
- Extracts: item title, current bid, seller rating, shipping info
- Real-time updates on high-value items

### 4. **Nextdoor Scraper**
- Aggregates local community posts about sales
- Targets: neighborhood garage sales, free items
- Extracts: post content, location, timestamp, community engagement
- Supports: multi-language posts (English/Spanish)

---

## Admin Dashboard Access

### URL
```
http://your-domain/admin
```

### Authentication
- **Admin-only access**: Only users with `role: 'admin'` can access
- Promote a user to admin by updating their `role` field in the database to `'admin'`

### Admin Features

#### 1. **Scraper Controls**
- **Trigger Scraper**: Manually run any scraper (Craigslist, Facebook, eBay, Nextdoor)
- **Select Source**: Choose which platform to scrape
- **Select Region**: NYC, SF, LA, Miami, Austin, Boston
- **View Status**: Real-time job status and progress

#### 2. **Statistics Dashboard**
- **Total Jobs**: Cumulative scraper jobs run
- **Completed**: Successfully completed jobs
- **Failed**: Failed jobs with error details
- **Listings Found**: Total listings aggregated
- **Success Rate**: Percentage of successful scrapes

#### 3. **Configuration Management**
- **Scraper Frequency**: Set how often each scraper runs (in hours)
- **Max Listings**: Maximum listings per scrape job
- **Enable/Disable**: Toggle scrapers on/off
- **Region Settings**: Configure which regions to monitor

#### 4. **Recent Jobs**
- View last 20 scraper jobs
- Status: Running, Completed, Failed
- Listings found and added per job
- Timestamps and duration

#### 5. **Scraper Logs**
- Real-time activity log
- Error messages and debugging info
- Source, region, and results per job
- Filter by date range and status

---

## Database Setup

### Required Tables for Scrapers
```sql
-- Scraper jobs tracking
CREATE TABLE scraper_jobs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  source VARCHAR(50),
  region VARCHAR(50),
  status VARCHAR(20),
  listings_found INT,
  listings_added INT,
  error_message TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- Scraped listings
CREATE TABLE listings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  source VARCHAR(50),
  title VARCHAR(255),
  description TEXT,
  price DECIMAL(10, 2),
  location VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  sale_date DATETIME,
  contact_phone VARCHAR(20),
  contact_email VARCHAR(100),
  image_url VARCHAR(255),
  created_at TIMESTAMP
);

-- Scraper configuration
CREATE TABLE scraper_config (
  id INT PRIMARY KEY AUTO_INCREMENT,
  source VARCHAR(50),
  enabled BOOLEAN,
  frequency_hours INT,
  max_listings INT,
  last_run TIMESTAMP
);
```

---

## Environment Variables

### Required for Scrapers
```env
# Scraper Configuration
SCRAPER_CRAIGSLIST_ENABLED=true
SCRAPER_FACEBOOK_ENABLED=true
SCRAPER_EBAY_ENABLED=true
SCRAPER_NEXTDOOR_ENABLED=true

# Frequency (hours)
SCRAPER_FREQUENCY=6

# Max listings per scrape
SCRAPER_MAX_LISTINGS=100

# Proxy rotation (optional)
PROXY_URLS=http://proxy1:8080,http://proxy2:8080

# API Keys (if needed)
EBAY_API_KEY=your_ebay_api_key
FACEBOOK_ACCESS_TOKEN=your_facebook_token
```

---

## API Endpoints for Admin

### Trigger Scraper
```bash
POST /api/trpc/scrapers.triggerScraper
Content-Type: application/json

{
  "source": "craigslist",
  "region": "nyc"
}
```

### Get Scraper Jobs
```bash
GET /api/trpc/scrapers.getJobs
```

### Get Scraper Configuration
```bash
GET /api/trpc/scrapers.getConfig
```

### Update Configuration
```bash
POST /api/trpc/scrapers.updateConfig
Content-Type: application/json

{
  "source": "craigslist",
  "enabled": true,
  "frequency_hours": 6,
  "max_listings": 100
}
```

### Get Scraper Logs
```bash
GET /api/trpc/scrapers.getLogs
```

### Get Statistics
```bash
GET /api/trpc/scrapers.getStats
```

---

## Monitoring & Maintenance

### Health Checks
- Monitor scraper success rate in admin dashboard
- Check logs for errors and failures
- Verify listings are being added to database

### Common Issues

**Issue**: Scraper returns 0 listings
- **Solution**: Check region spelling, verify proxy connectivity, check API keys

**Issue**: Jobs failing with timeout
- **Solution**: Increase timeout in config, check network connectivity, reduce max_listings

**Issue**: Duplicate listings
- **Solution**: Implement deduplication by URL hash or title+date combination

### Scaling Considerations
- Use job queue (Bull, Agenda) for large-scale scraping
- Implement proxy rotation to avoid IP bans
- Add rate limiting per source
- Consider distributed scraping across multiple servers

---

## Security Notes

⚠️ **Important**: 
- Never expose scraper API keys in frontend code
- Use environment variables for all credentials
- Implement rate limiting to prevent abuse
- Add authentication to admin endpoints
- Log all admin actions for audit trail
- Validate all user inputs before scraping

---

## Support & Troubleshooting

For detailed logs, check:
- Application logs: `.manus-logs/devserver.log`
- Scraper job history: Admin Dashboard → Scraper Logs
- Database: `scraper_jobs` table

For issues, review:
1. Scraper configuration in admin dashboard
2. Recent job logs for error messages
3. Network connectivity and proxy status
4. API key validity and rate limits
