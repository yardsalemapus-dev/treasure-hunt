import Stripe from "stripe";
import type { Stripe as StripeType } from "stripe";
import { getDb } from "./db";
import { subscriptions, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {});

export { stripe };
export type { StripeType };

/**
 * Create a Stripe customer for a user
 */
export async function createStripeCustomer(userId: number, email: string, name?: string) {
  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
    metadata: {
      userId: userId.toString(),
    },
  });

  return customer.id;
}

/**
 * Create a checkout session for subscription
 */
export async function createCheckoutSession(
  userId: number,
  stripeCustomerId: string,
  priceId: string,
  origin: string
) {
  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${origin}/dashboard?payment=success`,
    cancel_url: `${origin}/dashboard?payment=canceled`,
    client_reference_id: userId.toString(),
    metadata: {
      user_id: userId.toString(),
    },
    allow_promotion_codes: true,
  });

  return session.url;
}

/**
 * Handle checkout.session.completed webhook
 */
export async function handleCheckoutSessionCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;

  if (!session.customer || !session.subscription) {
    console.error("[Stripe] Missing customer or subscription in checkout session");
    return;
  }

  const db = await getDb();
  if (!db) {
    console.error("[Stripe] Database not available");
    return;
  }

  const customerId = typeof session.customer === "string" ? session.customer : session.customer.id;
  const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;

  try {
    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Upsert subscription in database
    await db
      .insert(subscriptions)
      .values({
        userId: parseInt(session.client_reference_id || "0"),
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        status: subscription.status as "active" | "canceled" | "past_due" | "trialing",
        currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
        currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
      })
      .onDuplicateKeyUpdate({
        set: {
          stripeSubscriptionId: subscriptionId,
          status: subscription.status as "active" | "canceled" | "past_due" | "trialing",
          currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
          currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
        },
      });

    console.log(`[Stripe] Subscription created for user ${session.client_reference_id}`);
  } catch (error) {
    console.error("[Stripe] Error handling checkout session:", error);
    throw error;
  }
}

/**
 * Handle invoice.payment_succeeded webhook
 */
export async function handleInvoicePaymentSucceeded(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;

  console.log(`[Stripe] Invoice paid: ${invoice.id} for customer ${invoice.customer}`);
  // Additional logic can be added here (e.g., send confirmation email)
}

/**
 * Handle customer.subscription.deleted webhook
 */
export async function handleSubscriptionDeleted(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  const db = await getDb();

  if (!db) {
    console.error("[Stripe] Database not available");
    return;
  }

  try {
    await db
      .update(subscriptions)
      .set({ status: "canceled" })
      .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

    console.log(`[Stripe] Subscription canceled: ${subscription.id}`);
  } catch (error) {
    console.error("[Stripe] Error handling subscription deletion:", error);
    throw error;
  }
}

/**
 * Check if user has an active subscription
 */
export async function hasActiveSubscription(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const result = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    if (result.length === 0) return false;

    const sub = result[0];
    const periodEnd = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null;
    return sub.status === "active" && (!periodEnd || periodEnd > new Date());
  } catch (error) {
    console.error("[Stripe] Error checking subscription:", error);
    return false;
  }
}

/**
 * Check if user is in trial period
 */
export async function isInTrialPeriod(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (result.length === 0) return false;

    const user = result[0];
    const now = new Date();

    if (!user.trialEndDate) {
      // Trial not set, calculate it
      const trialEnd = new Date(user.trialStartDate);
      trialEnd.setDate(trialEnd.getDate() + 7);
      return now < trialEnd;
    }

    return now < new Date(user.trialEndDate);
  } catch (error) {
    console.error("[Stripe] Error checking trial period:", error);
    return false;
  }
}

/**
 * Check if user has access (trial or paid subscription)
 */
export async function hasAccess(userId: number): Promise<boolean> {
  const inTrial = await isInTrialPeriod(userId);
  if (inTrial) return true;

  const hasPaid = await hasActiveSubscription(userId);
  return hasPaid;
}
