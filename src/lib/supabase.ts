import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export interface Config {
  url: string
  anonKey: string
  listKey: string
}

function readConfig(): Config | null {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim()
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()
  const listKey = import.meta.env.VITE_LIST_KEY?.trim()
  return url && anonKey && listKey ? { url, anonKey, listKey } : null
}

export const config = readConfig()

export const supabase: SupabaseClient | null = config
  ? createClient(config.url, config.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { 'x-ntb-source': 'web' } },
    })
  : null
