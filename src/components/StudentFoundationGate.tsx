import { useEffect, useState } from 'react'
import type { AuthChangeEvent, User } from '@supabase/supabase-js'
import StudentAuth from './StudentAuth'
import StudentOnboarding from './StudentOnboarding'
import { getCurrentUser, onAuthStateChange } from '../lib/authService'
import {
  getStudentPreferences,
  getStudentProfile,
  getStudentSubjects,
} from '../lib/studentService'
import { ace } from '../lib/supabase'
import { registerCurrentDevice } from '../lib/deviceService'
import StudentDashboard from './StudentDashboard'

function hasRecoverySession() {
  return window.location.hash.includes('type=recovery')
}

export default function StudentFoundationGate() {
  const [user, setUser] = useState<User | null>(null)
  const [checking, setChecking] = useState(true)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)
  const [recovery, setRecovery] = useState(hasRecoverySession)
  const [error, setError] = useState<string | null>(null)

  const refresh = async (nextUser: User | null, authEvent?: AuthChangeEvent) => {
    setUser(nextUser)
    setError(null)
    if (authEvent === 'PASSWORD_RECOVERY') setRecovery(true)
    if (!nextUser) {
      setNeedsOnboarding(false)
      setRecovery(false)
      setChecking(false)
      return
    }
    setChecking(true)
    try {
      const { data: isAdmin, error: roleError } = await ace.rpc('is_admin')
      if (roleError) throw roleError
      if (isAdmin) {
        window.location.assign('/admin')
        return
      }

      // Content editors use the separate academic workspace, not full admin tools.
      try {
        const { data: isEditor, error: editorRoleError } = await ace.rpc('is_admin_or_editor')
        if (!editorRoleError && isEditor) {
          window.location.assign('/admin-academic')
          return
        }
      } catch {
        // Role lookup failure must not block the ordinary student journey.
      }

      await registerCurrentDevice()
      let profile
      try {
        profile = await getStudentProfile()
      } catch (profileError) {
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

      setNeedsOnboarding(
        !profile.display_name ||
        profile.target_score === null ||
        !preferences?.daily_minutes ||
        subjects.length !== 4,
      )
    } catch (caught) {
      setNeedsOnboarding(false)
      // Keep internal database/provider details out of the student-facing UI.
      setError('We could not load your saved preparation profile. Check your connection and try again.')
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    let active = true
    getCurrentUser().then((currentUser) => {
      if (active) void refresh(currentUser)
    }).catch((caught) => {
      if (active) {
        setError(caught instanceof Error ? caught.message : 'Unable to check your session.')
        setChecking(false)
      }
    })
    const { data } = onAuthStateChange((nextUser, _session, event) => {
      if (!active) return
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'PASSWORD_RECOVERY') {
        void refresh(nextUser, event)
      }
    })
    return () => { active = false; data.subscription.unsubscribe() }
  }, [])

  if (checking) return <div className="grid min-h-screen place-items-center bg-[#07050d] text-white"><p className="text-white/60">Preparing your ACE account…</p></div>
  if (error) return <div className="grid min-h-screen place-items-center bg-[#07050d] px-6 text-white"><div className="max-w-md text-center"><h1 className="text-xl font-semibold">We couldn’t prepare your account</h1><p className="mt-2 text-sm text-white/60">{error}</p><button type="button" onClick={() => void refresh(user)} className="mt-5 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black">Try again</button></div></div>
  if (recovery) return <StudentAuth recovery />
  if (!user) return <StudentAuth />
  if (needsOnboarding) return <StudentOnboarding onComplete={() => void refresh(user)} />
  return <StudentDashboard />
}
