import { useEffect, useState } from 'react'
import PersistentCBT from './PersistentCBT'
import { getCurrentUser, requestMagicLink } from '../lib/authService'

export default function ProtectedCBT() {
  const [checking, setChecking] = useState(true)
  const [signedIn, setSignedIn] = useState(false)
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    getCurrentUser().then((user) => setSignedIn(Boolean(user))).catch(() => setSignedIn(false)).finally(() => setChecking(false))
  }, [])

  const signIn = async () => {
    setMessage('')
    try {
      await requestMagicLink(email)
      setMessage('Check your email for the secure ACE JAMB sign-in link.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not send the sign-in link.')
    }
  }

  if (checking) return <div className="grid min-h-[50vh] place-items-center"><p className="text-white/60">Checking your session…</p></div>
  if (!signedIn) return <section className="mx-auto max-w-md rounded-3xl border border-white/10 bg-white/5 p-6">
    <p className="text-xs uppercase tracking-[.2em] text-purple-300/70">Secure CBT access</p>
    <h1 className="mt-2 text-3xl font-black">Sign in to continue.</h1>
    <p className="mt-3 text-sm text-white/50">Your CBT attempts and answers are tied to your account and saved securely.</p>
    {message && <div className="mt-4 rounded-xl bg-white/5 p-3 text-sm text-white/70">{message}</div>}
    <input className="field mt-4 w-full" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
    <button onClick={signIn} className="mt-3 w-full rounded-xl bg-white py-3 font-bold text-black">Send secure sign-in link</button>
  </section>
  return <PersistentCBT />
}
