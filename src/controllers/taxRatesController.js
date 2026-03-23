/**
 * taxRatesController.js
 * Handles GET /tax-rates — public endpoint, no auth required.
 * Returns all country tax rates (transparent pricing principle).
 */

const { getSupabaseClient } = require("../config/supabase");
const { MOCK_TAX_RATES } = require("../services/taxService");

async function taxRatesHandler(req, res, next) {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("tax_rates")
      .select("country_code, country_name, tax_percentage, tax_type")
      .order("country_name", { ascending: true });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: "No tax rates found in database." });
    }

    return res.status(200).json({ tax_rates: data });
  } catch (error) {
    return next(error);
  }
}

module.exports = { taxRatesHandler };
