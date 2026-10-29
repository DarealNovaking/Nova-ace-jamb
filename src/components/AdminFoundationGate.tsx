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
    <main className="min-h-screen bg-[#07050d] px-5 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[.2em] text-purple-300/70">ÑØVÃ ACE JAMB · Administration</p>
            <h1 className="mt-2 text-4xl font-black">Admin Dashboard</h1>
            <p className="mt-2 text-white/50">Review operational readiness and manage academic structure.</p>
          </div>
          <div className="flex flex-wrap gap-2"><a href="/admin-academic" className="w-fit rounded-xl border border-purple-300/25 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-100 hover:bg-purple-500/20">Academic Structure</a><button type="button" onClick={signOut} className="w-fit rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/5">Sign out</button></div>
        </header>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"><p className="text-xs uppercase tracking-wider text-white/35">Role</p><p className="mt-2 text-xl font-black">Administrator</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"><p className="text-xs uppercase tracking-wider text-white/35">Current milestone</p><p className="mt-2 text-xl font-black">Batch 3 · Academic structure</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"><p className="text-xs uppercase tracking-wider text-white/35">Publication gate</p><p className="mt-2 text-xl font-black">Source + rights review</p></div>
        </div>

        <a href="/admin-questions" className="inline-flex min-h-11 items-center rounded-xl border border-purple-300/30 px-4 py-2 text-sm font-semibold text-purple-100">Question editor workspace</a>
        <AdminOperationsOverview />
        <AdminQuestionReviewQueue />
      </div>
    </main>
  )
}
