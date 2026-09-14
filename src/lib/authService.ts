import { supabase } from './supabase'
import type { AuthChangeEvent, User, Session } from '@supabase/supabase-js'

function normalizeEmail(email: string) {
  const normalized = email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error('Enter a valid email address.')
  }
  return normalized
}

function validatePassword(password: string) {
  if (password.length < 8) {
    throw new Error('Use a password with at least 8 characters.')
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const { data, error } = await supabase.auth.getUser()
  if (error) {
    if (error.message.toLowerCase().includes('session')) return null
    throw error
  }
  return data.user
}

export async function getCurrentSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

export async function signUpWithPassword(email: string, password: string) {
  const normalized = normalizeEmail(email)
  validatePassword(password)
  const { data, error } = await supabase.auth.signUp({
    email: normalized,
    password,
  })
  if (error) throw error
  return data
}

export async function signInWithPassword(email: string, password: string) {
  const normalized = normalizeEmail(email)
  if (!password) throw new Error('Enter your password.')
  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalized,
    password,
  })
  if (error) throw error
  return data
}

export async function requestPasswordReset(email: string) {
  const normalized = normalizeEmail(email)
  const { error } = await supabase.auth.resetPasswordForEmail(normalized, {
    redirectTo: window.location.origin,
  })
  if (error) throw error
}

export async function updatePassword(password: string) {
  validatePassword(password)
  const { data, error } = await supabase.auth.updateUser({ password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export function onAuthStateChange(callback: (user: User | null, session: Session | null, event: AuthChangeEvent) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user ?? null, session, event)
  })
}
