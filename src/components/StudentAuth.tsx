import { FormEvent, useState } from 'react'
import { requestEmailCode, verifyEmailCode } from '../lib/authService'

export default function StudentAuth() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const requestCode = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await requestEmailCode(email)
      setCodeSent(true)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'We could not send the verification code. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const verifyCode = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await verifyEmailCode(email, code)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'That verification code is invalid or expired. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#07050d] px-5 text-white">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-7 shadow-2xl">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[.22em] text-purple-300">ÑØVÃ · ACE JAMB</p>
          <h1 className="mt-3 text-3xl font-black">Your JAMB preparation starts here.</h1>
          <p className="mt-3 text-sm leading-6 text-white/55">Use your email to create or access your persistent ACE JAMB student account.</p>
        </div>

        {codeSent ? (
          <form onSubmit={verifyCode} className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="font-bold">Enter your verification code</h2>
              <p className="mt-2 text-sm leading-6 text-white/55">We sent a 6-digit code to <span className="text-white">{email.trim().toLowerCase()}</span>. Enter it here to continue on this device.</p>
            </div>
            <label className="block text-sm font-semibold">
              Verification code
              <input autoComplete="one-time-code" inputMode="numeric" type="text" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="123456" className="field mt-2 w-full text-center text-2xl tracking-[.35em]" />
            </label>
            {error && <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-100">{error}</p>}
            <button type="submit" disabled={busy || code.length !== 6} className="w-full rounded-xl bg-white px-5 py-3 font-bold text-black disabled:opacity-50">{busy ? 'Verifying…' : 'Verify and continue'}</button>
            <button type="button" onClick={() => { setCodeSent(false); setCode(''); setError(null) }} className="w-full text-sm font-semibold text-purple-200">Use another email</button>
          </form>
        ) : (
          <form onSubmit={requestCode} className="space-y-4">
            <label className="block text-sm font-semibold">
              Email address
              <input autoComplete="email" inputMode="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="field mt-2 w-full" />
            </label>
            {error && <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-100">{error}</p>}
            <button type="submit" disabled={busy} className="w-full rounded-xl bg-white px-5 py-3 font-bold text-black disabled:opacity-50">{busy ? 'Sending code…' : 'Continue with email'}</button>
            <p className="text-center text-xs leading-5 text-white/35">No password to remember. New users are created automatically after email verification.</p>
          </form>
        )}
      </section>
    </main>
  )
}
