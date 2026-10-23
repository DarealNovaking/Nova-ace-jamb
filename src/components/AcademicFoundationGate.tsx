import { useEffect, useState } from 'react'
import { getCurrentUser } from '../lib/authService'
import { ace, supabase } from '../lib/supabase'
import AdminAcademicWorkspace from './AdminAcademicWorkspace'

export default function AcademicFoundationGate() {
  const [checking, setChecking] = useState(true)
  const [signedIn, setSignedIn] = useState(false)
  const [allowed, setAllowed] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function check() {
      try {
        const user = await getCurrentUser()
        if (!user) return
        if (active) setSignedIn(true)
        const { data, error: roleError } = await ace.rpc('is_admin_or_editor')
        if (roleError) throw roleError
        if (active) {
          setAllowed(data === true)
          if (!data) setError('An administrator or authorized content-editor role is required.')
        }
      } catch {
        if (active) setError('Unable to verify academic editor access. Please try again.')
      } finally {
        if (active) setChecking(false)
      }
    }
    void check()
    return () => { active = false }
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    window.location.assign('/')
  }

  if (checking) return <main className="grid min-h-screen place-items-center bg-[#07050d] text-white"><p role="status" aria-live="polite" aria-atomic="true">Verifying academic editor access…</p></main>
  if (!signedIn || !allowed) return <main className="grid min-h-screen place-items-center bg-[#07050d] px-5 text-white"><section className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/[.04] p-7"><h1 className="text-2xl font-black">Academic editor access required</h1><p className="mt-3 text-sm text-white/55">{!signedIn ? 'Sign in with an authorized administrator or content-editor account to continue.' : error || 'Your account does not have academic editing permission.'}</p><div className="mt-6 flex gap-3"><button type="button" onClick={() => window.location.assign('/')} className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-black">Back to ACE JAMB</button>{signedIn && <button type="button" onClick={() => void signOut()} className="rounded-xl border border-white/10 px-5 py-3 text-sm">Sign out</button>}</div></section></main>

  return <main className="min-h-screen bg-[#07050d] px-4 py-8 text-white sm:px-6"><div className="mx-auto max-w-6xl"><header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs uppercase tracking-[.2em] text-purple-300/70">ÑØVÃ ACE JAMB · Editorial tools</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Academic Structure</h1><p className="mt-2 text-sm text-white/50">Source-backed syllabus drafts, rights review, topics and subtopics.</p></div><div className="flex gap-2"><a href="/admin" className="rounded-xl border border-white/10 px-4 py-3 text-sm">Admin dashboard</a><button type="button" onClick={() => void signOut()} className="rounded-xl border border-white/10 px-4 py-3 text-sm">Sign out</button></div></header><AdminAcademicWorkspace/></div></main>
}
