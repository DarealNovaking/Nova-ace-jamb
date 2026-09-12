import { FormEvent, useState } from 'react'
import { requestMagicLink } from '../lib/authService'

export default function StudentAuth() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await requestMagicLink(email)
      setSent(true)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'We could not send the sign-in link. Please try again.')
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
        {sent ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="font-bold">Check your email</h2>
            <p className="mt-2 text-sm leading-6 text-white/55">We sent a secure sign-in link to <span className="text-white">{email.trim().toLowerCase()}</span>. Open it to continue.</p>
            <button type="button" onClick={() => setSent(false)} className="mt-5 text-sm font-semibold text-purple-200">Use another email</button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <label className="block text-sm font-semibold">
              Email address
              <input autoComplete="email" inputMode="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="field mt-2 w-full" />
            </label>
            {error && <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-100">{error}</p>}
            <button type="submit" disabled={busy} className="w-full rounded-xl bg-white px-5 py-3 font-bold text-black disabled:opacity-50">{busy ? 'Sending secure link…' : 'Continue with email'}</button>
            <p className="text-center text-xs leading-5 text-white/35">No password to remember. New users are created automatically after email verification.</p>
          </form>
        )}
      </section>
    </main>
  )
}
