const { getSupabaseClient } = require("../config/supabase");

const PLAN_LIMITS = {
  free: 500,
  starter: 5000,
  growth: 20000,
  pro: 100000
};

function getMonthWindow() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { start: start.toISOString(), end: end.toISOString() };
}

async function rateLimitMiddleware(req, res, next) {
  try {
    const user = req.authUser;
    const plan = user.plan || "free";
    const requestLimit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
    const { start, end } = getMonthWindow();
    const supabase = getSupabaseClient();

    const { count, error } = await supabase
      .from("usage_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", start)
      .lt("created_at", end);


    if (error) {
      return next(error);
    }

    const used = count || 0;
    if (used >= requestLimit) {
      return res.status(429).json({
        error: "Monthly request limit reached",
        plan,
        limit: requestLimit
      });
    }

    req.rateLimit = {
      plan,
      limit: requestLimit,
      used
    };

    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = rateLimitMiddleware;
