import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { listings, savedRoutes } from "../../drizzle/schema";
import { eq, inArray } from "drizzle-orm";
import { generateOptimizedRoutes, Location, solveTSP, calculateRouteDistance, estimateRouteTime } from "../services/routeOptimizer";

export const routesRouter = router({
  /**
   * Generate optimized routes from nearby listings
   */
  generateRoutes: publicProcedure
    .input(
      z.object({
        latitude: z.number(),
        longitude: z.number(),
        radiusMiles: z.number().default(10),
        clusterRadiusMiles: z.number().default(2),
      })
    )
    .query(async ({ input }: any) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database unavailable");
      }

      try {
        // Get all active listings
        const allListings = await db.select().from(listings).where(eq(listings.isActive, true));

        // Filter by distance
        const nearbyListings = allListings.filter((listing) => {
          const lat1 = input.latitude;
          const lon1 = input.longitude;
          const lat2 = Number(listing.latitude);
          const lon2 = Number(listing.longitude);

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
          const distance = R * c;

          return distance <= input.radiusMiles;
        });

        if (nearbyListings.length === 0) {
          return {
            routes: [],
            message: "No listings found within the specified radius",
          };
        }

        // Convert to Location format
        const locations: Location[] = nearbyListings.map((l) => ({
          id: l.id,
          latitude: Number(l.latitude),
          longitude: Number(l.longitude),
          title: l.title,
        }));

        // Generate optimized routes
        const routes = generateOptimizedRoutes(locations, input.clusterRadiusMiles);

        return {
          routes,
          listingsCount: nearbyListings.length,
          routesCount: routes.length,
        };
      } catch (error) {
        console.error("Failed to generate routes:", error);
        throw new Error("Failed to generate routes");
      }
    }),

  /**
   * Optimize route with listings and starting point
   */
  optimizeRoute: publicProcedure
    .input(
      z.object({
        listings: z.array(
          z.object({
            id: z.number(),
            latitude: z.number(),
            longitude: z.number(),
            title: z.string(),
          })
        ),
        startPoint: z.object({
          lat: z.number(),
          lng: z.number(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      if (input.listings.length === 0) {
        return {
          listings: [],
          totalDistance: 0,
          estimatedTime: 0,
          waypoints: [],
        };
      }

      // Convert to Location format
      const locations: Location[] = input.listings.map((listing) => ({
        id: listing.id,
        latitude: listing.latitude,
        longitude: listing.longitude,
        title: listing.title,
      }));

      // Optimize route using TSP
      const optimizedOrder = solveTSP(locations);
      const totalDistance = calculateRouteDistance(locations, optimizedOrder);
      const estimatedTime = estimateRouteTime(totalDistance, locations.length);

      return {
        listings: input.listings,
        totalDistance,
        estimatedTime,
        waypoints: optimizedOrder,
      };
    }),

  /**
   * Save route for authenticated user
   */
  saveRoute: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        listingIds: z.array(z.number()),
        optimizedOrder: z.array(z.number()),
        totalDistance: z.number(),
        estimatedTime: z.number(),
      })
    )
    .mutation(async ({ input, ctx }: any) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database unavailable");
      }

      try {
        const result = await db.insert(savedRoutes).values({
          userId: ctx.user.id,
          name: input.name,
          description: input.description,
          listingIds: input.listingIds,
          optimizedOrder: input.optimizedOrder,
          totalDistance: String(input.totalDistance),
          estimatedTime: input.estimatedTime,
        });

        return {
          success: true,
          message: "Route saved successfully",
        };
      } catch (error) {
        console.error("Failed to save route:", error);
        throw new Error("Failed to save route");
      }
    }),

  /**
   * Get all saved routes for authenticated user
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
   * Get a specific route with listings
   */
  getRouteDetails: protectedProcedure
    .input(z.object({ routeId: z.number() }))
    .query(async ({ ctx, input }: any) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database unavailable");
      }

      try {
        const [route] = await db
          .select()
          .from(savedRoutes)
          .where(eq(savedRoutes.id, input.routeId));

        if (!route || route.userId !== ctx.user.id) {
          throw new Error("Route not found or unauthorized");
        }

        // Get listings for this route
        const listingIds = Array.isArray(route.listingIds) ? route.listingIds : [];
        const routeListings = await db
          .select()
          .from(listings)
          .where(inArray(listings.id, listingIds));

        return {
          route: {
            ...route,
            totalDistance: Number(route.totalDistance),
            listingIds,
            optimizedOrder: Array.isArray(route.optimizedOrder) ? route.optimizedOrder : [],
          },
          listings: routeListings,
        };
      } catch (error) {
        console.error("Failed to get route details:", error);
        throw new Error("Failed to get route details");
      }
    }),

  /**
   * Delete saved route
   */
  deleteRoute: protectedProcedure
    .input(z.object({ routeId: z.number() }))
    .mutation(async ({ input, ctx }: any) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database unavailable");
      }

      try {
        // Verify ownership
        const [route] = await db
          .select()
          .from(savedRoutes)
          .where(eq(savedRoutes.id, input.routeId));

        if (!route || route.userId !== ctx.user.id) {
          throw new Error("Route not found or unauthorized");
        }

        await db.delete(savedRoutes).where(eq(savedRoutes.id, input.routeId));

        return { success: true, message: "Route deleted successfully" };
      } catch (error) {
        console.error("Failed to delete route:", error);
        throw new Error("Failed to delete route");
      }
    }),

  /**
   * Update route name and description
   */
  updateRoute: protectedProcedure
    .input(
      z.object({
        routeId: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database unavailable");
      }

      try {
        // Verify ownership
        const [route] = await db
          .select()
          .from(savedRoutes)
          .where(eq(savedRoutes.id, input.routeId));

        if (!route || route.userId !== ctx.user.id) {
          throw new Error("Route not found or unauthorized");
        }

        const updateData: any = {};
        if (input.name) updateData.name = input.name;
        if (input.description) updateData.description = input.description;

        await db.update(savedRoutes).set(updateData).where(eq(savedRoutes.id, input.routeId));

        return { success: true, message: "Route updated successfully" };
      } catch (error) {
        console.error("Failed to update route:", error);
        throw new Error("Failed to update route");
      }
    })
});
