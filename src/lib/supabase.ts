import { createClient, SupabaseClient } from "@supabase/supabase-js";

type DbClient = SupabaseClient;

let cachedClient: DbClient | null = null;

export function getSupabaseClient(): DbClient {
  if (cachedClient) return cachedClient;

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Please add them to your environment."
    );
  }

  cachedClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return cachedClient;
}
