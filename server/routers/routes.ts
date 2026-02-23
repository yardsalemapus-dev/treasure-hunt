import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { listings, savedRoutes } from "../../drizzle/schema";
import { eq, inArray } from "drizzle-orm";
import { optimizeRoute, calculateDistanceFromStart } from "../routeOptimization";

export const routesRouter = router({
  /**
   * Calculate optimized route for given listing IDs
   * Returns optimized order, total distance, and estimated time
   */
  calculateOptimized: publicProcedure
    .input(
      z.object({
        listingIds: z.array(z.number()),
        userLatitude: z.number().optional(),
        userLongitude: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database unavailable");
      }

      if (input.listingIds.length === 0) {
        return {
          order: [],
          totalDistance: 0,
          estimatedTime: 0,
          distanceFromStart: 0,
          listings: [],
        };
      }

      // Fetch listings
      const listingsData = await db
        .select()
        .from(listings)
        .where(inArray(listings.id, input.listingIds));

      if (listingsData.length === 0) {
        return {
          order: [],
          totalDistance: 0,
          estimatedTime: 0,
          distanceFromStart: 0,
          listings: [],
        };
      }

      // Convert to Location format for optimization
      const locations = listingsData.map((listing) => ({
        id: listing.id,
        latitude: parseFloat(listing.latitude as any),
        longitude: parseFloat(listing.longitude as any),
        name: listing.title,
      }));

      // Optimize route
      const optimized = optimizeRoute(locations);

      // Calculate distance from user location if provided
      let distanceFromStart = 0;
      if (input.userLatitude !== undefined && input.userLongitude !== undefined) {
        const firstListing = optimized.waypoints[0];
        if (firstListing) {
          distanceFromStart = calculateDistanceFromStart(
            input.userLatitude,
            input.userLongitude,
            firstListing
          );
        }
      }

      // Map back to full listing data
      const orderedListings = optimized.waypoints.map((waypoint) => {
        return listingsData.find((l) => l.id === waypoint.id);
      });

      return {
        order: optimized.order,
        totalDistance: optimized.totalDistance,
        estimatedTime: optimized.estimatedTime,
        distanceFromStart,
        listings: orderedListings,
      };
    }),

  /**
   * Save optimized route for authenticated user
   */
  saveOptimized: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        listingIds: z.array(z.number()),
        optimizedOrder: z.array(z.number()),
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
        optimizedOrder: input.optimizedOrder,
        totalDistance: input.totalDistance.toString() as any,
        estimatedTime: input.estimatedTime,
      });

      return result;
    }),

  /**
   * Get all saved routes for authenticated user
   */
  getSaved: protectedProcedure.query(async ({ ctx }) => {
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
   * Delete saved route
   */
  delete: protectedProcedure
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
