function isValidNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function validateOptimizePricePayload(payload) {
  const errors = [];

  if (!isValidNumber(payload.base_price) || payload.base_price <= 0) {
    errors.push("base_price must be a positive number");
  }

  if (!payload.country || typeof payload.country !== "string") {
    errors.push("country is required and must be a string");
  }

  if (!payload.currency || typeof payload.currency !== "string") {
    errors.push("currency is required and must be a string");
  }

  if (!payload.source || typeof payload.source !== "string") {
    errors.push("source is required and must be a string");
  }

  if (payload.user_id && typeof payload.user_id !== "string") {
    errors.push("user_id must be a string if provided");
  }

  return errors;
}

function validateTrackConversionPayload(payload) {
  const errors = [];

  if (!isValidNumber(payload.price_shown) || payload.price_shown <= 0) {
    errors.push("price_shown must be a positive number");
  }

  if (typeof payload.converted !== "boolean") {
    errors.push("converted must be a boolean");
  }

  if (!payload.source || typeof payload.source !== "string") {
    errors.push("source is required and must be a string");
  }

  if (!payload.country || typeof payload.country !== "string") {
    errors.push("country is required and must be a string");
  }

  return errors;
}

/**
 * Validates the payload for POST /calculate-price.
 * Required: base_price (positive number), country (string), currency (string),
 *           min_margin (0-100 number)
 */
function validateCalculatePricePayload(payload) {
  const errors = [];

  if (!isValidNumber(payload.base_price) || payload.base_price <= 0) {
    errors.push("base_price must be a positive number");
  }

  if (!payload.country || typeof payload.country !== "string") {
    errors.push("country is required and must be a string (ISO-3166-1 alpha-2)");
  }

  if (!payload.currency || typeof payload.currency !== "string") {
    errors.push("currency is required and must be a string");
  }

  if (!isValidNumber(payload.min_margin) || payload.min_margin < 0 || payload.min_margin > 100) {
    errors.push("min_margin must be a number between 0 and 100");
  }

  return errors;
}

module.exports = {
  validateOptimizePricePayload,
  validateTrackConversionPayload,
  validateCalculatePricePayload
};
