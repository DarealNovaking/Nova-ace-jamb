import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL ?? 'https://uokiqlgmzprqfbzmedaz.supabase.co'
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? 'sb_publishable_SPvkXHL06uOubaWtKT3iSQ_nKD0hwYC'

export const supabase = createClient(url, publishableKey)
export const ace = supabase.schema('ace')
