import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import StudentAuth from './StudentAuth'
import StudentOnboarding from './StudentOnboarding'
import { getCurrentUser, onAuthStateChange } from '../lib/authService'
import { getStudentProfile } from '../lib/studentService'
import { registerCurrentDevice } from '../lib/deviceService'
import App from '../App'

export default function StudentFoundationGate() {
  const [user, setUser] = useState<User | null>(null)
  const [checking, setChecking] = useState(true)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = async (nextUser: User | null) => {
    setUser(nextUser)
    setError(null)
    if (!nextUser) {
      setNeedsOnboarding(false)
      setChecking(false)
      return
    }
    setChecking(true)
    try {
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
      setNeedsOnboarding(!profile.display_name || profile.target_score === null || !profile.institution || !profile.course)
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
    const { data } = onAuthStateChange((nextUser) => { if (active) void refresh(nextUser) })
    return () => { active = false; data.subscription.unsubscribe() }
  }, [])

  if (checking) return <div className="grid min-h-screen place-items-center bg-[#07050d] text-white"><p className="text-white/60">Preparing your ACE account…</p></div>
  if (error) return <div className="grid min-h-screen place-items-center bg-[#07050d] px-6 text-white"><div className="max-w-md text-center"><h1 className="text-xl font-semibold">We couldn’t prepare your account</h1><p className="mt-2 text-sm text-white/60">{error}</p><button type="button" onClick={() => void refresh(user)} className="mt-5 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black">Try again</button></div></div>
  if (!user) return <StudentAuth />
  if (needsOnboarding) return <StudentOnboarding onComplete={() => void refresh(user)} />
  return <App />
}
