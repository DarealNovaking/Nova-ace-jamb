import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import StudentOnboarding from './StudentOnboarding'
import { getCurrentUser, onAuthStateChange } from '../lib/authService'
import { getStudentProfile } from '../lib/studentService'
import { registerCurrentDevice } from '../lib/deviceService'
import App from '../App'

export default function StudentFoundationGate() {
  const [user, setUser] = useState<User | null>(null)
  const [checking, setChecking] = useState(true)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)

  const refresh = async (nextUser: User | null) => {
    setUser(nextUser)
    if (!nextUser) {
      setNeedsOnboarding(false)
      setChecking(false)
      return
    }
    setChecking(true)
    try {
      await registerCurrentDevice()
      const profile = await getStudentProfile()
      setNeedsOnboarding(!profile.display_name || profile.target_score === null || !profile.institution || !profile.course)
    } catch {
      setNeedsOnboarding(true)
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    let active = true
    getCurrentUser().then((currentUser) => active && refresh(currentUser)).catch(() => active && refresh(null))
    const { data } = onAuthStateChange((nextUser) => { if (active) void refresh(nextUser) })
    return () => { active = false; data.subscription.unsubscribe() }
  }, [])

  if (checking) return <div className="grid min-h-screen place-items-center bg-[#07050d] text-white"><p className="text-white/60">Preparing your ACE account…</p></div>
  if (user && needsOnboarding) return <StudentOnboarding onComplete={() => refresh(user)} />
  return <App />
}
