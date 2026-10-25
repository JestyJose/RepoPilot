import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// Supports Supabase's current React/Vite naming convention VITE_SUPABASE_PUBLISHABLE_KEY, with fallback to VITE_SUPABASE_ANON_KEY
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = () => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseKey) &&
    supabaseUrl !== 'https://your-project.supabase.co' &&
    supabaseKey !== 'your_supabase_publishable_key_here' &&
    supabaseKey !== 'your_supabase_anon_key_here' &&
    supabaseUrl.trim() !== '' &&
    supabaseKey.trim() !== ''
  );
};

// Initialize Supabase client if valid credentials are provided
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;
