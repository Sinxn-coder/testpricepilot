/**
 * calculatePriceController.js
 * Handles POST /calculate-price — the canonical PricePilot spec endpoint.
 *
 * Input:  { base_price, country, currency, min_margin }
 * Output: { base_price, tax_amount, original_final_price, optimized_final_price, currency }
 */

const { getSupabaseClient } = require("../config/supabase");
const { getTaxRate, applyTax } = require("../services/taxService");
const { optimizePrice } = require("../services/pricingService");
const { buildCacheKey, getCachedResult, setCachedResult } = require("../services/cacheService");
const { validateCalculatePricePayload } = require("../utils/validation");

async function calculatePriceHandler(req, res, next) {
  try {
    // 1. Validate input
    const errors = validateCalculatePricePayload(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ error: "Validation failed", details: errors });
    }

    const { base_price, country, currency, min_margin } = req.body;
    const countryCode = String(country).toUpperCase();
    const currencyCode = String(currency).toUpperCase();

    // 2. Try cache first
    const cacheKey = buildCacheKey({ base_price, country: countryCode, currency: currencyCode, min_margin });
    const cached = getCachedResult(cacheKey);
    if (cached) {
      return res.status(200).json(cached);
    }

    // 3. Get Supabase client (may throw if not configured — caught below gracefully)
    let supabase = null;
    try {
      supabase = getSupabaseClient();
    } catch (_) {
      // Supabase not configured — tax service will use mock data
    }

    // 4. Look up tax rate for the given country
    const taxRate = await getTaxRate(countryCode, supabase);

    // 5. Apply PROFIT MARGIN to base price first
    const marginAmount = Number((base_price * (min_margin / 100)).toFixed(2));
    const preTaxPrice = Number((base_price + marginAmount).toFixed(2));

    // 6. Apply TAX to the price-after-margin
    const { taxAmount, taxedPrice } = applyTax(preTaxPrice, taxRate);

    // 7. Apply psychological pricing & tier logic
    const { finalPrice: optimizedPrice } = optimizePrice({
      basePrice: taxedPrice,
      country: countryCode,
      source: "api_v1",
      plan: req.authUser?.plan || "free"
    });

    // 8. Build response
    const responseBody = {
      base_price,
      margin_pct: min_margin,
      margin_amount: marginAmount,
      pre_tax_price: preTaxPrice,
      tax_rate_pct: taxRate,
      tax_amount: taxAmount,
      original_final_price: taxedPrice,
      optimized_final_price: optimizedPrice,
      currency: currencyCode
    };


    // 8. Cache result
    setCachedResult(cacheKey, responseBody);

    // 9. Persist to DB (best-effort — don't fail the request if DB is down)
    if (supabase && req.authUser) {
      try {
        // Log the detailed pricing calculation
        await supabase.from("pricing_logs").insert({
          user_id: req.authUser.id,
          base_price,
          currency: currencyCode,
          country: countryCode,
          tax_amount: taxAmount,
          final_price: taxedPrice,
          optimized_final_price: optimizedPrice,
          min_margin,
          source: "web_dashboard",
          converted: false
        });

        // Log the API usage event
        await supabase.from("usage_logs").insert({
          user_id: req.authUser.id,
          endpoint: "/calculate-price",
          method: "POST",
          status_code: 200,
          request_count: 1,
          ip_address: req.ip || req.headers["x-forwarded-for"] || "127.0.0.1",
          user_agent: req.headers["user-agent"]
        });
      } catch (dbErr) {
        // Log but don't fail the request
        console.error("DB write error in /calculate-price:", dbErr.message);
      }
    }

    return res.status(200).json(responseBody);
  } catch (error) {
    return next(error);
  }
}

module.exports = { calculatePriceHandler };
