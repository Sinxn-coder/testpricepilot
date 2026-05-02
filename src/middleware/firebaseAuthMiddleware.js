const { getFirebaseAuth } = require("../config/firebaseAdmin");
const { getSupabaseClient } = require("../config/supabase");

function extractBearerToken(authorizationHeader = "") {
  const [scheme, token] = authorizationHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

async function resolveAuthUser(decodedToken) {
  const firebaseUid = decodedToken.uid;
  const email = decodedToken.email;

  if (!firebaseUid || !email) {
    const error = new Error("Firebase token must include uid and email");
    error.statusCode = 401;
    throw error;
  }

  const supabase = getSupabaseClient();
  const userColumns = "id, firebase_uid, email, plan, created_at";

  const { data: firebaseUser, error: firebaseLookupError } = await supabase
    .from("users")
    .select(userColumns)
    .eq("firebase_uid", firebaseUid)
    .maybeSingle();

  if (firebaseLookupError) {
    throw firebaseLookupError;
  }

  if (firebaseUser) {
    return {
      id: firebaseUser.id,
      firebaseUid: firebaseUser.firebase_uid,
      email: firebaseUser.email,
      plan: firebaseUser.plan || "free",
      createdAt: firebaseUser.created_at,
      record: firebaseUser
    };
  }

  const { data: emailUser, error: emailLookupError } = await supabase
    .from("users")
    .select(userColumns)
    .eq("email", email)
    .maybeSingle();

  if (emailLookupError) {
    throw emailLookupError;
  }

  if (emailUser) {
    if (emailUser.firebase_uid && emailUser.firebase_uid !== firebaseUid) {
      const error = new Error("Email is already linked to a different Firebase user");
      error.statusCode = 401;
      throw error;
    }

    const { data: linkedUser, error: linkError } = await supabase
      .from("users")
      .update({ firebase_uid: firebaseUid })
      .eq("id", emailUser.id)
      .select(userColumns)
      .single();

    if (linkError) {
      throw linkError;
    }

    return {
      id: linkedUser.id,
      firebaseUid: linkedUser.firebase_uid,
      email: linkedUser.email,
      plan: linkedUser.plan || "free",
      createdAt: linkedUser.created_at,
      record: linkedUser
    };
  }

  const { data: newUser, error: insertError } = await supabase
    .from("users")
    .insert({
      firebase_uid: firebaseUid,
      email,
      plan: "free"
    })
    .select(userColumns)
    .single();

  if (insertError) {
    throw insertError;
  }

  return {
    id: newUser.id,
    firebaseUid: newUser.firebase_uid,
    email: newUser.email,
    plan: newUser.plan || "free",
    createdAt: newUser.created_at,
    record: newUser
  };
}

async function firebaseAuthMiddleware(req, res, next) {
  const token = extractBearerToken(req.headers.authorization || "");

  if (!token) {
    return res.status(401).json({ error: "Missing or invalid authorization header" });
  }

  try {
    req.user = await getFirebaseAuth().verifyIdToken(token);
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const authUser = await resolveAuthUser(req.user);
    req.authUser = authUser;
    req.dbUser = authUser.record;

    return next();
  } catch (error) {
    if (error.statusCode === 401) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    return next(error);
  }
}

module.exports = firebaseAuthMiddleware;
module.exports.extractBearerToken = extractBearerToken;
module.exports.resolveAuthUser = resolveAuthUser;
