import { FormEvent, useEffect, useState } from 'react'
import PersistentCBT from './PersistentCBT'
import { getCurrentUser, signInWithPassword } from '../lib/authService'
import { fetchStudentMistakes } from '../lib/practiceService'

export default function ProtectedCBT() {
  const [checking, setChecking] = useState(true)
  const [signedIn, setSignedIn] = useState(false)
  const [storageKey, setStorageKey] = useState<string | null>(null)
  const [mode] = useState<'cbt' | 'practice'>(() => new URLSearchParams(window.location.search).get('mode') === 'practice' ? 'practice' : 'cbt')
  const [focus] = useState<'mistakes' | 'speed' | 'subject' | null>(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('mode') !== 'practice') return null
    const requested = params.get('focus')
    return requested === 'mistakes' || requested === 'speed' || requested === 'subject' ? requested : null
  })
  const [subjectId] = useState<string | null>(() => {
    const id = new URLSearchParams(window.location.search).get('subject')
    return id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) ? id : null
  })
  const recoveryScope = focus === 'subject' ? `practice-subject-${subjectId ?? 'invalid'}` : focus ? `practice-${focus}` : mode
  const [focusedQuestionIds, setFocusedQuestionIds] = useState<string[]>([])
  const [focusLoading, setFocusLoading] = useState(focus === 'mistakes')
  const [focusError, setFocusError] = useState('')
  const [focusRetry, setFocusRetry] = useState(0)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    getCurrentUser().then((user) => {
      setSignedIn(Boolean(user))
      setStorageKey(user ? `ace-${recoveryScope}-active-attempt:${user.id}` : null)
    }).catch(() => setSignedIn(false)).finally(() => setChecking(false))
  }, [recoveryScope])

  // Only fetch the signed-in student's mistake IDs; server-side start_attempt
  // authoritatively filters the IDs again to published active questions.
  useEffect(() => {
    if (!signedIn || focus !== 'mistakes') return
    let active = true
    setFocusLoading(true)
    setFocusError('')
    void fetchStudentMistakes(20).then((items) => {
      if (!active) return
      const validIds = [...new Set(items.map((item) => item.question_id).filter((id) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id),
      ))]
      setFocusedQuestionIds(validIds)
    }).catch(() => {
      if (!active) return
      setFocusedQuestionIds([])
      setFocusError('We could not load your mistake history. Check your connection and retry.')
    }).finally(() => { if (active) setFocusLoading(false) })
    return () => { active = false }
  }, [signedIn, focus, focusRetry])

  const signIn = async (event: FormEvent) => {
    event.preventDefault()
    setMessage('')
    setBusy(true)
    try {
      const data = await signInWithPassword(email, password)
      setStorageKey(data.user ? `ace-${recoveryScope}-active-attempt:${data.user.id}` : null)
      setSignedIn(Boolean(data.user))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not sign in. Check your email and password.')
    } finally {
      setBusy(false)
    }
  }

  if (checking) return <div className="grid min-h-[50vh] place-items-center"><p className="text-white/60">Checking your session…</p></div>
  if (!signedIn) return <section className="mx-auto max-w-md rounded-3xl border border-white/10 bg-white/5 p-6">
    <p className="text-xs uppercase tracking-[.2em] text-purple-300/70">Secure CBT access</p>
    <h1 className="mt-2 text-3xl font-black">Sign in to continue.</h1>
    <p className="mt-3 text-sm text-white/50">Your CBT attempts and answers are tied to your account and saved securely.</p>
    {message && <div className="mt-4 rounded-xl bg-white/5 p-3 text-sm text-white/70">{message}</div>}
    <form onSubmit={signIn} className="mt-4 space-y-3">
      <input className="field w-full" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />
      <input className="field w-full" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" autoComplete="current-password" required />
      <button type="submit" disabled={busy} className="w-full rounded-xl bg-white py-3 font-bold text-black disabled:opacity-50">{busy ? 'Signing in…' : 'Sign in'}</button>
    </form>
  </section>
  if (focus === 'subject' && !subjectId) return <section className="glass-card mx-auto max-w-lg rounded-3xl p-6"><h1 className="text-2xl font-black">Select a saved subject first</h1><p className="mt-3 text-sm text-white/60">Start subject practice from your preparation workspace.</p><a href="/?view=practice" className="mt-4 inline-block rounded-xl bg-white px-4 py-3 font-bold text-black">Choose a subject</a></section>
  if (focus === 'mistakes') {
    if (focusLoading) return <section aria-busy="true" className="glass-card mx-auto max-w-lg rounded-3xl p-6"><p role="status" className="text-white/70">Loading your saved mistake questions…</p></section>
    if (focusError) return <section className="glass-card mx-auto max-w-lg rounded-3xl p-6"><p role="alert" className="text-white/75">{focusError}</p><button type="button" className="mt-4 rounded-xl bg-white px-4 py-3 font-bold text-black" onClick={() => setFocusRetry((value) => value + 1)}>Retry mistake history</button></section>
    if (!focusedQuestionIds.length) return <section className="glass-card mx-auto max-w-lg rounded-3xl p-6"><h1 className="text-2xl font-black">No mistakes to practise yet</h1><p className="mt-3 text-sm text-white/60">There are no saved missed questions for this account. Complete approved practice first, or choose general practice.</p><a href="/?view=revision" className="mt-4 inline-block rounded-xl bg-white px-4 py-3 font-bold text-black">Return to revision</a></section>
  }
  return <PersistentCBT storageKey={storageKey} mode={mode} questionIds={focus === 'mistakes' ? focusedQuestionIds : undefined} questionCount={focus === 'mistakes' ? focusedQuestionIds.length : focus === 'speed' ? 10 : undefined} durationSeconds={focus === 'speed' ? 600 : undefined} subjectId={focus === 'subject' ? subjectId : undefined} focus={focus} />
}
