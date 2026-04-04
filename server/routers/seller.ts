import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { userListings } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const sellerRouter = router({
  // Create a new listing
  createListing: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string(),
        address: z.string(),
        category: z.string(),
        saleDate: z.date(),
        saleTime: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");

        await db.insert(userListings).values({
          userId: ctx.user.id,
          title: input.title,
          description: input.description,
          address: input.address,
          category: input.category as any,
          saleDate: input.saleDate,
          startTime: input.saleTime,
          latitude: "0",
          longitude: "0",
          isApproved: false,
        });

        return { success: true };
      } catch (error) {
        console.error("Create listing error:", error);
        return { success: false, error: String(error) };
      }
    }),

  // Get my listings
  getMyListings: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const myListings = await db
        .select()
        .from(userListings)
        .where(eq(userListings.userId, ctx.user.id));

      return myListings;
    } catch (error) {
      console.error("Get listings error:", error);
      return [];
    }
  }),

  // Get seller analytics
  getAnalytics: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const myListings = await db
        .select()
        .from(userListings)
        .where(eq(userListings.userId, ctx.user.id));

      const totalListings = myListings.length;
      const totalVisitors = 0; // Would need visitor tracking table
      const averageRating = null; // Would need rating table
      const totalReviews = 0; // Would need review table

      return {
        totalListings,
        totalVisitors,
        averageRating,
        totalReviews,
      };
    } catch (error) {
      console.error("Get analytics error:", error);
      return {
        totalListings: 0,
        totalVisitors: 0,
        averageRating: null,
        totalReviews: 0,
      };
    }
  }),

  // Delete a listing
  deleteListing: protectedProcedure
    .input(z.object({ listingId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");

        // Verify ownership
        const listing = await db
          .select()
          .from(userListings)
          .where(eq(userListings.id, input.listingId))
          .limit(1);

        if (!listing.length || listing[0].userId !== ctx.user.id) {
          return { success: false, error: "Unauthorized" };
        }

        await db.delete(userListings).where(eq(userListings.id, input.listingId));
        return { success: true };
      } catch (error) {
        console.error("Delete listing error:", error);
        return { success: false, error: String(error) };
      }
    }),
});
