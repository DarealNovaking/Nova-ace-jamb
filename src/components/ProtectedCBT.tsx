import { useState } from 'react'
import { FormEvent } from 'react'
import PersistentCBT from './PersistentCBT'
import { getCurrentUser, requestEmailCode, verifyEmailCode } from '../lib/authService'

export default function ProtectedCBT() {
  const [checking, setChecking] = useState(true)
  const [signedIn, setSignedIn] = useState(false)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useState(() => {
    getCurrentUser().then((user) => setSignedIn(Boolean(user))).catch(() => setSignedIn(false)).finally(() => setChecking(false))
  })

  const requestCode = async (event: FormEvent) => {
    event.preventDefault()
    setMessage('')
    setBusy(true)
    try {
      await requestEmailCode(email)
      setCodeSent(true)
      setMessage('Enter the 6-digit code sent to your email.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not send the verification code.')
    } finally {
      setBusy(false)
    }
  }

  const verifyCode = async (event: FormEvent) => {
    event.preventDefault()
    setMessage('')
    setBusy(true)
    try {
      await verifyEmailCode(email, code)
      setSignedIn(true)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'That verification code is invalid or expired.')
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
    {codeSent ? (
      <form onSubmit={verifyCode} className="mt-4 space-y-3">
        <input className="field w-full text-center text-2xl tracking-[.35em]" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="123456" required />
        <button type="submit" disabled={busy || code.length !== 6} className="w-full rounded-xl bg-white py-3 font-bold text-black disabled:opacity-50">{busy ? 'Verifying…' : 'Verify code'}</button>
        <button type="button" onClick={() => { setCodeSent(false); setCode(''); setMessage('') }} className="w-full text-sm font-semibold text-purple-200">Use another email</button>
      </form>
    ) : (
      <form onSubmit={requestCode} className="mt-4 space-y-3">
        <input className="field w-full" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />
        <button type="submit" disabled={busy} className="w-full rounded-xl bg-white py-3 font-bold text-black disabled:opacity-50">{busy ? 'Sending code…' : 'Send verification code'}</button>
      </form>
    )}
  </section>
  return <PersistentCBT />
}
