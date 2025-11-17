import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

let supabaseInstance: SupabaseClient | null = null;
let supabaseAdminInstance: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables:', {
      hasUrl: !!supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      allEnvKeys: Object.keys(process.env).filter(key => key.includes('SUPABASE')),
    });
    throw new Error('Missing Supabase environment variables. Please check your Vercel environment variables.');
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
}

function getSupabaseAdminClient(): SupabaseClient | null {
  if (supabaseAdminInstance) {
    return supabaseAdminInstance;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('[SUPABASE] Initializing admin client:', {
    hasUrl: !!supabaseUrl,
    hasServiceKey: !!supabaseServiceRoleKey,
    urlPrefix: supabaseUrl ? supabaseUrl.substring(0, 20) + '...' : 'MISSING',
    serviceKeyPrefix: supabaseServiceRoleKey ? supabaseServiceRoleKey.substring(0, 20) + '...' : 'MISSING',
  });

  if (!supabaseUrl) {
    console.error('[SUPABASE] Missing SUPABASE_URL environment variable');
    return null;
  }

  if (!supabaseServiceRoleKey) {
    console.error('[SUPABASE] Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
    return null;
  }

  supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  console.log('[SUPABASE] Admin client initialized successfully');
  return supabaseAdminInstance;
}

// Lazy exports using Proxy - only initializes when first accessed
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient();
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  }
});

export const supabaseAdmin = new Proxy({} as any, {
  get(_target, prop) {
    const admin = getSupabaseAdminClient();
    if (!admin) return null;
    const value = (admin as any)[prop];
    return typeof value === 'function' ? value.bind(admin) : value;
  }
}) as SupabaseClient | null;

export default supabase;
