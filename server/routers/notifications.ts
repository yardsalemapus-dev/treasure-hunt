import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { notificationSubscriptions, sentNotifications } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const notificationsRouter = router({
  /**
   * Subscribe user to push notifications
   */
  subscribe: protectedProcedure
    .input(
      z.object({
        endpoint: z.string(),
        auth: z.string(),
        p256dh: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database unavailable");
      }

      const result = await db.insert(notificationSubscriptions).values({
        userId: ctx.user.id,
        endpoint: input.endpoint,
        auth: input.auth,
        p256dh: input.p256dh,
      });

      return result;
    }),

  /**
   * Unsubscribe user from push notifications
   */
  unsubscribe: protectedProcedure
    .input(z.object({ endpoint: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database unavailable");
      }

      await db
        .delete(notificationSubscriptions)
        .where(eq(notificationSubscriptions.endpoint, input.endpoint));

      return { success: true };
    }),

  /**
   * Get user's notification subscriptions
   */
  getSubscriptions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database unavailable");
    }

    const subs = await db
      .select()
      .from(notificationSubscriptions)
      .where(eq(notificationSubscriptions.userId, ctx.user.id));

    return subs;
  }),

  /**
   * Send push notification to user
   * (This would typically be called from a backend job or webhook)
   */
  send: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        title: z.string(),
        body: z.string(),
        listingId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database unavailable");
      }

      // Get user's subscriptions
      const subs = await db
        .select()
        .from(notificationSubscriptions)
        .where(eq(notificationSubscriptions.userId, input.userId));

      if (subs.length === 0) {
        return { success: false, message: "No subscriptions found" };
      }

      // Send to each subscription
      const results = [];
      for (const sub of subs) {
        try {
          // In production, you would use web-push library here
          // For now, just log the notification
          console.log(`Sending notification to ${sub.endpoint}: ${input.title}`);

          // Log the sent notification
          await db.insert(sentNotifications).values({
            userId: input.userId,
            title: input.title,
            body: input.body,
            listingId: input.listingId,
            status: "sent",
          });

          results.push({ success: true, endpoint: sub.endpoint });
        } catch (error) {
          console.error(`Failed to send notification to ${sub.endpoint}:`, error);
          await db.insert(sentNotifications).values({
            userId: input.userId,
            title: input.title,
            body: input.body,
            listingId: input.listingId,
            status: "failed",
          });
          results.push({ success: false, endpoint: sub.endpoint });
        }
      }

      return { success: true, results };
    }),

  /**
   * Get notification history for user
   */
  getHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database unavailable");
    }

    const history = await db
      .select()
      .from(sentNotifications)
      .where(eq(sentNotifications.userId, ctx.user.id));

    return history;
  }),
});
