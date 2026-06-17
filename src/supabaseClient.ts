import { createClient } from '@supabase/supabase-js';

// Retrieve credentials from environment variables or custom localStorage inputs
export function getSupabaseCredentials() {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

  const localUrl = localStorage.getItem('cams_supabase_url');
  const localKey = localStorage.getItem('cams_supabase_anon_key');

  const url = (localUrl || envUrl || '').trim();
  const key = (localKey || envKey || '').trim();

  return { url, key };
}

export function isSupabaseConfigured() {
  const { url, key } = getSupabaseCredentials();
  return !!(url && key && (url.startsWith('http://') || url.startsWith('https://')));
}

// Dynamic initialization of Supabase client to support changing credentials at runtime
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (supabaseInstance) return supabaseInstance;

  const { url, key } = getSupabaseCredentials();
  if (!url || !key || (!url.startsWith('http://') && !url.startsWith('https://'))) {
    return null;
  }

  try {
    supabaseInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    });
    return supabaseInstance;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    return null;
  }
}

// Reset instance to allow re-creating after changing credentials in Settings
export function resetSupabaseClient() {
  supabaseInstance = null;
}
