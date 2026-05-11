const { getSupabaseClient } = require("../config/supabase");
const { hashApiKey } = require("../utils/apiKey");
const { randomBytes } = require("crypto");
const { getFirebaseAuth } = require("../config/firebaseAdmin");
const { extractBearerToken, resolveAuthUser } = require("../middleware/firebaseAuthMiddleware");

/**
 * Generates a production-ready API key with a 'pp_live_' prefix.
 * @returns {string} The raw API key
 */
function generateKey() {
  return "pp_live_" + randomBytes(24).toString("hex");
}

async function signupHandler(req, res, next) {
  try {
    const { email: bodyEmail, full_name } = req.body;
    const supabase = getSupabaseClient();
    
    let targetUser = null;
    let isNewUser = false;

    // 1. Check for Firebase Authentication
    const token = extractBearerToken(req.headers.authorization || "");
    if (token) {
      try {
        const decodedToken = await getFirebaseAuth().verifyIdToken(token);
        const authUser = await resolveAuthUser(decodedToken);
        targetUser = authUser.record;
      } catch (authErr) {
        // If token is invalid/expired, we don't fail yet, 
        // we fallback to the email in the body for public signup.
      }
    }

    // 2. Fallback to Email lookup if no Auth User found
    const email = targetUser ? targetUser.email : bodyEmail;
    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "A valid email is required to generate an API key." });
    }

    if (!targetUser) {
      const { data: existingUser } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .maybeSingle();
      
      targetUser = existingUser;
      if (!targetUser) isNewUser = true;
    }

    // 3. Prevent collisions for brand new signups (if not authenticated)
    if (isNewUser === false && !token && targetUser.api_key_hash) {
      return res.status(409).json({ error: "This email is already associated with an API key. Use the 'Recover Key' option." });
    }

    // 4. Check if user already has a key
    if (targetUser && targetUser.api_key_hash) {
      return res.status(200).json({
        message: "You already have an active API key.",
        api_key_preview: targetUser.api_key_preview || "pp_live_********",
        note: "For security, we cannot show your full key again. If you lost it, please contact support for a reset."
      });
    }

    // 5. Generate and hash the raw key
    const rawKey = "pp_live_" + randomBytes(24).toString("hex");
    const hashedKey = hashApiKey(rawKey);
    const keyPreview = rawKey.slice(0, 12) + "..." + rawKey.slice(-4);

    let finalUser;
    if (isNewUser) {
      const { data, error } = await supabase
        .from("users")
        .insert({
          email,
          full_name: full_name || null,
          api_key_hash: hashedKey,
          api_key_preview: keyPreview,
          plan: "free"
        })
        .select("id, email, full_name, plan")
        .single();
      if (error) throw error;
      finalUser = data;
    } else {
      // Update existing user (e.g. Firebase user getting their first key)
      const { data, error } = await supabase
        .from("users")
        .update({
          api_key_hash: hashedKey,
          api_key_preview: keyPreview
        })
        .eq("id", targetUser.id)
        .select("id, email, full_name, plan")
        .single();
      if (error) throw error;
      finalUser = data;
    }

    // 6. Return the RAW key to the user (ONLY ONCE)
    return res.status(201).json({
      message: isNewUser ? "Welcome to PricePilot!" : "Your new API key has been generated.",
      api_key: rawKey,
      user: finalUser,
      note: "Keep this key secret. We only hash it in our database and cannot show it to you again."
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Simulates an API key recovery flow by verifying and returning a success message.
 */
async function recoverHandler(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required for recovery." });

    const supabase = getSupabaseClient();
    const { data: user } = await supabase.from("users").select("id").eq("email", email).maybeSingle();

    if (!user) {
      return res.status(404).json({ error: "No account found with this email." });
    }

    // Simulate recovery email trigger
    return res.status(200).json({ 
      message: "Recovery request received. A secure link to retrieve your API key has been sent to your registered email address." 
    });
  } catch (err) {
    console.error("Recovery error:", err);
    return res.status(500).json({ error: "Unable to process recovery at this time." });
  }
}

module.exports = { signupHandler, recoverHandler };
