const { getSupabaseClient } = require("../config/supabase");
const { normalizeDomain } = require("../utils/domain");

// Lightweight in-memory cache for domain-user mapping and spikes
// Key: domain, Value: { primary_user_id, recent_requests: [], last_checked: timestamp }
const domainCache = new Map();
const CACHE_TTL = 30 * 1000; // 30 seconds
const SPIKE_THRESHOLD = 50;  // Requests in CACHE_TTL window
const SCORE_LIMIT_HARD = 80;
const SCORE_LIMIT_SOFT = 40;

async function domainAbuseMiddleware(req, res, next) {
  try {
    const user = req.authUser;
    if (!user || !user.id) return next();

    const supabase = getSupabaseClient();
    
    // 1. Extract and Normalize Domain
    const rawOrigin = req.headers.origin || req.headers.referer || "";
    const domain = normalizeDomain(rawOrigin);

    // If no domain is detectable from browser headers, we might be in a server-to-server call.
    // In that case, we rely on the API Key binding alone for now, but log it as 'headless'.
    if (!domain) {
      // Small penalty for headless calls if not on a Pro plan
      if (user.plan === "free") {
        await updateAbuseScore(user.id, 1, "headless_request", { path: req.path });
      }
      return next();
    }

    req.detectedDomain = domain;

    // 2. Check Cache for Speed
    let domainInfo = domainCache.get(domain);
    const now = Date.now();

    if (!domainInfo || (now - domainInfo.last_checked > CACHE_TTL)) {
      // Sync with DB
      const { data: registry } = await supabase
        .from("domain_registry")
        .select("*")
        .eq("domain", domain)
        .maybeSingle();

      if (registry) {
        domainInfo = { 
          primary_user_id: registry.primary_user_id, 
          requests: (domainInfo?.requests || 0), 
          last_checked: now 
        };
      } else {
        // Self-register the domain to this user if it's the first time we see it
        await supabase.from("domain_registry").insert({
          domain,
          primary_user_id: user.id
        });
        domainInfo = { primary_user_id: user.id, requests: 0, last_checked: now };
      }
      domainCache.set(domain, domainInfo);
    }

    // 3. STRICT Domain Ownership Enforcement
    if (domainInfo.primary_user_id && domainInfo.primary_user_id !== user.id) {
      // Immediate rejection for cross-account domain usage
      await updateAbuseScore(user.id, 20, "unauthorized_domain_takeover_attempt", { domain, owner: domainInfo.primary_user_id });
      
      return res.status(403).json({
        error: "Domain ownership conflict",
        message: `This domain (${domain}) is already registered to another PricePilot account. If you believe this is an error, please contact support.`,
        code: "DOMAIN_OWNERSHIP_CONFLICT",
        domain: domain,
        suggested_action: "Ensure your request origin matches the domain registered in your dashboard."
      });
    }

    // 4. Spike Detection
    domainInfo.requests++;
    if (domainInfo.requests > SPIKE_THRESHOLD) {
      await updateAbuseScore(user.id, 10, "traffic_spike", { domain, count: domainInfo.requests });
      domainInfo.requests = 0; // Reset after penalty
    }

    // 5. Enforcement
    const currentScore = user.record?.abuse_score || 0;
    
    if (currentScore >= SCORE_LIMIT_HARD) {
      return res.status(403).json({
        error: "Access suspended due to suspicious activity",
        code: "ABUSE_HARD_BLOCK"
      });
    }

    if (currentScore >= SCORE_LIMIT_SOFT) {
      // Slow down the request artificially (Soft penalty)
      await new Promise(r => setTimeout(r, 200));
      res.setHeader("X-PricePilot-Abuse-Score", currentScore);
    }

    next();

  } catch (err) {
    console.error("[Domain Abuse Middleware Error]:", err.message);
    next(); // Don't block requests if the abuse engine has an error
  }
}

/**
 * Updates the abuse score for a user and logs the event.
 */
async function updateAbuseScore(userId, delta, type, metadata) {
  const supabase = getSupabaseClient();
  
  try {
    // 1. Log event
    await supabase.from("abuse_events").insert({
      user_id: userId,
      event_type: type,
      score_delta: delta,
      metadata
    });

    // 2. Increment user score
    const { data: updated } = await supabase.rpc('increment_abuse_score', { 
      row_id: userId, 
      delta 
    });
    
    return updated;
  } catch (err) {
    console.error("Failed to update abuse score:", err.message);
  }
}

module.exports = domainAbuseMiddleware;
