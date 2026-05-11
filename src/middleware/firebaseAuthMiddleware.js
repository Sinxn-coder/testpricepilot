const { getFirebaseAuth } = require("../config/firebaseAdmin");
const { getSupabaseClient } = require("../config/supabase");

// Simple short-lived cache to reduce DB load for repeat requests
// Key: firebaseUid, Value: { authUser, expiresAt }
const userCache = new Map();
const CACHE_TTL = 60 * 1000; // 60 seconds
const MAX_CACHE_SIZE = 1000;

function extractBearerToken(authorizationHeader = "") {
  const [scheme, token] = authorizationHeader.split(" ");
  return (scheme === "Bearer" && token) ? token : null;
}

async function resolveAuthUser(decodedToken) {
  const firebaseUid = decodedToken.uid;
  const email = decodedToken.email;

  if (!firebaseUid || !email) {
    const error = new Error("Firebase token must include uid and email");
    error.statusCode = 401;
    throw error;
  }

  // 1. Check Cache First
  const cached = userCache.get(firebaseUid);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.authUser;
  }

  const supabase = getSupabaseClient();
  const userColumns = "id, firebase_uid, email, plan, is_blocked, block_reason, created_at";

  // 2. Optimized Lookup: Try UID first
  let { data: user, error: lookupError } = await supabase
    .from("users")
    .select(userColumns)
    .eq("firebase_uid", firebaseUid)
    .maybeSingle();

  if (lookupError) throw lookupError;

  // 3. Fallback to Email if UID not linked yet
  if (!user) {
    const { data: emailUser, error: emailErr } = await supabase
      .from("users")
      .select(userColumns)
      .eq("email", email)
      .maybeSingle();

    if (emailErr) throw emailErr;

    if (emailUser) {
      // Link Firebase UID to existing email user
      const { data: linkedUser, error: linkError } = await supabase
        .from("users")
        .update({ firebase_uid: firebaseUid })
        .eq("id", emailUser.id)
        .select(userColumns)
        .single();
      
      if (linkError) throw linkError;
      user = linkedUser;
    } else {
      // New user
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert({ firebase_uid: firebaseUid, email, plan: "free" })
        .select(userColumns)
        .single();

      if (insertError) throw insertError;
      user = newUser;
    }
  }

  // 4. Check if user is blocked
  if (user.is_blocked) {
    const error = new Error(user.block_reason || "Your account has been suspended for abuse.");
    error.statusCode = 403;
    throw error;
  }

  const authUser = {
    id: user.id,
    firebaseUid: user.firebase_uid,
    email: user.email,
    plan: user.plan || "free",
    createdAt: user.created_at,
    record: user
  };

  // 4. Update Cache (with basic size management)
  if (userCache.size >= MAX_CACHE_SIZE) {
    const firstKey = userCache.keys().next().value;
    userCache.delete(firstKey);
  }
  userCache.set(firebaseUid, { authUser, expiresAt: Date.now() + CACHE_TTL });

  return authUser;
}

async function firebaseAuthMiddleware(req, res, next) {
  const token = extractBearerToken(req.headers.authorization || "");

  if (!token) {
    return res.status(401).json({ error: "Missing or invalid authorization header" });
  }

  try {
    // Note: getFirebaseAuth().verifyIdToken(token) is already heavily cached by the SDK internally
    req.user = await getFirebaseAuth().verifyIdToken(token);
    const authUser = await resolveAuthUser(req.user);
    
    req.authUser = authUser;
    req.dbUser = authUser.record;

    return next();
  } catch (error) {
    const status = error.statusCode || 401;
    return res.status(status).json({ error: "Unauthorized" });
  }
}

module.exports = firebaseAuthMiddleware;
module.exports.extractBearerToken = extractBearerToken;
module.exports.resolveAuthUser = resolveAuthUser;
