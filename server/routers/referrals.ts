import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { users, referrals } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export const referralsRouter = router({
  // Generate referral code for user
  generateReferralCode: protectedProcedure.mutation(async ({ ctx }: any) => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database unavailable");
    }

    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id));

      if (!user) {
        throw new Error("User not found");
      }

      // If user already has a referral code, return it
      if (user.referralCode) {
        return {
          referralCode: user.referralCode,
          referralUrl: `${process.env.VITE_FRONTEND_URL || "https://treasurehunt-d4uu6hut.manus.space"}/signup?ref=${user.referralCode}`,
        };
      }

      // Generate new referral code
      const referralCode = `TH${uuidv4().slice(0, 8).toUpperCase()}`;

      await db
        .update(users)
        .set({ referralCode })
        .where(eq(users.id, ctx.user.id));

      return {
        referralCode,
        referralUrl: `${process.env.VITE_FRONTEND_URL || "https://treasurehunt-d4uu6hut.manus.space"}/signup?ref=${referralCode}`,
      };
    } catch (error) {
      console.error("Failed to generate referral code:", error);
      throw new Error("Failed to generate referral code");
    }
  }),

  // Get referral stats for user
  getReferralStats: protectedProcedure.query(async ({ ctx }: any) => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database unavailable");
    }

    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id));

      if (!user) {
        throw new Error("User not found");
      }

      // Get all referrals made by this user
      const userReferrals = await db
        .select()
        .from(referrals)
        .where(eq(referrals.referrerId, ctx.user.id));

      const completedReferrals = userReferrals.filter(
        (r) => r.status === "completed" || r.status === "claimed"
      );

      return {
        referralCode: user.referralCode || "",
        totalReferrals: user.totalReferrals || 0,
        completedReferrals: completedReferrals.length,
        referralCredits: parseFloat(user.referralCredits?.toString() || "0"),
        referralHistory: userReferrals.map((r) => ({
          id: r.id,
          referredUserId: r.referredUserId,
          creditAmount: parseFloat(r.creditAmount?.toString() || "0"),
          status: r.status,
          createdAt: r.createdAt,
          claimedAt: r.claimedAt,
        })),
      };
    } catch (error) {
      console.error("Failed to get referral stats:", error);
      throw new Error("Failed to get referral stats");
    }
  }),

  // Claim referral credits
  claimReferralCredits: protectedProcedure.mutation(async ({ ctx }: any) => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database unavailable");
    }

    try {
      // Get all pending referrals for this user
      const pendingReferrals = await db
        .select()
        .from(referrals)
        .where(eq(referrals.referrerId, ctx.user.id));

      const unclaimedReferrals = pendingReferrals.filter(
        (r) => r.status === "completed"
      );

      if (unclaimedReferrals.length === 0) {
        return { success: false, message: "No unclaimed referral credits" };
      }

      // Calculate total credits to claim
      const totalCredits = unclaimedReferrals.reduce(
        (sum, r) => sum + parseFloat(r.creditAmount?.toString() || "0"),
        0
      );

      // Update referral status to claimed
      for (const referral of unclaimedReferrals) {
        await db
          .update(referrals)
          .set({ status: "claimed", claimedAt: new Date() })
          .where(eq(referrals.id, referral.id));
      }

      // Update user's referral credits
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id));

      const currentCredits = parseFloat(user?.referralCredits?.toString() || "0");
      const newCredits = currentCredits + totalCredits;

      await db
        .update(users)
        .set({ referralCredits: newCredits.toString() })
        .where(eq(users.id, ctx.user.id));

      return {
        success: true,
        claimedAmount: totalCredits,
        totalCredits: newCredits,
      };
    } catch (error) {
      console.error("Failed to claim referral credits:", error);
      throw new Error("Failed to claim referral credits");
    }
  }),

  // Apply referral code on signup
  applyReferralCode: publicProcedure
    .input(z.object({ referralCode: z.string(), newUserId: z.number() }))
    .mutation(async ({ input }: any) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database unavailable");
      }

      try {
        // Find referrer by referral code
        const [referrer] = await db
          .select()
          .from(users)
          .where(eq(users.referralCode, input.referralCode));

        if (!referrer) {
          return { success: false, message: "Invalid referral code" };
        }

        // Create referral record
        await db.insert(referrals).values({
          referrerId: referrer.id,
          referredUserId: input.newUserId,
          creditAmount: "5",
          status: "completed",
        });

        // Update referrer's total referrals count
        const newTotal = (referrer.totalReferrals || 0) + 1;
        await db
          .update(users)
          .set({ totalReferrals: newTotal })
          .where(eq(users.id, referrer.id));

        // Update new user's referredBy field
        await db
          .update(users)
          .set({ referredBy: referrer.id })
          .where(eq(users.id, input.newUserId));

        return { success: true, referrerName: referrer.name };
      } catch (error) {
        console.error("Failed to apply referral code:", error);
        throw new Error("Failed to apply referral code");
      }
    }),
});
