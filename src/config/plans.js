/**
 * plans.js
 * Defines the SaaS subscription tiers and feature flags for PricePilot.
 */

const PLANS = {
  FREE: {
    id: "free",
    name: "Individual (Free)",
    requestLimit: 1500,
    roundingStyles: [0.99], 
    features: {
      advancedTax: true,
      removeBranding: false,
      support: "community",
      watermark: true
    }
  },
  STARTER: {
    id: "starter",
    name: "Starter",
    requestLimit: 15000,
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
    requestLimit: 50000,
    roundingStyles: [0.99, 0.95, 0.90, 0.49, 0.00], 
    features: {
      advancedTax: true,
      removeBranding: true,
      support: "priority",
      regionalPricing: true,
      abTesting: true
    }
  },
  PRO: {
    id: "pro",
    name: "Pro",
    requestLimit: 1000000, // Representing 1M+ or "Unlimited" scope
    roundingStyles: [0.99, 0.95, 0.90, 0.49, 0.00], 
    features: {
      advancedTax: true,
      removeBranding: true,
      support: "premium",
      regionalPricing: true,
      webhooks: true,
      customRules: true
    }
  }
};

module.exports = PLANS;
