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
import App from '../App'

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
        getStudentPreferences(),
        getStudentSubjects(),
      ])

      setNeedsOnboarding(
        !profile.display_name ||
        profile.target_score === null ||
        !profile.institution ||
        !profile.course ||
        !preferences.daily_minutes ||
        subjects.length < 1,
      )
    } catch (caught) {
      setNeedsOnboarding(false)
      setError(caught instanceof Error ? caught.message : 'Unable to prepare your ACE account. Please try again.')
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
  return <App />
}
