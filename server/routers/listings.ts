import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { listings, savedRoutes } from "../../drizzle/schema";
import { eq, and, inArray } from "drizzle-orm";

export const listingsRouter = router({
  /**
   * Get all active listings, optionally filtered by category
   */
  getAll: publicProcedure
    .input(
      z.object({
        categories: z.array(z.string()).optional(),
        limit: z.number().default(100),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database unavailable");
      }

      const results = await db
        .select()
        .from(listings)
        .where(
          input.categories && input.categories.length > 0
            ? and(
                eq(listings.isActive, true),
                inArray(listings.category, input.categories as any)
              )
            : eq(listings.isActive, true)
        )
        .limit(input.limit);
      return results;
    }),

  /**
   * Get listings near a specific location
   */
  getNearby: publicProcedure
    .input(
      z.object({
        latitude: z.number(),
        longitude: z.number(),
        radiusMiles: z.number().default(25),
        categories: z.array(z.string()).optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database unavailable");
      }

      // Get all active listings
      const allListings = await db
        .select()
        .from(listings)
        .where(
          input.categories && input.categories.length > 0
            ? and(
                eq(listings.isActive, true),
                inArray(listings.category, input.categories as any)
              )
            : eq(listings.isActive, true)
        );

      // Filter by distance using Haversine formula
      const R = 3959; // Earth's radius in miles
      const filteredListings = allListings.filter((listing) => {
        const lat1 = (input.latitude * Math.PI) / 180;
        const lat2 = (parseFloat(listing.latitude as any) * Math.PI) / 180;
        const dLat =
          ((parseFloat(listing.latitude as any) - input.latitude) * Math.PI) /
          180;
        const dLon =
          ((parseFloat(listing.longitude as any) - input.longitude) * Math.PI) /
          180;

        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1) *
            Math.cos(lat2) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return distance <= input.radiusMiles;
      });

      return filteredListings;
    }),

  /**
   * Get a single listing by ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database unavailable");
      }

      const result = await db
        .select()
        .from(listings)
        .where(eq(listings.id, input.id))
        .limit(1);

      return result.length > 0 ? result[0] : null;
    }),

  /**
   * Save a route for a logged-in user
   */
  saveRoute: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        listingIds: z.array(z.number()),
        totalDistance: z.number(),
        estimatedTime: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database unavailable");
      }

      const result = await db.insert(savedRoutes).values({
        userId: ctx.user.id,
        name: input.name,
        listingIds: input.listingIds,
        totalDistance: input.totalDistance.toString() as any,
        estimatedTime: input.estimatedTime,
      });

      return result;
    }),

  /**
   * Get saved routes for a logged-in user
   */
  getSavedRoutes: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database unavailable");
    }

    const routes = await db
      .select()
      .from(savedRoutes)
      .where(eq(savedRoutes.userId, ctx.user.id));

    return routes;
  }),

  /**
   * Delete a saved route
   */
  deleteRoute: protectedProcedure
    .input(z.object({ routeId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database unavailable");
      }

      // Verify ownership
      const route = await db
        .select()
        .from(savedRoutes)
        .where(eq(savedRoutes.id, input.routeId))
        .limit(1);

      if (route.length === 0 || route[0].userId !== ctx.user.id) {
        throw new Error("Route not found or unauthorized");
      }

      await db.delete(savedRoutes).where(eq(savedRoutes.id, input.routeId));

      return { success: true };
    }),
});
