const env = require("../config/env");

const store = new Map();

function buildCacheKey(payload) {
  const normalized = {
    base_price: payload.base_price,
    country: String(payload.country).toUpperCase(),
    currency: String(payload.currency).toUpperCase(),
    source: String(payload.source).toLowerCase()
  };

  return JSON.stringify(normalized);
}

function getCachedResult(key) {
  const item = store.get(key);
  if (!item) {
    return null;
  }

  if (Date.now() > item.expiresAt) {
    store.delete(key);
    return null;
  }

  return item.value;
}

function setCachedResult(key, value) {
  const ttlMs = env.cacheTtlSeconds * 1000;
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

module.exports = {
  buildCacheKey,
  getCachedResult,
  setCachedResult
};
