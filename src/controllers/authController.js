const { getSupabaseClient } = require("../config/supabase");
const { hashApiKey } = require("../utils/apiKey");
const { randomBytes } = require("crypto");

/**
 * Generates a production-ready API key with a 'pp_live_' prefix.
 * @returns {string} The raw API key
 */
function generateKey() {
  return "pp_live_" + randomBytes(24).toString("hex");
}

async function signupHandler(req, res, next) {
  try {
    const { email, full_name } = req.body;

    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "A valid email is required to generate an API key." });
    }

    const supabase = getSupabaseClient();

    // 1. Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingUser) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    // 2. Generate and hash the raw key
    const rawKey = generateKey();
    const hashedKey = hashApiKey(rawKey);

    // 3. Create user in database
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({
        email,
        full_name: full_name || null,
        api_key: hashedKey,
        plan: "free"
      })
      .select("id, email, full_name, plan")
      .single();

    if (insertError) {
      throw insertError;
    }

    // 4. Return the RAW key to the user (ONLY ONCE)
    return res.status(201).json({
      message: "Welcome to PricePilot! Your API key has been generated.",
      api_key: rawKey,
      user: newUser,
      note: "Keep this key secret. We only hash it in our database and cannot show it to you again."
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { signupHandler };
