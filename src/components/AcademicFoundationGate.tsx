import DashboardShell from './DashboardShell'
import { useEffect, useState } from 'react'
import { getCurrentUser } from '../lib/authService'
import { ace, supabase } from '../lib/supabase'
import AdminAcademicWorkspace from './AdminAcademicWorkspace'
import AdminQuestionReviewQueue from './AdminQuestionReviewQueue'

export default function AcademicFoundationGate({ workspace = 'academic' }: { workspace?: 'academic' | 'questions' }) {
  const [checking, setChecking] = useState(true)
  const [signedIn, setSignedIn] = useState(false)
  const [allowed, setAllowed] = useState(false)
  const [canApprove, setCanApprove] = useState(false)
  const [error, setError] = useState('')
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let active = true
    let checkedUserId: string | null = null
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || (event === 'SIGNED_IN' && checkedUserId && session?.user.id !== checkedUserId)) {
        active = false
        setSignedIn(false)
        setAllowed(false)
        setCanApprove(false)
        setChecking(false)
      }
    })
    setChecking(true)
    setSignedIn(false)
    setAllowed(false)
    setCanApprove(false)
    setError('')
    async function check() {
      try {
        const user = await getCurrentUser()
        checkedUserId = user?.id ?? null
        if (!user) return
        if (active) setSignedIn(true)
        const { data, error: roleError } = await ace.rpc('is_admin_or_editor')
        if (roleError) throw roleError
        if (data !== true) {
          if (active) setError('An administrator or authorized content-editor role is required.')
          return
        }
        const { data: isAdmin, error: adminError } = await ace.rpc('is_admin')
        if (adminError) throw adminError
        if (active) {
          setCanApprove(isAdmin === true)
          setAllowed(true)
        }
      } catch {
        if (active) setError('Unable to verify academic editor access. Please try again.')
      } finally {
        if (active) setChecking(false)
      }
    }
    void check()
    return () => { active = false; authListener.subscription.unsubscribe() }
  }, [retryCount])

  async function signOut() {
    await supabase.auth.signOut()
    window.location.assign('/')
  }

  if (checking) return <main className="grid min-h-screen place-items-center bg-[#07050d] text-white"><p role="status" aria-live="polite" aria-atomic="true">Verifying academic editor access…</p></main>
  if (!signedIn || !allowed) return <main className="grid min-h-screen place-items-center bg-[#07050d] px-5 text-white"><section className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/[.04] p-7"><h1 className="text-2xl font-black">Academic editor access required</h1><p className="mt-3 text-sm text-white/55">{!signedIn ? 'Sign in with an authorized administrator or content-editor account to continue.' : error || 'Your account does not have academic editing permission.'}</p><div className="mt-6 flex gap-3"><button type="button" onClick={() => window.location.assign('/')} className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-black">Back to ACE JAMB</button>{signedIn && error === 'Unable to verify academic editor access. Please try again.' && <button type="button" onClick={() => setRetryCount((value) => value + 1)} className="rounded-xl border border-purple-300/30 px-5 py-3 text-sm font-semibold text-purple-100">Retry academic editor verification</button>}{signedIn && <button type="button" onClick={() => void signOut()} className="rounded-xl border border-white/10 px-5 py-3 text-sm">Sign out</button>}</div></section></main>

  return <DashboardShell area={canApprove ? 'admin' : 'editor'} activeId={workspace}><a className="skip-link" href="#editorial-content">Skip to workspace content</a><main id="editorial-content" tabIndex={-1} className="dashboard-content"><header className="dashboard-heading"><div><p className="dashboard-eyebrow">Content &amp; publishing</p><h1 className="dashboard-title">{workspace === 'questions' ? 'Question workspace' : 'Academic Structure'}</h1><p className="dashboard-description">{workspace === 'questions' ? 'Private drafts, independent review and audited publication.' : 'Source-backed syllabus drafts, rights review, topics and subtopics.'}</p></div><button type="button" onClick={() => void signOut()} className="dashboard-button self-start">Sign out</button></header>{workspace === 'questions' ? <AdminQuestionReviewQueue/> : <AdminAcademicWorkspace canApprove={canApprove}/>}</main></DashboardShell>
}
