/* ============================================
   supabaseClient.js
   Vestige — Ashborne
   Initialises and exports a single Supabase client
   instance to be imported anywhere in the app
   that needs to talk to the database or auth
   ============================================ */

import { createClient } from '@supabase/supabase-js'

/* Pull the URL and key from environment variables
   so they are never hardcoded into source code */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/* Create and export the client — import this file
   anywhere you need to query the database */
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default supabase