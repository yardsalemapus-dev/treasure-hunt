import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

// Get SMS message in user's preferred language
const getSMSMessage = (messageKey: string, language: string = "en"): string => {
  const messages: Record<string, any> = {
    welcome: {
      en: "Welcome to TreasureHunt! You'll now receive SMS alerts for new sales near you.",
      es: "¡Bienvenido a TreasureHunt! Ahora recibirás alertas por SMS para nuevas ventas cerca de ti.",
    },
    nearbySalesEn: "🎉 New sales found! {count} sales within {miles} miles of you. Open TreasureHunt to explore!",
    nearbySalesEs: "🎉 ¡Nuevas ventas encontradas! {count} ventas dentro de {miles} millas de ti. ¡Abre TreasureHunt para explorar!",
  };
  const msg = messages[messageKey];
  if (typeof msg === "string") return msg;
  return msg?.[language] || msg?.en || "";
};

// Format nearby sales message with count and distance
const formatNearbySalesMessage = (count: number, miles: number, language: string = "en"): string => {
  const template = language === "es"
    ? "🎉 ¡Nuevas ventas encontradas! {count} ventas dentro de {miles} millas de ti. ¡Abre TreasureHunt para explorar!"
    : "🎉 New sales found! {count} sales within {miles} miles of you. Open TreasureHunt to explore!";
  return template.replace("{count}", String(count)).replace("{miles}", String(miles));
};

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
    .input(z.object({ phoneNumber: z.string(), language: z.enum(["en", "es"]).optional() }))
    .mutation(async ({ ctx, input }: any) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database unavailable");
      }

      try {
        const language = input.language || "en";
        await db
          .update(users)
          .set({
            phoneNumber: input.phoneNumber,
            smsNotificationsEnabled: true,
            preferredLanguage: language,
          })
          .where(eq(users.id, ctx.user.id));

        const welcomeMessage = getSMSMessage("welcome", language);
        await sendSMS(input.phoneNumber, welcomeMessage);

        return { success: true, language };
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

        const count = Math.floor(Math.random() * 20) + 5;
        const language = user.preferredLanguage || "en";
        const message = formatNearbySalesMessage(count, input.radiusMiles, language);

        await sendSMS(user.phoneNumber, message);

        return { success: true, language };
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
        language: user?.preferredLanguage || "en",
      };
    } catch (error) {
      console.error("Failed to get SMS preferences:", error);
      throw new Error("Failed to get SMS preferences");
    }
  }),

  // Update SMS language preference
  updateSMSLanguage: protectedProcedure
    .input(z.object({ language: z.enum(["en", "es"]) }))
    .mutation(async ({ ctx, input }: any) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database unavailable");
      }

      try {
        await db
          .update(users)
          .set({ preferredLanguage: input.language })
          .where(eq(users.id, ctx.user.id));

        return { success: true, language: input.language };
      } catch (error) {
        console.error("Failed to update SMS language:", error);
        throw new Error("Failed to update SMS language");
      }
    }),
});
