import { ArrowUpRight, BookOpen, FileQuestion, ShieldCheck } from 'lucide-react'
import DashboardShell from './DashboardShell'
import { useEffect, useState } from 'react'
import { ace, supabase } from '../lib/supabase'
import { getCurrentUser } from '../lib/authService'
import AdminOperationsOverview from './AdminOperationsOverview'
import AdminQuestionReviewQueue from './AdminQuestionReviewQueue'

export default function AdminFoundationGate() {
  const [checking, setChecking] = useState(true)
  const [retryCount, setRetryCount] = useState(0)
  const [allowed, setAllowed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    let checkedUserId: string | null = null
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || (event === 'SIGNED_IN' && checkedUserId && session?.user.id !== checkedUserId)) {
        active = false
        setAllowed(false)
        setChecking(false)
        setError('Administrator access is required.')
      }
    })

    const check = async () => {
      setChecking(true)
      setAllowed(false)
      setError(null)
      try {
        const user = await getCurrentUser()
        checkedUserId = user?.id ?? null
        if (!user) {
          if (active) setAllowed(false)
          return
        }

        const { data, error: roleError } = await ace.rpc('is_admin')
        if (roleError) throw roleError
        if (!data) {
          if (active) {
            setAllowed(false)
            setError('Administrator access is required.')
          }
          return
        }

        if (active) setAllowed(true)
      } catch {
        if (active) {
          setAllowed(false)
          // Never expose raw auth/RPC/database errors in the administrator UI.
          setError('Unable to verify administrator access. Please try again.')
        }
      } finally {
        if (active) setChecking(false)
      }
    }

    void check()
    return () => {
      active = false
      authListener.subscription.unsubscribe()
    }
  }, [retryCount])

  const signOut = async () => {
    await supabase.auth.signOut()
    window.location.assign('/')
  }

  if (checking) {
    return <main className="grid min-h-screen place-items-center bg-[#07050d] text-white"><p role="status" aria-live="polite" aria-atomic="true" className="text-white/60">Verifying administrator access…</p></main>
  }

  if (!allowed) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#07050d] px-6 text-white">
        <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-7 text-center">
          <p className="text-xs uppercase tracking-[.2em] text-purple-300">ÑØVÃ · ACE JAMB</p>
          <h1 className="mt-3 text-2xl font-black">Admin access required</h1>
          <p className="mt-3 text-sm text-white/50">{error ?? 'Sign in with an administrator account to continue.'}</p>
          {error === 'Unable to verify administrator access. Please try again.' && <button type="button" onClick={() => setRetryCount((value) => value + 1)} className="mt-6 rounded-xl border border-purple-300/30 px-5 py-3 font-bold text-purple-100">Retry administrator verification</button>}
          <button type="button" onClick={() => window.location.assign('/')} className="mt-6 ml-2 rounded-xl bg-white px-5 py-3 font-bold text-black">Back to ACE JAMB</button>
        </section>
      </main>
    )
  }

  return (
    <DashboardShell area="admin" activeId="overview">
      
      <main id="admin-content" tabIndex={-1} className="dashboard-content">
        <header className="dashboard-heading">
          <div><p className="dashboard-eyebrow">Your administration workspace</p><h1 className="dashboard-title">Admin Dashboard</h1><p className="dashboard-description">Manage learning content, review questions and keep an eye on your services.</p></div>
          <button type="button" onClick={signOut} className="dashboard-button self-start">Sign out</button>
        </header>
        <div className="dashboard-section-heading"><div><h2>Where would you like to work?</h2><p>Your main content tools, in one place.</p></div></div>
        <nav className="dashboard-shortcuts" aria-label="Content workspaces">
          <a href="/admin-questions" className="dashboard-panel dashboard-shortcut"><span className="dashboard-stat-icon"><FileQuestion size={21} aria-hidden="true" /></span><div><h2>Question editor workspace</h2><p>Create or import private drafts, review sources and manage publication.</p></div><ArrowUpRight size={18} aria-hidden="true" /></a>
          <a href="/admin-academic" className="dashboard-panel dashboard-shortcut"><span className="dashboard-stat-icon"><BookOpen size={21} aria-hidden="true" /></span><div><h2>Academic workspace</h2><p>Organize subjects, syllabus topics and subtopics for students.</p></div><ArrowUpRight size={18} aria-hidden="true" /></a>
        </nav>
        <div className="dashboard-process"><strong className="inline-flex items-center gap-2"><ShieldCheck size={17} aria-hidden="true" /> Publication workflow</strong><span>01 · Private draft</span><span>02 · Independent review</span><span>03 · Publish to students</span></div>
        <div id="operations" tabIndex={-1} className="scroll-mt-6"><AdminOperationsOverview /></div>
        <AdminQuestionReviewQueue />
      </main>
    </DashboardShell>
  )
}
