import 'react-native-url-polyfill/auto';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { supabaseEnv } from '@/lib/env';
import { authStorage } from '@/lib/secure-store';

export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super('Supabase no está configurado.');
    this.name = 'SupabaseNotConfiguredError';
  }
}

export const supabase: SupabaseClient | null = supabaseEnv
  ? createClient(supabaseEnv.url, supabaseEnv.anonKey, {
      auth: {
        storage: authStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        flowType: 'pkce',
      },
    })
  : null;

export function getSupabase(): SupabaseClient {
  if (!supabase) {
    throw new SupabaseNotConfiguredError();
  }
  return supabase;
}
