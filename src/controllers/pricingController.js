const { getSupabaseClient } = require("../config/supabase");
const { optimizePrice } = require("../services/pricingService");
const { buildCacheKey, getCachedResult, setCachedResult } = require("../services/cacheService");
const {
  validateOptimizePricePayload,
  validateTrackConversionPayload
} = require("../utils/validation");

async function writeUsageLog(req, endpoint, statusCode = 200) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("usage_logs").insert({
    user_id: req.authUser.id,
    endpoint,
    method: req.method,
    status_code: statusCode,
    request_count: 1,
    ip_address: req.ip || req.headers["x-forwarded-for"] || "127.0.0.1",
    user_agent: req.headers["user-agent"]
  });
  if (error) {
    console.error("Usage log error:", error.message);
  }
}

async function optimizePriceHandler(req, res, next) {
  try {
    const supabase = getSupabaseClient();
    const errors = validateOptimizePricePayload(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ error: "Validation failed", details: errors });
    }

    const { base_price, country, currency, source } = req.body;
    const cacheKey = buildCacheKey(req.body);
    const cached = getCachedResult(cacheKey);

    const result =
      cached ||
      optimizePrice({
        basePrice: base_price,
        country,
        source
      });

    if (!cached) {
      setCachedResult(cacheKey, result);
    }

    const { error: pricingError } = await supabase.from("pricing_logs").insert({
      user_id: req.authUser.id,
      base_price: base_price,
      currency: currency.toUpperCase(),
      country: country.toUpperCase(),
      tax_amount: 0, // Legacy optimizer doesn't break out tax
      final_price: result.finalPrice,
      optimized_final_price: result.finalPrice,
      source: source.toLowerCase(),
      converted: false
    });

    if (pricingError) {
      console.error("Pricing log error:", pricingError.message);
    }

    await writeUsageLog(req, "/optimize-price");

    return res.status(200).json({
      final_price: result.finalPrice,
      original_price: result.originalPrice,
      adjustments: result.adjustments,
      currency: currency.toUpperCase()
    });
  } catch (error) {
    return next(error);
  }
}

async function trackConversionHandler(req, res, next) {
  try {
    const supabase = getSupabaseClient();
    const errors = validateTrackConversionPayload(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ error: "Validation failed", details: errors });
    }

    const { price_shown, converted, source, country } = req.body;

    const { error } = await supabase.from("pricing_logs").insert({
      user_id: req.authUser.id,
      base_price: price_shown,
      currency: "USD",
      country: country.toUpperCase(),
      tax_amount: 0,
      final_price: price_shown,
      optimized_final_price: price_shown,
      source: source.toLowerCase(),
      converted: true
    });

    if (error) {
       console.error("Conversion log error:", error.message);
    }

    await writeUsageLog(req, "/track-conversion", 201);

    return res.status(201).json({
      success: true,
      message: "Conversion tracked"
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  optimizePriceHandler,
  trackConversionHandler
};
