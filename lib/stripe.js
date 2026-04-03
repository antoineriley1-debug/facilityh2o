export const PLANS = {
  starter: {
    name: 'Starter',
    price: 49,
    priceId: process.env.STRIPE_STARTER_PRICE_ID || 'price_starter',
    facilities: 1,
    features: [
      '1 facility',
      'Up to 5 users',
      'Boiler + chilled water tracking',
      'Email alerts',
      '2-year history',
      'CSV export',
    ],
  },
  professional: {
    name: 'Professional',
    price: 149,
    priceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro',
    facilities: 5,
    features: [
      'Up to 5 facilities',
      'Unlimited users',
      'Everything in Starter',
      'Trend analysis & charts',
      'Cross-facility reports',
      'Priority support',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    price: 299,
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise',
    facilities: -1,
    features: [
      'Unlimited facilities',
      'Unlimited users',
      'Everything in Pro',
      'Custom chemistry parameters',
      'API access',
      'Dedicated onboarding',
      'SLA guarantee',
    ],
  },
};

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  try {
    const Stripe = require('stripe');
    return new Stripe(key, { apiVersion: '2023-10-16' });
  } catch {
    return null;
  }
}
