/**
 * taxService.js
 * Handles VAT/GST lookup, tax calculation, and psychological price optimization.
 */

// Mock data removed. Supabase is now mandatory for production-ready data.

/**
 * Fetch the tax rate (%) for a country.
 * Tries Supabase first; falls back to the in-memory mock.
 *
 * @param {string} country  ISO-3166-1 alpha-2 country code (e.g. "US")
 * @param {object|null} supabase  Supabase client (may be null in mock mode)
 * @returns {Promise<number>} tax rate as a percentage, e.g. 18 for 18%
 */
async function getTaxRate(country, supabase) {
  const code = String(country || "").toUpperCase();

  if (!supabase) {
    const error = new Error("Database connection required for tax lookup.");
    error.status = 503;
    throw error;
  }

  const { data, error } = await supabase
    .from("tax_rates")
    .select("tax_percentage")
    .eq("country_code", code)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch tax rate for ${code}: ${error.message}`);
  }

  if (!data) {
    const error = new Error(`Tax rate for country '${code}' not found in database.`);
    error.status = 404;
    throw error;
  }

  return Number(data.tax_percentage);
}

/**
 * Apply tax to a base price.
 *
 * @param {number} basePrice
 * @param {number} taxRate  percentage, e.g. 18
 * @returns {{ taxAmount: number, taxedPrice: number }}
 */
function applyTax(basePrice, taxRate) {
  const taxAmount = roundTo2(basePrice * (taxRate / 100));
  const taxedPrice = roundTo2(basePrice + taxAmount);
  return { taxAmount, taxedPrice };
}

/**
 * Adjust a price to the nearest psychological value (.99 or .95),
 * rounding DOWN first (better for conversion), then UP if margin would be breached.
 * The result always ends in .99 or .95.
 *
 * @param {number} taxedPrice       Price after tax
 * @param {number} basePrice        Original base price (before tax)
 * @param {number} minMarginPct     Minimum margin the seller must retain (percentage)
 * @returns {number} optimized price (always ends in .99 or .95)
 */
function applyPsychologicalPricing(taxedPrice, basePrice, minMarginPct) {
  // Minimum we can charge = basePrice + required profit margin
  const minAllowedPrice = roundTo2(basePrice * (1 + minMarginPct / 100));

  /**
   * Returns [dollar.99, dollar.95] for a given integer dollar amount.
   */
  function candidatesFor(dollar) {
    return [roundTo2(dollar + 0.99), roundTo2(dollar + 0.95)];
  }

  // Walk from floor upward until we find a .99/.95 candidate >= minAllowedPrice.
  // In the vast majority of cases this terminates on the first or second iteration.
  const floor = Math.floor(taxedPrice);
  for (let dollar = floor; dollar <= floor + 100; dollar++) {
    for (const candidate of candidatesFor(dollar)) {
      if (candidate >= minAllowedPrice) {
        return candidate;
      }
    }
  }

  // Absolute fallback (should never be reached in practice)
  return minAllowedPrice;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function roundTo2(value) {
  return Number(value.toFixed(2));
}

module.exports = {
  getTaxRate,
  applyTax,
  applyPsychologicalPricing
};
