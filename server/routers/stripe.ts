import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { subscriptions, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import type { Stripe as StripeType } from "stripe";

type StripeClient = InstanceType<typeof Stripe>;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

// Trial duration in days
const TRIAL_DAYS = 3;
const PRICE_MONTHLY = 799; // $7.99 in cents

export const stripeRouter = router({
  /**
   * Create a checkout session for the 3-day trial
   */
  createCheckoutSession: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().optional(),
        returnUrl: z.string().url(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Create or retrieve customer
        const customers = await stripe.customers.list({
          email: input.email,
          limit: 1,
        });

        let customerId: string;
        if (customers.data.length > 0) {
          customerId = customers.data[0].id;
        } else {
          const customer = await stripe.customers.create({
            email: input.email,
            name: input.name,
          });
          customerId = customer.id;
        }

        // Create checkout session with trial
        const session = await stripe.checkout.sessions.create({
          customer: customerId,
          mode: "subscription",
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: "TreasureHunt Premium",
                  description: "Find the best sales near you",
                },
                unit_amount: PRICE_MONTHLY,
                recurring: {
                  interval: "month",
                  interval_count: 1,
                },
              },
              quantity: 1,
            },
          ],
          subscription_data: {
            trial_period_days: TRIAL_DAYS,
            metadata: {
              email: input.email,
            },
          },
          success_url: `${input.returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: input.returnUrl,
          metadata: {
            email: input.email,
          },
        });

        return {
          sessionId: session.id,
          url: session.url,
        };
      } catch (error) {
        console.error("Stripe checkout error:", error);
        throw new Error("Failed to create checkout session");
      }
    }),

  /**
   * Get subscription status for a user
   */
  getSubscriptionStatus: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) {
        throw new Error("Database unavailable");
      }

      const subscription = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, ctx.user.id))
        .limit(1);

      if (subscription.length === 0) {
        // Check if user is in trial period
        const user = await db
          .select()
          .from(users)
          .where(eq(users.id, ctx.user.id))
          .limit(1);

        if (user.length > 0) {
          const trialEnd = user[0].trialEndDate;
          const now = new Date();
          const isTrialing = trialEnd && trialEnd > now;

          return {
            status: isTrialing ? "trialing" : "inactive",
            trialEndDate: trialEnd,
            isActive: isTrialing,
          };
        }

        return {
          status: "inactive",
          isActive: false,
        };
      }

      return {
        status: subscription[0].status,
        stripeSubscriptionId: subscription[0].stripeSubscriptionId,
        currentPeriodEnd: subscription[0].currentPeriodEnd,
        isActive:
          subscription[0].status === "active" ||
          subscription[0].status === "trialing",
      };
    } catch (error) {
      console.error("Get subscription status error:", error);
      throw new Error("Failed to get subscription status");
    }
  }),

  /**
   * Cancel subscription
   */
  cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) {
        throw new Error("Database unavailable");
      }

      const subscription = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, ctx.user.id))
        .limit(1);

      if (subscription.length === 0) {
        throw new Error("No active subscription found");
      }

      if (subscription[0].stripeSubscriptionId) {
        await stripe.subscriptions.cancel(
          subscription[0].stripeSubscriptionId
        );
      }

      // Update subscription status
      await db
        .update(subscriptions)
        .set({
          status: "canceled",
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, subscription[0].id));

      return { success: true };
    } catch (error) {
      console.error("Cancel subscription error:", error);
      throw new Error("Failed to cancel subscription");
    }
  }),

  /**
   * Retrieve checkout session details
   */
  getCheckoutSession: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      try {
        const session = await stripe.checkout.sessions.retrieve(
          input.sessionId,
          {
            expand: ["subscription"],
          }
        );

        return {
          id: session.id,
          status: session.payment_status,
          customerEmail: session.customer_email,
          subscription: (session.subscription as any)?.id,
        };
      } catch (error) {
        console.error("Get checkout session error:", error);
        throw new Error("Failed to retrieve checkout session");
      }
    }),
});
