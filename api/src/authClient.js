import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

export function getSupabaseClientWithAuth(req) {
  const token = req.headers.authorization
  if (!token) return null

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[supabase] Missing SUPABASE_URL or SUPABASE_ANON_KEY env vars')
    return null
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: token } }
  })
}
