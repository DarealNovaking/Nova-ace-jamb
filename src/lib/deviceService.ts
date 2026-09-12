import { ace, supabase } from './supabase'

const DEVICE_SEED_KEY = 'nova-ace-jamb-device-seed'

async function getDeviceHash() {
  let seed = localStorage.getItem(DEVICE_SEED_KEY)
  if (!seed) {
    seed = crypto.randomUUID()
    localStorage.setItem(DEVICE_SEED_KEY, seed)
  }
  const bytes = new TextEncoder().encode(seed)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function registerCurrentDevice() {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError
  if (!userData.user) throw new Error('Authentication required')

  const deviceHash = await getDeviceHash()
  const { data, error } = await ace.from('devices').upsert({
    user_id: userData.user.id,
    device_hash: deviceHash,
    platform: navigator.userAgent.slice(0, 160),
    app_version: import.meta.env.VITE_APP_VERSION ?? null,
    last_seen_at: new Date().toISOString(),
  }, { onConflict: 'user_id,device_hash' }).select('id,user_id,device_hash,platform,app_version,last_seen_at').single()
  if (error) throw error
  return data
}
