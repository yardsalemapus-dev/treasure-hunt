import { Request, Response } from "express";
import Stripe from "stripe";
import { getDb } from "../db";
import { subscriptions, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const db = await getDb();
  if (!db) {
    console.error("Database unavailable");
    return res.status(500).json({ error: "Database unavailable" });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("Checkout session completed:", session.id);

        // Get customer email
        const customerEmail = session.customer_email;
        if (!customerEmail) {
          console.error("No customer email in session");
          return res.status(400).json({ error: "No customer email" });
        }

        // Find or create user by email
        const userResults = await db
          .select()
          .from(users)
          .where(eq(users.email, customerEmail))
          .limit(1);
        let user = userResults.length > 0 ? userResults[0] : null;

        if (!user) {
          // Create new user (this shouldn't happen in production)
          await db.insert(users).values({
            email: customerEmail,
            openId: `stripe_${session.customer}`,
            name: session.customer_details?.name || "TreasureHunt User",
            loginMethod: "stripe",
            trialStartDate: new Date(),
            trialEndDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
          });
          // Fetch the created user
          const newUserResults = await db
            .select()
            .from(users)
            .where(eq(users.email, customerEmail))
            .limit(1);
          user = newUserResults.length > 0 ? newUserResults[0] : null;
        }

        if (!user) {
          console.error("Failed to create or find user");
          return res.status(400).json({ error: "Failed to create user" });
        }

        // Create or update subscription
        const subscriptionId = (session.subscription as string) || "";
        const existingSubResults = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.userId, user!.id))
          .limit(1);
        const existingSubscription = existingSubResults.length > 0 ? existingSubResults[0] : null;

        if (existingSubscription) {
          await db
            .update(subscriptions)
            .set({
              stripeSubscriptionId: subscriptionId,
              status: "trialing",
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.id, existingSubscription.id));
        } else {
          await db.insert(subscriptions).values({
            userId: user!.id,
            stripeCustomerId: (session.customer as string) || "",
            stripeSubscriptionId: subscriptionId,
            status: "trialing",
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          });
        }

        console.log(`Trial started for user ${user!.id}`);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("Subscription updated:", subscription.id);

        // Find subscription in database
        const results = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.stripeSubscriptionId, subscription.id))
          .limit(1);
        const dbSubscription = results.length > 0 ? results[0] : null;

        if (dbSubscription) {
          const status = subscription.status as any;
          const periodEnd = new Date((subscription as any).current_period_end * 1000);

          await db
            .update(subscriptions)
            .set({
              status,
              currentPeriodEnd: periodEnd,
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.id, dbSubscription.id));

          console.log(`Subscription ${subscription.id} updated to ${status}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("Subscription deleted:", subscription.id);

        const results = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.stripeSubscriptionId, subscription.id))
          .limit(1);
        const dbSubscription = results.length > 0 ? results[0] : null;

        if (dbSubscription) {
          await db
            .update(subscriptions)
            .set({
              status: "canceled",
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.id, dbSubscription.id as any));

          console.log(`Subscription ${subscription.id} marked as canceled`);
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log("Invoice paid:", invoice.id);

        // Find subscription and update status
        const subscriptionId = (invoice as any).subscription as string | null;
        if (subscriptionId) {
          const results = await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.stripeSubscriptionId, subscriptionId))
            .limit(1);
          const dbSubscription = results.length > 0 ? results[0] : null;

          if (dbSubscription) {
            await db
              .update(subscriptions)
              .set({
                status: "active",
                updatedAt: new Date(),
              })
              .where(eq(subscriptions.id, dbSubscription.id as any));

            console.log(`Subscription ${subscriptionId} marked as active`);
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log("Invoice payment failed:", invoice.id);

        const subscriptionId = (invoice as any).subscription as string | null;
        if (subscriptionId) {
          const results = await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.stripeSubscriptionId, subscriptionId))
            .limit(1);
          const dbSubscription = results.length > 0 ? results[0] : null;

          if (dbSubscription) {
            await db
              .update(subscriptions)
              .set({
                status: "past_due",
                updatedAt: new Date(),
              })
              .where(eq(subscriptions.id, dbSubscription.id as any));

            console.log(`Subscription ${subscriptionId} marked as past_due`);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
}
