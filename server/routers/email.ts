import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { users, subscriptions } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

// Email service helper (using Manus built-in email)
async function sendEmail(to: string, subject: string, html: string) {
  try {
    const response = await fetch("https://forge.manus.ai/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.BUILT_IN_FORGE_API_KEY}`,
      },
      body: JSON.stringify({
        to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      console.error("Email send failed:", await response.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error("Email error:", error);
    return false;
  }
}

export const emailRouter = router({
  // Send weekly best deals digest
  sendWeeklyDigest: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");

        const user = await db.select().from(users).where(eq(users.id, parseInt(input.userId))).limit(1);
        if (!user.length) return { success: false, error: "User not found" };

        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1f2937; text-align: center;">🎉 Your Weekly Best Deals Digest</h1>
            <p style="color: #6b7280; text-align: center;">Here are the top-rated sales near you this week</p>
            <div style="border: 1px solid #e0e0e0; padding: 16px; margin: 8px 0; border-radius: 8px;">
              <h3 style="margin: 0 0 8px 0; color: #1f2937;">Estate Sale</h3>
              <p style="margin: 0 0 4px 0; color: #6b7280;">123 Main St</p>
              <p style="margin: 0 0 8px 0; color: #6b7280;">Estate Sale</p>
              <span style="background: #fbbf24; color: #78350f; padding: 4px 8px; border-radius: 4px; font-size: 12px;">Rating: 4.8/5</span>
            </div>
            <div style="text-align: center; margin-top: 24px;">
              <a href="https://treasurehunt-d4uu6hut.manus.space/analytics" style="background: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">View All Deals</a>
            </div>
          </div>
        `;

        const sent = await sendEmail(user[0].email || "", "Your Weekly Best Deals Digest 🎉", html);
        return { success: sent };
      } catch (error) {
        console.error("Weekly digest error:", error);
        return { success: false, error: String(error) };
      }
    }),

  // Send trial expiration reminder
  sendTrialReminder: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");

        const user = await db.select().from(users).where(eq(users.id, parseInt(input.userId))).limit(1);
        if (!user.length) return { success: false, error: "User not found" };

        const sub = await db.select().from(subscriptions).where(eq(subscriptions.userId, parseInt(input.userId))).limit(1);
        if (!sub.length) return { success: false, error: "No subscription found" };

        const daysUntilExpiry = sub[0].currentPeriodEnd
          ? Math.ceil((new Date(sub[0].currentPeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : 0;

        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1f2937;">Your Free Trial Ends in ${daysUntilExpiry} Days!</h1>
            <p style="color: #6b7280; font-size: 16px;">
              You're about to lose access to TreasureHunt's premium features. Don't miss out on finding amazing deals!
            </p>
            <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0; border-radius: 4px;">
              <h3 style="margin: 0 0 8px 0; color: #1e40af;">Premium Features You'll Get:</h3>
              <ul style="margin: 0; padding-left: 20px; color: #1e40af;">
                <li>Unlimited route optimization</li>
                <li>Save unlimited routes</li>
                <li>Advanced filters & search</li>
                <li>Weekly best deals digest</li>
                <li>Priority customer support</li>
              </ul>
            </div>
            <div style="text-align: center; margin: 24px 0;">
              <a href="https://treasurehunt-d4uu6hut.manus.space/dashboard" style="background: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; font-weight: bold;">Upgrade Now - Only $7.99/month</a>
            </div>
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
              Trial expires on ${sub[0].currentPeriodEnd ? new Date(sub[0].currentPeriodEnd).toLocaleDateString() : "N/A"}
            </p>
          </div>
        `;

        const sent = await sendEmail(user[0].email || "", "Your Free Trial Ends Soon! ⏰", html);
        return { success: sent };
      } catch (error) {
        console.error("Trial reminder error:", error);
        return { success: false, error: String(error) };
      }
    }),

  // Send custom email to user
  sendCustomEmail: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        subject: z.string(),
        html: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");

        const user = await db.select().from(users).where(eq(users.id, parseInt(input.userId))).limit(1);
        if (!user.length) return { success: false, error: "User not found" };

        const sent = await sendEmail(user[0].email || "", input.subject, input.html);
        return { success: sent };
      } catch (error) {
        console.error("Custom email error:", error);
        return { success: false, error: String(error) };
      }
    }),

  // Schedule emails (for background jobs)
  scheduleWeeklyDigests: publicProcedure.mutation(async () => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const allUsers = await db.select().from(users);

      let sent = 0;
      for (const user of allUsers) {
        if (!user.email) continue;
        const result = await sendEmail(
          user.email,
          "Your Weekly Best Deals Digest 🎉",
          `<p>Weekly digest email for ${user.email}</p>`
        );
        if (result) sent++;
      }

      return { success: true, sent };
    } catch (error) {
      console.error("Schedule digests error:", error);
      return { success: false, error: String(error) };
    }
  }),
});
