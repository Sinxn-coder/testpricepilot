const { getSupabaseClient } = require("../config/supabase");

const PLAN_LIMITS = {
  free: 1500,
  starter: 15000,
  growth: 50000,
  pro: 1000000
};

// Simple short-lived cache for usage counts
const countCache = new Map();
const CACHE_TTL = 10 * 1000; // 10 seconds

function getMonthWindow() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { start: start.toISOString(), end: end.toISOString() };
}

async function rateLimitMiddleware(req, res, next) {
  try {
    const user = req.authUser;
    if (!user || !user.id) {
      req.rateLimit = { plan: "free", limit: PLAN_LIMITS.free, used: 0 };
      return next();
    }

    const plan = (user.plan || "free").toLowerCase();
    const requestLimit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
    const cacheKey = `${user.id}_${new Date().getUTCMonth()}`;

    // 1. Check Cache
    const cached = countCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now() && cached.count < requestLimit) {
      req.rateLimit = { plan, limit: requestLimit, used: cached.count };
      return next();
    }

    const { start, end } = getMonthWindow();
    const supabase = getSupabaseClient();

    // 2. Query DB (removed expensive ilike)
    const { count, error } = await supabase
      .from("usage_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", start)
      .lt("created_at", end);

    if (error) return next(error);

    const used = count || 0;
    countCache.set(cacheKey, { count: used, expiresAt: Date.now() + CACHE_TTL });

    // 4. Domain-level check (Aggregate usage across all accounts using this domain)
    let domainUsed = 0;
    if (req.detectedDomain) {
      const domainCacheKey = `dom_${req.detectedDomain}_${new Date().getUTCMonth()}`;
      const cachedDomain = countCache.get(domainCacheKey);
      
      if (cachedDomain && cachedDomain.expiresAt > Date.now()) {
        domainUsed = cachedDomain.count;
      } else {
        const { count: dCount } = await supabase
          .from("usage_logs")
          .select("id", { count: "exact", head: true })
          .eq("domain", req.detectedDomain)
          .gte("created_at", start)
          .lt("created_at", end);
        
        domainUsed = dCount || 0;
        countCache.set(domainCacheKey, { count: domainUsed, expiresAt: Date.now() + CACHE_TTL });
      }
    }

    const effectiveUsed = Math.max(used, domainUsed);

    if (effectiveUsed >= requestLimit) {
      return res.status(429).json({
        error: effectiveUsed === domainUsed && effectiveUsed !== used ? "Domain-wide request limit reached" : "Monthly request limit reached",
        plan,
        limit: requestLimit,
        is_domain_block: effectiveUsed === domainUsed && effectiveUsed !== used
      });
    }

    req.rateLimit = { plan, limit: requestLimit, used: effectiveUsed };
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = rateLimitMiddleware;
