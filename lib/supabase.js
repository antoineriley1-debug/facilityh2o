// Supabase client — optional. App falls back to file storage if not configured.
// To enable: add SUPABASE_URL and SUPABASE_ANON_KEY to .env.local

let supabaseClient = null;

export function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.log('[FacilityH2O] Supabase not configured — using file storage');
    return null;
  }

  try {
    // Dynamic import to avoid build errors when not installed
    const { createClient } = require('@supabase/supabase-js');
    supabaseClient = createClient(url, key);
    return supabaseClient;
  } catch {
    console.log('[FacilityH2O] @supabase/supabase-js not installed — using file storage');
    return null;
  }
}

export const isSupabaseEnabled = () =>
  !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
