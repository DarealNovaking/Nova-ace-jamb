import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL ?? 'https://uokiqlgmzprqfbzmedaz.supabase.co'
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!publishableKey) {
  throw new Error('VITE_SUPABASE_PUBLISHABLE_KEY is required for ACE JAMB.')
}

export const supabase = createClient(url, publishableKey)
export const ace = supabase.schema('ace')
