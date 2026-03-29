/**
 * plans.js
 * Defines the SaaS subscription tiers and feature flags for PricePilot.
 */

const PLANS = {
  FREE: {
    id: "free",
    name: "Individual (Free)",
    requestLimit: 500,
    roundingStyles: [0.99], // Strictly only .99
    features: {
      advancedTax: false,
      removeBranding: false,
      support: "community"
    }
  },
  STARTER: {
    id: "starter",
    name: "Starter",
    requestLimit: 5000,
    roundingStyles: [0.99, 0.95, 0.90],
    features: {
      advancedTax: true,
      removeBranding: true,
      support: "email"
    }
  },
  GROWTH: {
    id: "growth",
    name: "Growth",
    requestLimit: 20000,
    roundingStyles: [0.99, 0.95, 0.90, 0.49, 0.00], // Full psychology
    features: {
      advancedTax: true,
      removeBranding: true,
      support: "priority",
      regionalPricing: true
    }
  },
  PRO: {
    id: "pro",
    name: "Pro",
    requestLimit: 100000,
    roundingStyles: [0.99, 0.95, 0.90, 0.49, 0.00], 
    features: {
      advancedTax: true,
      removeBranding: true,
      support: "premium",
      regionalPricing: true,
      webhooks: true
    }
  }
};

module.exports = PLANS;
