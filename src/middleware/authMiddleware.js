const { getSupabaseClient } = require("../config/supabase");
const { hashApiKey, safeEqual } = require("../utils/apiKey");

async function authMiddleware(req, res, next) {
  try {
    const authorization = req.headers.authorization || "";
    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ error: "Missing or invalid authorization header" });
    }

    const hashedToken = hashApiKey(token);
    const supabase = getSupabaseClient();

    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, plan, api_key_hash")
      .eq("api_key_hash", hashedToken)
      .maybeSingle();

    if (error) {
      return next(error);
    }

    if (!user || !safeEqual(user.api_key_hash, hashedToken)) {
      return res.status(401).json({ error: "Invalid API key" });
    }

    req.authUser = {
      id: user.id,
      email: user.email,
      plan: user.plan
    };

    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = authMiddleware;
