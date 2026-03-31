const { getSupabaseClient } = require("../config/supabase");

/**
 * usageMiddleware
 * Logs every API request to the 'usage_logs' table for tracking and billing.
 * Assumes authMiddleware has already run and attached 'authUser' to 'req'.
 */
async function usageMiddleware(req, res, next) {
  // Move to next middleware immediately so we don't block the response
  // We'll log the request asynchronously
  next();

  try {
    const user = req.authUser;
    if (!user) return; // Only log authenticated requests

    const supabase = getSupabaseClient();
    
    const logData = {
      user_id: user.id,
      endpoint: req.path,
      method: req.method,
      status_code: res.statusCode || 200,
      request_count: 1,
      ip_address: req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress,
      user_agent: req.headers["user-agent"],
      created_at: new Date().toISOString()
    };

    // Fire and forget logging
    const { error } = await supabase
      .from("usage_logs")
      .insert(logData);

    if (error) {
      console.error("[Usage Tracking Error]:", error.message);
    }
  } catch (err) {
    console.error("[Usage Tracking Exception]:", err.message);
  }
}

module.exports = usageMiddleware;
