import { createClient } from '@supabase/supabase-js';
import { hasConfiguredBackend, supabaseAnonKey, supabaseUrl } from '../config';
import type { Database } from '../types/database';

export const supabase = hasConfiguredBackend
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

export function assertBackendReady() {
  if (!supabase) {
    throw new Error('Backend não configurado. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
  }
  return supabase;
}
