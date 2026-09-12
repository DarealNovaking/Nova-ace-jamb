import { supabase } from './supabase'

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data.user
}

export async function requestMagicLink(email: string) {
  const normalized = email.trim().toLowerCase()
  if (!normalized || !normalized.includes('@')) throw new Error('Enter a valid email address.')
  const { error } = await supabase.auth.signInWithOtp({
    email: normalized,
    options: { emailRedirectTo: window.location.origin },
  })
  if (error) throw error
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export function onAuthStateChange(callback: (user: ReturnType<typeof supabase.auth.getUser> extends Promise<infer _> ? any : never) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => callback(session?.user ?? null))
}
