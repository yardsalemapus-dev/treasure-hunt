/**
 * Stripe Products Configuration
 * Centralized definition of subscription plans and pricing
 */

export const STRIPE_PRODUCTS = {
  PREMIUM_MONTHLY: {
    name: "Premium Monthly",
    description: "Unlimited route planning and advanced features",
    priceInCents: 999, // $9.99/month
    interval: "month" as const,
    features: [
      "Unlimited route planning",
      "Advanced filtering and sorting",
      "Route history and favorites",
      "Premium amenity layer",
      "Priority support",
    ],
  },
  PREMIUM_YEARLY: {
    name: "Premium Yearly",
    description: "Save 20% with annual billing",
    priceInCents: 9999, // $99.99/year (saves ~$20)
    interval: "year" as const,
    features: [
      "Unlimited route planning",
      "Advanced filtering and sorting",
      "Route history and favorites",
      "Premium amenity layer",
      "Priority support",
    ],
  },
};

export const TRIAL_DAYS = 7;

/**
 * Helper to get product display info
 */
export function getProductInfo(productKey: keyof typeof STRIPE_PRODUCTS) {
  const product = STRIPE_PRODUCTS[productKey];
  return {
    ...product,
    priceInDollars: (product.priceInCents / 100).toFixed(2),
  };
}
