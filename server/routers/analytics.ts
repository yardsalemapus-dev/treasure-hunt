import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { listings, reviews } from "../../drizzle/schema";
import { eq, gte, lte, desc } from "drizzle-orm";

export const analyticsRouter = router({
  /**
   * Track a listing view
   */
  trackListingView: publicProcedure
    .input(z.object({ listingId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database unavailable");
      }

      // In production, you'd increment a view counter
      // For now, just log it
      console.log(`View tracked for listing ${input.listingId}`);

      return { success: true };
    }),

  /**
   * Get trending listings (most viewed/reviewed)
   */
  getTrendingListings: publicProcedure
    .input(
      z.object({
        days: z.number().default(7),
        limit: z.number().default(10),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database unavailable");
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - input.days);

      // Get listings with reviews in the last N days
      const trendingListings = await db
        .select()
        .from(listings)
        .where(gte(listings.createdAt, cutoffDate))
        .limit(input.limit);

      return trendingListings;
    }),

  /**
   * Get best deals (highest rated sales)
   */
  getBestDeals: publicProcedure
    .input(
      z.object({
        limit: z.number().default(10),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database unavailable");
      }

      // Get all listings
      const allListings = await db.select().from(listings);

      // For each listing, calculate average rating
      const listingsWithRatings = await Promise.all(
        allListings.map(async (listing) => {
          const listingReviews = await db
            .select()
            .from(reviews)
            .where(eq(reviews.listingId, listing.id));

          const avgRating =
            listingReviews.length > 0
              ? listingReviews.reduce((sum, r) => sum + r.rating, 0) /
                listingReviews.length
              : 0;

          return {
            ...listing,
            averageRating: avgRating,
            reviewCount: listingReviews.length,
          };
        })
      );

      // Sort by rating and return top N
      return listingsWithRatings
        .sort((a, b) => b.averageRating - a.averageRating)
        .slice(0, input.limit);
    }),

  /**
   * Get monthly report data
   */
  getMonthlyReport: publicProcedure
    .input(
      z.object({
        year: z.number(),
        month: z.number(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database unavailable");
      }

      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = new Date(input.year, input.month, 0);

      // Get listings created in this month
      const monthlyListings = await db
        .select()
        .from(listings)
        .where(
          gte(listings.createdAt, startDate) &&
            lte(listings.createdAt, endDate)
        );

      // Get reviews created in this month
      const monthlyReviews = await db
        .select()
        .from(reviews)
        .where(
          gte(reviews.createdAt, startDate) &&
            lte(reviews.createdAt, endDate)
        );

      // Calculate statistics
      const avgRating =
        monthlyReviews.length > 0
          ? monthlyReviews.reduce((sum, r) => sum + r.rating, 0) /
            monthlyReviews.length
          : 0;

      // Group listings by category
      const listingsByCategory = monthlyListings.reduce(
        (acc, listing) => {
          const category = listing.category;
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      return {
        month: input.month,
        year: input.year,
        totalListings: monthlyListings.length,
        totalReviews: monthlyReviews.length,
        averageRating: avgRating.toFixed(2),
        listingsByCategory,
        topRatedListings: monthlyListings
          .slice(0, 5)
          .map((l) => ({
            id: l.id,
            title: l.title,
            category: l.category,
          })),
      };
    }),

  /**
   * Get user analytics (for dashboard)
   */
  getUserAnalytics: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database unavailable");
    }

    // Get user's reviews
    const userReviews = await db
      .select()
      .from(reviews)
      .where(eq(reviews.userId, ctx.user.id));

    // Calculate stats
    const avgRating =
      userReviews.length > 0
        ? userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length
        : 0;

    const ratingDistribution = {
      5: userReviews.filter((r) => r.rating === 5).length,
      4: userReviews.filter((r) => r.rating === 4).length,
      3: userReviews.filter((r) => r.rating === 3).length,
      2: userReviews.filter((r) => r.rating === 2).length,
      1: userReviews.filter((r) => r.rating === 1).length,
    };

    return {
      totalReviews: userReviews.length,
      averageRating: avgRating.toFixed(2),
      ratingDistribution,
      recentReviews: userReviews.slice(-5),
    };
  }),

  /**
   * Get category insights
   */
  getCategoryInsights: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database unavailable");
    }

    const allListings = await db.select().from(listings);

    // Group by category and count
    const categoryStats = allListings.reduce(
      (acc, listing) => {
        const category = listing.category;
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(categoryStats).map(([category, count]) => ({
      category,
      count,
      percentage: ((count / allListings.length) * 100).toFixed(1),
    }));
  }),
});
