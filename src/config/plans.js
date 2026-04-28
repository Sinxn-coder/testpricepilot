/**
 * plans.js
 * Defines the SaaS subscription tiers and feature flags for PricePilot.
 */

const PLANS = {
  FREE: {
    id: "free",
    name: "Free Plan",
    requestLimit: 10000,
    roundingStyles: [0.99], 
    features: {
      advancedTax: false,
      removeBranding: false,
      support: "community",
      watermark: true,
      dashboard: "limited"
    }
  },
  STARTER: {
    id: "starter",
    name: "Starter Plan",
    requestLimit: 150000,
    roundingStyles: [0.99, 0.95, 0.90],
    features: {
      advancedTax: true,
      removeBranding: true,
      support: "email",
      analytics: "basic"
    }
  },
  GROWTH: {
    id: "growth",
    name: "Growth Plan",
    requestLimit: 500000,
    roundingStyles: [0.99, 0.95, 0.90, 0.49, 0.00], 
    features: {
      advancedTax: true,
      removeBranding: true,
      support: "priority",
      regionalPricing: true,
      abTesting: true,
      bulkOptimization: true,
      analytics: "advanced"
    }
  },
  PRO: {
    id: "pro",
    name: "Pro Plan",
    requestLimit: 10000000, // Representing "Unlimited"
    roundingStyles: [0.99, 0.95, 0.90, 0.49, 0.00], 
    features: {
      advancedTax: true,
      removeBranding: true,
      support: "sla",
      regionalPricing: true,
      webhooks: true,
      customRules: true,
      abTestingAdvanced: true,
      regionControl: true
    }
  }
};

module.exports = PLANS;
