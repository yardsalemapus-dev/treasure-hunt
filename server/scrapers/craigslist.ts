import axios from "axios";
import * as cheerio from "cheerio";
import { getDb } from "../db";
import { listings, scraperLogs } from "../../drizzle/schema";
import type { InsertListing } from "../../drizzle/schema";

/**
 * Craigslist scraper for garage sales, yard sales, and estate sales
 * Searches for listings in a specific area
 */

const CRAIGSLIST_BASE_URL = "https://www.craigslist.org";
const SEARCH_TERMS = ["garage sale", "yard sale", "estate sale", "moving sale"];

interface CraigslistListing {
  title: string;
  url: string;
  price?: string;
  location?: string;
  date?: string;
  description?: string;
}

/**
 * Parse a Craigslist search result page
 */
async function parseCraigslistPage(
  html: string,
  searchTerm: string
): Promise<CraigslistListing[]> {
  const $ = cheerio.load(html);
  const listingsArray: CraigslistListing[] = [];
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
 * Fetch listings from Craigslist for a specific area and search term
 */
async function fetchCraigslistListings(
  areaCode: string = "sfbay"
): Promise<CraigslistListing[]> {
  const allListings: CraigslistListing[] = [];

  for (const searchTerm of SEARCH_TERMS) {
    try {
      const searchUrl = `${CRAIGSLIST_BASE_URL}/${areaCode}/search/sss?query=${encodeURIComponent(
        searchTerm
      )}&sort=date&max_price=&min_price=`;

      console.log(`[Craigslist] Fetching: ${searchUrl}`);

      const response = await axios.get(searchUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        timeout: 10000,
      });

      const parsedListings = await parseCraigslistPage(response.data, searchTerm);
      allListings.push(...parsedListings);

      // Polite delay between requests
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`[Craigslist] Error fetching ${searchTerm}:`, error);
    }
  }

  return allListings;
}

/**
 * Geocode an address to get latitude and longitude
 * Uses OpenStreetMap Nominatim API (free, no API key required)
 */
async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const response = await axios.get("https://nominatim.openstreetmap.org/search", {
      params: {
        q: address,
        format: "json",
        limit: 1,
      },
      headers: {
        "User-Agent": "TreasureHunt-Scraper/1.0",
      },
      timeout: 5000,
    });

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
 * Determine sale category from title and description
 */
function determineSaleCategory(
  title: string,
  description?: string
): "garage_sale" | "yard_sale" | "estate_sale" | "other" {
  const combined = `${title} ${description || ""}`.toLowerCase();

  if (combined.includes("estate")) return "estate_sale";
  if (combined.includes("garage")) return "garage_sale";
  if (combined.includes("yard")) return "yard_sale";
  if (combined.includes("moving")) return "garage_sale";

  return "other";
}

/**
 * Main scraper function
 */
export async function scrapeCreaigslist(areaCode: string = "sfbay") {
  const db = await getDb();
  if (!db) {
    console.error("[Craigslist] Database not available");
    return { success: false, error: "Database unavailable" };
  }

  const logResult = await db
    .insert(scraperLogs)
    .values({
      source: "craigslist",
      status: "started",
    });

  const logId = (logResult as any).insertId || 1;

  try {
    console.log("[Craigslist] Starting scraper...");

    const craigslistListings = await fetchCraigslistListings(areaCode);
    console.log(`[Craigslist] Found ${craigslistListings.length} listings`);

    let addedCount = 0;

    for (const listing of craigslistListings) {
      try {
        // Geocode the address
        const coords = await geocodeAddress(listing.location || areaCode);
        if (!coords) {
          console.warn(`[Craigslist] Could not geocode: ${listing.location}`);
          continue;
        }

        const category = determineSaleCategory(listing.title);

        // Insert into database
        await db.insert(listings).values({
          title: listing.title,
          description: listing.description,
          address: listing.location || areaCode,
          latitude: coords.lat.toString() as any,
          longitude: coords.lng.toString() as any,
          category,
          source: "craigslist",
          sourceUrl: listing.url,
          isActive: true,
        });

        addedCount++;
      } catch (error) {
        console.error("[Craigslist] Error inserting listing:", error);
      }
    }

    // Update scraper log
    await db
      .update(scraperLogs)
      .set({
        status: "completed",
        listingsFound: craigslistListings.length,
        listingsAdded: addedCount,
      });

    console.log(
      `[Craigslist] Scraping complete. Added ${addedCount}/${craigslistListings.length} listings`
    );

    return {
      success: true,
      listingsFound: craigslistListings.length,
      listingsAdded: addedCount,
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
