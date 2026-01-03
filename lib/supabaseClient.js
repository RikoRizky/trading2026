// lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

// Ambil dari file .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Export instance supaya bisa dipakai di semua file
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
