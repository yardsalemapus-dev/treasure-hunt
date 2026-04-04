import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { reviews } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const reviewsRouter = router({
  /**
   * Get all reviews for a listing
   */
  getByListing: publicProcedure
    .input(z.object({ listingId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database unavailable");
      }

      const listingReviews = await db
        .select()
        .from(reviews)
        .where(eq(reviews.listingId, input.listingId));

      return listingReviews;
    }),

  /**
   * Create a new review for a listing
   */
  create: protectedProcedure
    .input(
      z.object({
        listingId: z.number(),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database unavailable");
      }

      const result = await db.insert(reviews).values({
        listingId: input.listingId,
        userId: ctx.user.id,
        rating: input.rating,
        comment: input.comment,
      });

      return result;
    }),

  /**
   * Get average rating for a listing
   */
  getAverageRating: publicProcedure
    .input(z.object({ listingId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database unavailable");
      }

      const listingReviews = await db
        .select()
        .from(reviews)
        .where(eq(reviews.listingId, input.listingId));

      if (listingReviews.length === 0) {
        return { average: 0, count: 0 };
      }

      const sum = listingReviews.reduce((acc, r) => acc + r.rating, 0);
      const average = sum / listingReviews.length;

      return { average, count: listingReviews.length };
    }),

  /**
   * Delete a review (only by the author or admin)
   */
  delete: protectedProcedure
    .input(z.object({ reviewId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database unavailable");
      }

      // Get the review to verify ownership
      const review = await db
        .select()
        .from(reviews)
        .where(eq(reviews.id, input.reviewId))
        .limit(1);

      if (review.length === 0) {
        throw new Error("Review not found");
      }

      if (review[0].userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      await db.delete(reviews).where(eq(reviews.id, input.reviewId));

      return { success: true };
    }),
});
