import { FormEvent, useState } from 'react'
import { requestPasswordReset, signInWithPassword, signUpWithPassword, updatePassword } from '../lib/authService'

type AuthMode = 'signin' | 'signup' | 'forgot' | 'recovery'

const passwordHint = 'Use at least 8 characters.'

export default function StudentAuth({ recovery = false }: { recovery?: boolean }) {
  const [mode, setMode] = useState<AuthMode>(recovery ? 'recovery' : 'signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const resetState = (nextMode: AuthMode) => {
    setMode(nextMode)
    setPassword('')
    setConfirmPassword('')
    setMessage(null)
    setError(null)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) throw new Error('Your passwords do not match.')
        await signUpWithPassword(email, password)
        setMessage('Account created. You can continue into ACE JAMB.')
      } else if (mode === 'signin') {
        await signInWithPassword(email, password)
      } else if (mode === 'forgot') {
        await requestPasswordReset(email)
        setMessage('If an account exists for that email, a password-reset email has been sent.')
      } else {
        if (password !== confirmPassword) throw new Error('Your passwords do not match.')
        await updatePassword(password)
        setMessage('Password updated successfully. You can continue into ACE JAMB.')
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Authentication failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const recoveryMode = mode === 'recovery'
  const forgotMode = mode === 'forgot'
  const signupMode = mode === 'signup'

  return (
    <main className="grid min-h-screen place-items-center bg-[#07050d] px-5 text-white">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-7 shadow-2xl">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[.22em] text-purple-300">ÑØVÃ · ACE JAMB</p>
          <h1 className="mt-3 text-3xl font-black">
            {recoveryMode ? 'Set a new password.' : forgotMode ? 'Reset your password.' : signupMode ? 'Create your ACE account.' : 'Welcome back.'}
          </h1>
          <p className="mt-3 text-sm leading-6 text-white/55">
            {recoveryMode
              ? 'Choose a new password for your ACE JAMB account.'
              : forgotMode
                ? 'Enter your account email and we’ll send password-reset instructions.'
                : 'Use your email and password to create or access your persistent ACE JAMB account.'}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {!recoveryMode && (
            <label className="block text-sm font-semibold">
              Email address
              <input autoComplete="email" inputMode="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="field mt-2 w-full" />
            </label>
          )}

          {!forgotMode && (
            <>
              <label className="block text-sm font-semibold">
                New password{signupMode || recoveryMode ? '' : ''}
                <input autoComplete={recoveryMode ? 'new-password' : signupMode ? 'new-password' : 'current-password'} type="password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" className="field mt-2 w-full" />
              </label>
              {(signupMode || recoveryMode) && (
                <label className="block text-sm font-semibold">
                  Confirm password
                  <input autoComplete="new-password" type="password" minLength={8} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="••••••••" className="field mt-2 w-full" />
                </label>
              )}
              {(signupMode || recoveryMode) && <p className="text-xs text-white/35">{passwordHint}</p>}
            </>
          )}

          {error && <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-100">{error}</p>}
          {message && <p role="status" className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-100">{message}</p>}

          <button type="submit" disabled={busy} className="w-full rounded-xl bg-white px-5 py-3 font-bold text-black disabled:opacity-50">
            {busy ? 'Please wait…' : recoveryMode ? 'Update password' : forgotMode ? 'Send reset email' : signupMode ? 'Create account' : 'Sign in'}
          </button>
        </form>

        {!recoveryMode && !forgotMode && (
          <div className="mt-5 flex items-center justify-between gap-4 text-sm">
            <button type="button" onClick={() => resetState(signupMode ? 'signin' : 'signup')} className="font-semibold text-purple-200">
              {signupMode ? 'Already have an account?' : 'Create an account'}
            </button>
            {!signupMode && <button type="button" onClick={() => resetState('forgot')} className="font-semibold text-white/60">Forgot password?</button>}
          </div>
        )}

        {forgotMode && (
          <button type="button" onClick={() => resetState('signin')} className="mt-5 w-full text-sm font-semibold text-purple-200">Back to sign in</button>
        )}

        {recoveryMode && (
          <p className="mt-5 text-center text-xs leading-5 text-white/35">After updating your password, your existing ACE account and progress remain attached to your account.</p>
        )}
      </section>
    </main>
  )
}
