import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { listings } from "../../drizzle/schema";
import { and, or, gte, lte, like, eq, inArray } from "drizzle-orm";

export const searchRouter = router({
  /**
   * Search listings by address or title
   */
  searchListings: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        radiusMiles: z.number().default(25),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database unavailable");
      }

      // Search by address or title
      const results = await db
        .select()
        .from(listings)
        .where(
          or(
            like(listings.address, `%${input.query}%`),
            like(listings.title, `%${input.query}%`),
            like(listings.description, `%${input.query}%`)
          )
        )
        .limit(50);

      return results;
    }),

  /**
   * Advanced filter for listings
   */
  filterListings: publicProcedure
    .input(
      z.object({
        categories: z.array(z.string()).optional(),
        amenities: z.array(z.string()).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        radiusMiles: z.number().default(25),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database unavailable");
      }

      const conditions: any[] = [];

      // Filter by categories
      if (input.categories && input.categories.length > 0) {
        conditions.push(
          inArray(
            listings.category,
            input.categories as any[]
          )
        );
      }

      // Filter by date range
      if (input.startDate) {
        conditions.push(gte(listings.saleDate, new Date(input.startDate)));
      }
      if (input.endDate) {
        conditions.push(lte(listings.saleDate, new Date(input.endDate)));
      }

      // Filter by amenities (check if amenity string is in the description field)
      if (input.amenities && input.amenities.length > 0) {
        const amenityConditions = input.amenities.map((amenity) =>
          like(listings.description, `%${amenity}%`)
        );
        if (amenityConditions.length > 0) {
          conditions.push(or(...amenityConditions));
        }
      }

      // Build query with conditions
      let query = db.select().from(listings);
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const results = await query
        .limit(input.limit)
        .offset(input.offset);

      return results;
    }),

  /**
   * Get nearby listings based on geolocation
   */
  getNearbyListings: publicProcedure
    .input(
      z.object({
        latitude: z.number(),
        longitude: z.number(),
        radiusMiles: z.number().default(5),
        limit: z.number().default(50),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database unavailable");
      }

      // Get all listings (in production, use a geospatial query)
      const allListings = await db.select().from(listings);

      // Filter by distance using Haversine formula
      const nearby = allListings.filter((listing) => {
        const distance = calculateDistance(
          input.latitude,
          input.longitude,
          Number(listing.latitude),
          Number(listing.longitude)
        );
        return distance <= input.radiusMiles;
      });

      return nearby.slice(0, input.limit);
    }),

  /**
   * Get trending/popular listings based on views and reviews
   */
  getTrendingListings: publicProcedure
    .input(
      z.object({
        limit: z.number().default(10),
        days: z.number().default(7),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database unavailable");
      }

      // Get listings from the last N days
      const cutoffDate = new Date();
      const daysAgo = Math.floor(input.days);
      cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

      const results = await db
        .select()
        .from(listings)
        .where(gte(listings.createdAt, cutoffDate))
        .limit(input.limit);

      return results;
    }),
});

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in miles
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
