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
      return res.status(409).json({ error: "This email is already associated with an API key. Re-use your existing key or contact support for a reset." });
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
        api_key_hash: hashedKey,
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

async function resetKeyHandler(req, res, next) {
  try {
    const { email } = req.body;

    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "A valid email is required to reset an API key." });
    }

    const supabase = getSupabaseClient();

    // 1. Verify user exists
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (!user) {
      return res.status(404).json({ error: "No account found with this email. Please register first." });
    }

    // 2. Generate new key
    const rawKey = generateKey();
    const hashedKey = hashApiKey(rawKey);

    // 3. Update in database
    const { error: updateError } = await supabase
      .from("users")
      .update({ api_key_hash: hashedKey })
      .eq("email", email);

    if (updateError) {
      throw updateError;
    }

    // 4. Return new raw key
    return res.status(200).json({
      message: "Success! Your API key has been rotated and updated.",
      api_key: rawKey,
      note: "Your previous key is now invalid. Update your environment variables immediately."
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { signupHandler, resetKeyHandler };
