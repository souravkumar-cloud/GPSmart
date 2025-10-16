// lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

// ✅ Load environment variables from .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('❌ Missing Supabase environment variables! Please check your .env.local file.')
}

// ✅ Initialize Supabase client with proper session persistence and realtime config
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // ✅ Enable session persistence (prevents logout on refresh)
    autoRefreshToken: true, // ✅ Automatically refresh expired tokens
    detectSessionInUrl: true, // ✅ Detect auth callbacks in URL (for email confirmations, etc.)
  },
  realtime: {
    params: {
      eventsPerSecond: 10, // ✅ Limit connection attempts
    },
  },
  // ✅ Add global options to handle connection issues gracefully
  global: {
    headers: {
      'x-client-info': 'supabase-js-web',
    },
  },
})

// ✅ Optional convenience exports
export const auth = supabase.auth
export const storage = supabase.storage

// ✅ Database helper function
export const db = (table) => supabase.from(table) 