import { FormEvent, useEffect, useState } from 'react'
import PersistentCBT from './PersistentCBT'
import { getCurrentUser, signInWithPassword } from '../lib/authService'

export default function ProtectedCBT() {
  const [checking, setChecking] = useState(true)
  const [signedIn, setSignedIn] = useState(false)
  const [storageKey, setStorageKey] = useState<string | null>(null)
  const [mode] = useState<'cbt' | 'practice'>(() => new URLSearchParams(window.location.search).get('mode') === 'practice' ? 'practice' : 'cbt')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    getCurrentUser().then((user) => {
      setSignedIn(Boolean(user))
      setStorageKey(user ? `ace-cbt-active-attempt:${user.id}` : null)
    }).catch(() => setSignedIn(false)).finally(() => setChecking(false))
  }, [])

  const signIn = async (event: FormEvent) => {
    event.preventDefault()
    setMessage('')
    setBusy(true)
    try {
      const data = await signInWithPassword(email, password)
      setStorageKey(data.user ? `ace-cbt-active-attempt:${data.user.id}` : null)
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
  return <PersistentCBT storageKey={storageKey} mode={mode} />
}
