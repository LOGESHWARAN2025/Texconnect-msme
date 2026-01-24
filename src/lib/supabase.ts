/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qjbtnlhndoddbxqznkpw.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqYnRubGhuZG9kZGJ4cXpua3B3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2OTg3NjAsImV4cCI6MjA3NjI3NDc2MH0.Aepe201bDztDqXyBP8M748igEJERHwKCGJL5-4EneHY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true, // Enable OAuth callback detection
    flowType: 'pkce',
    storage: window.localStorage,
    storageKey: 'supabase.auth.token'
  }
})
