import axios from "axios";
import * as cheerio from "cheerio";
import { getDb } from "../db";
import { listings, scraperLogs } from "../../drizzle/schema";
import { calculateDistance } from "../geolocation";
import type { InsertListing } from "../../drizzle/schema";

/**
 * Enhanced Craigslist scraper supporting multiple sale types
 */

const CRAIGSLIST_BASE_URL = "https://www.craigslist.org";

export type SaleType =
  | "garage_sale"
  | "yard_sale"
  | "multi_family_sale"
  | "block_sale"
  | "estate_sale"
  | "free_stuff";

interface CraigslistListingRaw {
  title: string;
  url: string;
  price?: string;
  location?: string;
  date?: string;
  description?: string;
  postId?: string;
}

/**
 * Search terms for each sale type
 */
const SEARCH_TERMS: Record<SaleType, string[]> = {
  garage_sale: ["garage sale"],
  yard_sale: ["yard sale"],
  multi_family_sale: ["multi family sale", "multi-family sale"],
  block_sale: ["block sale", "community sale"],
  estate_sale: ["estate sale"],
  free_stuff: ["free stuff", "free items", "curb alert"],
};

/**
 * Parse Craigslist search results
 */
async function parseCraigslistPage(html: string): Promise<CraigslistListingRaw[]> {
  const $ = cheerio.load(html);
  const listingsArray: CraigslistListingRaw[] = [];

  $("ol.rows li").each((_: number, element: any) => {
    try {
      const titleEl = $(element).find("span.titlestring");
      const title = titleEl.text().trim();
      const url = titleEl.parent().attr("href") || "";
      const priceEl = $(element).find("span.priceinfo");
      const price = priceEl.text().trim();
      const locationEl = $(element).find("small");
      const location = locationEl.text().trim();
      const dateEl = $(element).find("time");
      const date = dateEl.attr("datetime");

      if (title && url) {
        listingsArray.push({
          title,
          url: url.startsWith("http") ? url : `${CRAIGSLIST_BASE_URL}${url}`,
          price: price || undefined,
          location: location || undefined,
          date: date || undefined,
        });
      }
    } catch (error) {
      console.error("[Craigslist] Error parsing listing:", error);
    }
  });

  return listingsArray;
}

/**
 * Fetch listings from Craigslist for a specific sale type
 */
async function fetchCraigslistListings(
  areaCode: string,
  saleType: SaleType
): Promise<CraigslistListingRaw[]> {
  const allListings: CraigslistListingRaw[] = [];
  const searchTerms = SEARCH_TERMS[saleType];

  for (const searchTerm of searchTerms) {
    try {
      const searchUrl = `${CRAIGSLIST_BASE_URL}/${areaCode}/search/sss?query=${encodeURIComponent(
        searchTerm
      )}&sort=date`;

      console.log(`[Craigslist] Fetching ${saleType}: ${searchUrl}`);

      const response = await axios.get(searchUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        timeout: 10000,
      });

      const parsedListings = await parseCraigslistPage(response.data);
      allListings.push(...parsedListings);

      // Polite delay between requests
      await new Promise((resolve) => setTimeout(resolve, 1500));
    } catch (error) {
      console.error(`[Craigslist] Error fetching ${saleType}:`, error);
    }
  }

  return allListings;
}

/**
 * Geocode an address using OpenStreetMap Nominatim
 */
async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const response = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: {
          q: address,
          format: "json",
          limit: 1,
        },
        headers: {
          "User-Agent": "TreasureHunt-Scraper/1.0",
        },
        timeout: 5000,
      }
    );

    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
      };
    }
  } catch (error) {
    console.error(`[Geocoding] Error geocoding address "${address}":`, error);
  }

  return null;
}

/**
 * Filter listings by distance from user location
 */
function filterByDistance(
  listings: InsertListing[],
  userLat: number,
  userLng: number,
  radiusMiles: number = 25
): InsertListing[] {
  return listings.filter((listing) => {
    const distance = calculateDistance(
      userLat,
      userLng,
      parseFloat(listing.latitude as any),
      parseFloat(listing.longitude as any)
    );
    return distance <= radiusMiles;
  });
}

/**
 * Main scraper function for all sale types
 */
export async function scrapeCreaigslistEnhanced(
  areaCode: string,
  userLatitude?: number,
  userLongitude?: number,
  radiusMiles: number = 25
) {
  const db = await getDb();
  if (!db) {
    console.error("[Craigslist] Database not available");
    return { success: false, error: "Database unavailable" };
  }

  const logResult = await db.insert(scraperLogs).values({
    source: "craigslist",
    status: "started",
  });

  const logId = (logResult as any).insertId || 1;

  try {
    console.log(
      `[Craigslist] Starting enhanced scraper for area: ${areaCode}`
    );

    let totalListings = 0;
    let totalAdded = 0;

    // Scrape each sale type
    for (const saleType of Object.keys(SEARCH_TERMS) as SaleType[]) {
      console.log(`[Craigslist] Scraping ${saleType}...`);

      const craigslistListings = await fetchCraigslistListings(
        areaCode,
        saleType
      );
      totalListings += craigslistListings.length;

      for (const listing of craigslistListings) {
        try {
          // Geocode the address
          const coords = await geocodeAddress(listing.location || areaCode);
          if (!coords) {
            console.warn(
              `[Craigslist] Could not geocode: ${listing.location}`
            );
            continue;
          }

          // Filter by distance if user location provided
          if (userLatitude !== undefined && userLongitude !== undefined) {
            const distance = calculateDistance(
              userLatitude,
              userLongitude,
              coords.lat,
              coords.lng
            );
            if (distance > radiusMiles) {
              console.log(
                `[Craigslist] Skipping listing ${distance.toFixed(1)} miles away`
              );
              continue;
            }
          }

          // Insert into database
          await db.insert(listings).values({
            title: listing.title,
            description: listing.description,
            address: listing.location || areaCode,
            latitude: coords.lat.toString() as any,
            longitude: coords.lng.toString() as any,
            category: saleType,
            source: "craigslist",
            sourceUrl: listing.url,
            isActive: true,
          });

          totalAdded++;
        } catch (error) {
          console.error("[Craigslist] Error inserting listing:", error);
        }
      }
    }

    // Update scraper log
    await db
      .update(scraperLogs)
      .set({
        status: "completed",
        listingsFound: totalListings,
        listingsAdded: totalAdded,
      });

    console.log(
      `[Craigslist] Scraping complete. Added ${totalAdded}/${totalListings} listings`
    );

    return {
      success: true,
      listingsFound: totalListings,
      listingsAdded: totalAdded,
    };
  } catch (error) {
    console.error("[Craigslist] Scraper error:", error);

    await db
      .update(scraperLogs)
      .set({
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
