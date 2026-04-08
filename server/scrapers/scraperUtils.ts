import { getDb } from "../db";
import { listings, scraperLogs, scraperJobs } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export interface ScrapedListing {
  title: string;
  description?: string;
  address: string;
  latitude: number;
  longitude: number;
  saleDate?: Date;
  startTime?: string;
  endTime?: string;
  category: "garage_sale" | "yard_sale" | "estate_sale" | "multi_family_sale" | "block_sale" | "free_stuff" | "other";
  source: "craigslist" | "facebook" | "ebay" | "nextdoor" | "estatesales" | "user_submitted";
  sourceUrl: string;
  imageUrl?: string;
}

export class ScraperBase {
  protected source: "craigslist" | "facebook" | "ebay" | "nextdoor" | "estatesales";
  protected jobId?: number;

  constructor(source: "craigslist" | "facebook" | "ebay" | "nextdoor" | "estatesales") {
    this.source = source;
  }

  async startJob(region?: string): Promise<number> {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    await db.insert(scraperJobs).values({
      source: this.source,
      status: "running",
      region,
    });

    // Get the last inserted job
    const jobs = await db
      .select()
      .from(scraperJobs)
      .orderBy((t) => t.id)
      .limit(1);

    this.jobId = jobs[0]?.id || 0;
    return this.jobId;
  }

  async completeJob(listingsFound: number, listingsAdded: number, listingsUpdated: number = 0): Promise<void> {
    if (!this.jobId) return;

    const db = await getDb();
    if (!db) return;

    await db
      .update(scraperJobs)
      .set({
        status: "completed",
        listingsFound,
        listingsAdded,
        listingsUpdated,
        completedAt: new Date(),
      })
      .where(eq(scraperJobs.id, this.jobId));
  }

  async failJob(error: string): Promise<void> {
    if (!this.jobId) return;

    const db = await getDb();
    if (!db) return;

    await db
      .update(scraperJobs)
      .set({
        status: "failed",
        errorMessage: error,
        completedAt: new Date(),
      })
      .where(eq(scraperJobs.id, this.jobId));
  }

  async saveListing(listing: ScrapedListing): Promise<boolean> {
    const db = await getDb();
    if (!db) return false;

    try {
      // Check if listing already exists by source URL
      const existing = await db
        .select()
        .from(listings)
        .where(eq(listings.sourceUrl, listing.sourceUrl));

      if (existing.length > 0) {
        // Update existing listing
        await db
          .update(listings)
          .set({
            title: listing.title,
            description: listing.description,
            address: listing.address,
            latitude: listing.latitude.toString(),
            longitude: listing.longitude.toString(),
            saleDate: listing.saleDate,
            startTime: listing.startTime,
            endTime: listing.endTime,
            category: listing.category,
            imageUrl: listing.imageUrl,
            updatedAt: new Date(),
          })
          .where(eq(listings.sourceUrl, listing.sourceUrl));
        return false; // Not a new listing
      }

      // Insert new listing
      await db.insert(listings).values({
        title: listing.title,
        description: listing.description,
        address: listing.address,
        latitude: listing.latitude.toString(),
        longitude: listing.longitude.toString(),
        saleDate: listing.saleDate,
        startTime: listing.startTime,
        endTime: listing.endTime,
        category: listing.category,
        source: listing.source,
        sourceUrl: listing.sourceUrl,
        imageUrl: listing.imageUrl,
        isActive: true,
      });

      return true; // New listing added
    } catch (error) {
      console.error("Failed to save listing:", error);
      return false;
    }
  }

  async logScrape(status: "started" | "completed" | "failed", listingsFound: number = 0, listingsAdded: number = 0, error?: string) {
    const db = await getDb();
    if (!db) return;

    await db.insert(scraperLogs).values({
      source: this.source,
      status,
      listingsFound,
      listingsAdded,
      errorMessage: error,
    });
  }

  // Utility to parse date strings
  protected parseDate(dateStr?: string): Date | undefined {
    if (!dateStr) return undefined;
    try {
      return new Date(dateStr);
    } catch {
      return undefined;
    }
  }

  // Utility to extract coordinates from address (requires geocoding)
  protected async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    // This would integrate with Google Maps Geocoding API
    // For now, return null - implement with actual geocoding service
    return null;
  }

  // Utility to clean text
  protected cleanText(text: string): string {
    return text.trim().replace(/\s+/g, " ");
  }
}
