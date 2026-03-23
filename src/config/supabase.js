const { createClient } = require("@supabase/supabase-js");
const env = require("./env");

let client = null;

function getSupabaseClient() {
  if (!env.hasSupabaseConfig()) {
    const error = new Error(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
    error.status = 503;
    throw error;
  }

  if (!client) {
    client = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: {
        persistSession: false
      }
    });
  }

  return client;
}

module.exports = { getSupabaseClient };
