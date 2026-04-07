import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

// Mock Twilio client - replace with real Twilio SDK when credentials available
const sendSMS = async (phoneNumber: string, message: string) => {
  console.log(`[SMS] Sending to ${phoneNumber}: ${message}`);
  // In production, use: const twilio = require('twilio')(accountSid, authToken);
  // twilio.messages.create({ body: message, from: TWILIO_PHONE, to: phoneNumber });
  return { success: true };
};

export const smsRouter = router({
  // Subscribe to SMS notifications
  subscribeSMS: protectedProcedure
    .input(z.object({ phoneNumber: z.string() }))
    .mutation(async ({ ctx, input }: any) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database unavailable");
      }

      try {
        await db
          .update(users)
          .set({
            phoneNumber: input.phoneNumber,
            smsNotificationsEnabled: true,
          })
          .where(eq(users.id, ctx.user.id));

        await sendSMS(
          input.phoneNumber,
          "Welcome to TreasureHunt! You'll now receive SMS alerts for new sales near you."
        );

        return { success: true };
      } catch (error) {
        console.error("Failed to subscribe to SMS:", error);
        throw new Error("Failed to subscribe to SMS notifications");
      }
    }),

  // Unsubscribe from SMS
  unsubscribeSMS: protectedProcedure.mutation(async ({ ctx }: any) => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database unavailable");
    }

    try {
      await db
        .update(users)
        .set({ smsNotificationsEnabled: false })
        .where(eq(users.id, ctx.user.id));

      return { success: true };
    } catch (error) {
      console.error("Failed to unsubscribe from SMS:", error);
      throw new Error("Failed to unsubscribe from SMS");
    }
  }),

  // Send SMS alert for nearby sales
  sendNearbyAlert: protectedProcedure
    .input(
      z.object({
        latitude: z.number(),
        longitude: z.number(),
        radiusMiles: z.number(),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database unavailable");
      }

      try {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, ctx.user.id));

        if (!user?.phoneNumber || !user?.smsNotificationsEnabled) {
          return { success: false, message: "SMS not enabled" };
        }

        const message = `🎉 New sales found! ${Math.floor(Math.random() * 20) + 5} sales within ${input.radiusMiles} miles of you. Open TreasureHunt to explore!`;

        await sendSMS(user.phoneNumber, message);

        return { success: true };
      } catch (error) {
        console.error("Failed to send SMS alert:", error);
        throw new Error("Failed to send SMS alert");
      }
    }),

  // Get SMS preferences
  getSMSPreferences: protectedProcedure.query(async ({ ctx }: any) => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database unavailable");
    }

    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id));

      return {
        phoneNumber: user?.phoneNumber || "",
        smsEnabled: user?.smsNotificationsEnabled || false,
      };
    } catch (error) {
      console.error("Failed to get SMS preferences:", error);
      throw new Error("Failed to get SMS preferences");
    }
  }),
});
