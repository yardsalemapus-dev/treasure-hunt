import axios from "axios";
import * as cheerio from "cheerio";

export interface FacebookListing {
  title: string;
  description: string;
  price?: string;
  location: string;
  url: string;
  imageUrl?: string;
  category: string;
  source: "facebook";
  scrapedAt: Date;
}

const FACEBOOK_MARKETPLACE_URL = "https://www.facebook.com/marketplace";

const SALE_KEYWORDS = {
  garage_sale: [
    "garage sale",
    "garage sales",
    "yard sale",
    "rummage sale",
    "moving sale",
  ],
  yard_sale: ["yard sale", "yard sales", "lawn sale", "patio sale"],
  estate_sale: ["estate sale", "estate sales", "liquidation", "downsizing"],
  multi_family_sale: [
    "multi family",
    "multi-family",
    "community sale",
    "neighborhood sale",
    "group sale",
  ],
  block_sale: ["block sale", "block party", "street sale", "community event"],
  free_stuff: ["free", "free stuff", "free items", "giveaway", "free to good home"],
};

/**
 * Determine sale category based on title and description
 */
function determineSaleCategory(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();

  for (const [category, keywords] of Object.entries(SALE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return category;
      }
    }
  }

  return "garage_sale"; // Default category
}

/**
 * Scrape Facebook Marketplace for sales
 * Note: This is a simplified implementation as Facebook has anti-scraping measures
 * In production, consider using Facebook's official API or a proxy service
 */
export async function scrapeFacebookMarketplace(
  searchQuery: string = "garage sale",
  location: string = "United States"
): Promise<FacebookListing[]> {
  const listings: FacebookListing[] = [];

  try {
    // Note: Direct Facebook scraping is limited due to JavaScript rendering
    // This implementation uses a simplified approach
    // For production, use Playwright or Facebook's Graph API

    // Construct search URL
    const searchUrl = `${FACEBOOK_MARKETPLACE_URL}/search/?query=${encodeURIComponent(searchQuery)}&location=${encodeURIComponent(location)}`;

    // Make request with browser-like headers
    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      timeout: 10000,
    });

    // Parse HTML (note: Facebook heavily uses JavaScript, so this may have limited results)
    const $ = cheerio.load(response.data);

    // Extract listings (selectors may need updating as Facebook changes their DOM)
    $("[data-testid='marketplace_feed_item']").each((index, element) => {
      try {
        const titleElement = $(element).find("[data-testid='marketplace_item_title']");
        const title = titleElement.text().trim();

        const priceElement = $(element).find("[data-testid='marketplace_item_price']");
        const price = priceElement.text().trim();

        const locationElement = $(element).find(
          "[data-testid='marketplace_item_location']"
        );
        const itemLocation = locationElement.text().trim();

        const linkElement = $(element).find("a[href*='/marketplace/item/']");
        const url = linkElement.attr("href") || "";

        const imageElement = $(element).find("img");
        const imageUrl = imageElement.attr("src");

        if (title && url) {
          const category = determineSaleCategory(title, "");

          listings.push({
            title,
            description: `${price ? "Price: " + price : ""} - Location: ${itemLocation}`,
            price,
            location: itemLocation,
            url: `https://www.facebook.com${url}`,
            imageUrl,
            category,
            source: "facebook",
            scrapedAt: new Date(),
          });
        }
      } catch (error) {
        console.error("Error parsing individual listing:", error);
      }
    });

    console.log(`[Facebook Scraper] Found ${listings.length} listings for "${searchQuery}"`);
  } catch (error) {
    console.error("[Facebook Scraper] Error scraping Facebook Marketplace:", error);
    // Return empty array on error rather than throwing
    // This allows the scraper to continue with other sources
  }

  return listings;
}

/**
 * Scrape multiple sale types from Facebook Marketplace
 */
export async function scrapeFacebookMultipleSaleTypes(
  location: string = "United States"
): Promise<FacebookListing[]> {
  const allListings: FacebookListing[] = [];

  const saleTypes = [
    "garage sale",
    "yard sale",
    "estate sale",
    "multi family sale",
    "block sale",
    "free stuff",
  ];

  for (const saleType of saleTypes) {
    try {
      const listings = await scrapeFacebookMarketplace(saleType, location);
      allListings.push(...listings);
      
      // Add delay between requests to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`[Facebook Scraper] Error scraping ${saleType}:`, error);
    }
  }

  return allListings;
}

/**
 * Convert Facebook listing to database format
 */
export function convertFacebookListingToDatabase(listing: FacebookListing) {
  return {
    title: listing.title,
    description: listing.description,
    address: listing.location,
    latitude: "0", // Facebook doesn't provide coordinates; would need geocoding
    longitude: "0",
    category: listing.category,
    source: "facebook",
    sourceUrl: listing.url,
    imageUrl: listing.imageUrl,
    isActive: true,
    scrapedAt: listing.scrapedAt,
  };
}
