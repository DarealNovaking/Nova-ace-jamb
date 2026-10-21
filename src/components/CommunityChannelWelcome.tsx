import { useEffect, useRef, useState } from 'react'
import type { AuthChangeEvent, User } from '@supabase/supabase-js'
import StudentAuth from './StudentAuth'
import StudentOnboarding from './StudentOnboarding'
import { onAuthStateChange } from '../lib/authService'
import {
  getStudentPreferences,
  getStudentProfile,
  getStudentSubjects,
} from '../lib/studentService'
import { ace } from '../lib/supabase'
import { registerCurrentDevice } from '../lib/deviceService'
import StudentDashboard from './StudentDashboard'
import CommunityChannelWelcome from './CommunityChannelWelcome'

function hasRecoverySession() {
  return window.location.hash.includes('type=recovery')
}

export default function StudentFoundationGate() {
  const [user, setUser] = useState<User | null>(null)
  const [checking, setChecking] = useState(true)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)
  const [needsCommunityGate, setNeedsCommunityGate] = useState(false)
  const [recovery, setRecovery] = useState(hasRecoverySession)
  const [error, setError] = useState<string | null>(null)
  const refreshSequence = useRef(0)

  const refresh = async (nextUser: User | null, authEvent?: AuthChangeEvent) => {
    const sequence = ++refreshSequence.current
    setUser(nextUser)
    setError(null)
    if (authEvent === 'PASSWORD_RECOVERY') setRecovery(true)
    if (!nextUser) {
      setNeedsOnboarding(false)
      setNeedsCommunityGate(false)
      setRecovery(false)
      setChecking(false)
      return
    }
    setChecking(true)
    try {
      const { data: isAdmin, error: roleError } = await ace.rpc('is_admin')
      if (sequence !== refreshSequence.current) return
      if (roleError) throw roleError
      if (isAdmin) {
        window.location.assign('/admin')
        return
      }

      // Content editors use the separate academic workspace, not full admin tools.
      try {
        const { data: isEditor, error: editorRoleError } = await ace.rpc('is_admin_or_editor')
        if (sequence !== refreshSequence.current) return
        if (!editorRoleError && isEditor) {
          window.location.assign('/admin-academic')
          return
        }
      } catch {
        // Role lookup failure must not block the ordinary student journey.
      }

      await registerCurrentDevice()
      if (sequence !== refreshSequence.current) return
      let profile
      try {
        profile = await getStudentProfile()
        if (sequence !== refreshSequence.current) return
      } catch (profileError) {
        if (sequence !== refreshSequence.current) return
        const code = (profileError as { code?: string })?.code
        if (code === 'PGRST116') {
          setNeedsOnboarding(true)
          return
        }
        throw profileError
      }

      const [preferences, subjects] = await Promise.all([
        getStudentPreferences().catch((preferenceError: unknown) => {
          // A new account may not have a preferences row until onboarding saves it.
          if (typeof preferenceError === 'object' && preferenceError !== null && 'code' in preferenceError && preferenceError.code === 'PGRST116') return null
          throw preferenceError
        }),
        getStudentSubjects(),
      ])
      if (sequence !== refreshSequence.current) return

      setNeedsOnboarding(
        !profile.display_name ||
        profile.target_score === null ||
        !preferences?.daily_minutes ||
        subjects.length !== 4,
      )
    } catch (caught) {
      if (sequence !== refreshSequence.current) return
      setNeedsOnboarding(false)
      // Keep internal database/provider details out of the student-facing UI.
      setError('We could not load your saved preparation profile. Check your connection and try again.')
    } finally {
      if (sequence === refreshSequence.current) setChecking(false)
    }
  }

  useEffect(() => {
    let active = true
    // Subscribe before resolving initial UI state. Supabase emits INITIAL_SESSION
    // from its persisted local session; a parallel getUser() network probe can
    // race that callback and even clear a newer session after a stale 401.
    const { data } = onAuthStateChange((nextUser, _session, event) => {
      if (!active) return
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'PASSWORD_RECOVERY') {
        // Defer Supabase requests until its auth-state callback releases the internal lock.
        window.setTimeout(() => { if (active) void refresh(nextUser, event) }, 0)
      }
    })
    return () => { active = false; data.subscription.unsubscribe() }
  }, [])

  if (checking) return <div className="grid min-h-screen place-items-center bg-[#07050d] text-white"><p className="text-white/60">Preparing your ACE account…</p></div>
  if (error) return <div className="grid min-h-screen place-items-center bg-[#07050d] px-6 text-white"><div className="max-w-md text-center"><h1 className="text-xl font-semibold">We couldn’t prepare your account</h1><p className="mt-2 text-sm text-white/60">{error}</p><button type="button" onClick={() => void refresh(user)} className="mt-5 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black">Try again</button></div></div>
  if (recovery) return <StudentAuth recovery />
  if (!user) return <StudentAuth />
  if (needsOnboarding) return <StudentOnboarding onComplete={() => { setNeedsOnboarding(false); setNeedsCommunityGate(true) }} />
  if (needsCommunityGate) return <CommunityChannelWelcome onContinue={() => { setNeedsCommunityGate(false); void refresh(user) }} />
  return <StudentDashboard />
}
