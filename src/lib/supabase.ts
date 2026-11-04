import { createClient } from '@supabase/supabase-js';

// Publishable key is safe in the browser. Fallbacks keep local/Vercel working
// even if VITE_* env vars were not injected at build time.
const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ||
  'https://gnrxjzzokgtyxodkxtro.supabase.co';

const supabaseKey =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined)?.trim() ||
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ||
  'sb_publishable_LYwPHCKWZdHr5BIXeFV-LA_qbZ2A4js';

export const supabaseConfig = {
  url: supabaseUrl,
  hasKey: Boolean(supabaseKey),
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      apikey: supabaseKey,
    },
  },
});

/** Seeded room id from schema.sql — used when present, else first room is loaded. */
export const DEFAULT_ROOM_ID = '00000000-0000-0000-0000-000000000001';
