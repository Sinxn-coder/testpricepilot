const dotenv = require("dotenv");

dotenv.config();

function hasSupabaseConfig() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 8080),
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
  firebaseServiceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
  firebaseServiceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
  cacheTtlSeconds: Number(process.env.CACHE_TTL_SECONDS || 120),
  pricingEngineUrl: process.env.PRICING_ENGINE_URL || "https://engine.pricepilot.site",
  pricingEngineApiKey: process.env.PRICING_ENGINE_API_KEY,
  pricingEngineTimeoutMs: Number(process.env.PRICING_ENGINE_TIMEOUT_MS || 500),
  corsAllowedOrigins: process.env.CORS_ALLOWED_ORIGINS || "https://pricepilot.site,http://localhost:8080",
  apiBaseUrl: process.env.API_BASE_URL || "https://api.pricepilot.site",
  hasSupabaseConfig
};
