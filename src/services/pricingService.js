const env = require("../config/env");

function roundTo2(value) {
  return Number(Number(value).toFixed(2));
}

/**
 * Local Fallback Logic (Legacy)
 * Used if the pricing engine is unavailable or times out.
 */
function localOptimizeFallback({ basePrice, plan = "free" }) {
  const normalizedPlan = String(plan || "").toLowerCase();
  const PAID_PLANS = ["starter", "growth", "pro", "enterprise"];

  let finalPrice;
  if (PAID_PLANS.includes(normalizedPlan)) {
    const floor = Math.floor(basePrice);
    const decimal = basePrice - floor;
    finalPrice = decimal > 0.50 ? (floor + 0.99) : (floor + 0.50);
  } else {
    const ceil = Math.ceil(basePrice);
    finalPrice = Math.max(0.99, ceil - 0.01);
  }

  return {
    finalPrice: roundTo2(finalPrice),
    originalPrice: roundTo2(basePrice),
    adjustments: {
      country_adjustment: 0,
      source_adjustment: roundTo2(finalPrice - basePrice)
    },
    engine: "local_fallback"
  };
}

/**
 * Calls the engine-main Pricing Engine
 */
async function optimizePrice({ basePrice, country, currency, source, plan }) {
  if (!env.pricingEngineUrl) {
    return localOptimizeFallback({ basePrice, plan });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), env.pricingEngineTimeoutMs);

  try {
    const response = await fetch(`${env.pricingEngineUrl}/v1/optimize-price`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.pricingEngineApiKey || "",
      },
      body: JSON.stringify({
        after_tax_price: basePrice,
        country: country,
        currency: currency || "USD",
        segment: source || "web_v1",
        metadata: { plan }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Pricing Engine returned ${response.status}. Falling back to local logic.`);
      return localOptimizeFallback({ basePrice, plan });
    }

    const data = await response.json();
    
    // Map engine response back to SaaS expected format
    return {
      finalPrice: roundTo2(data.optimized_price || data.after_tax_price),
      originalPrice: roundTo2(data.after_tax_price || basePrice),
      adjustments: {
        country_adjustment: 0, // Engine doesn't return breakout yet
        source_adjustment: roundTo2((data.optimized_price || basePrice) - basePrice)
      },
      engine: "engine-main",
      strategy: data.strategy
    };

  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      console.error(`Pricing Engine timed out after ${env.pricingEngineTimeoutMs}ms`);
    } else {
      console.error("Pricing Engine error:", err.message);
    }
    return localOptimizeFallback({ basePrice, plan });
  }
}

module.exports = {
  optimizePrice
};
