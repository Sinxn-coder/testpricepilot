const loadManager = require("../utils/loadManager");

/**
 * priorityMiddleware
 * Enforces tiered load-shedding to prioritise paid users.
 * Executes before any expensive database or processing logic.
 */
async function priorityMiddleware(req, res, next) {
  const user = req.authUser;
  if (!user) return next(); // Fallback if auth check is skipped

  const plan = (user.plan || "free").toLowerCase();
  const currentLoad = loadManager.getActiveCount();

  // Master Tier Priorities
  const isShed = (
    (plan === "free" && currentLoad >= 30) ||
    (plan === "starter" && currentLoad >= 100) ||
    (plan === "growth" && currentLoad >= 250) ||
    (currentLoad >= 500) // System limit for everyone
  );

  if (isShed) {
    return res.status(503).json({
      error: "System under heavy load",
      code: "PRIORITY_SHELTER",
      message: `Access for ${plan.toUpperCase()} tier is temporarily paused during high traffic. Upgrade for priority access.`,
      retry_after: 5,
      active_load: currentLoad
    });
  }

  next();
}

module.exports = priorityMiddleware;
