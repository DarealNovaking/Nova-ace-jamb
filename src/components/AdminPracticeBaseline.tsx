import { useEffect, useRef, useState } from 'react'
import { ace } from '../lib/supabase'
import { createPracticeBaseline, parsePracticeBaseline, type BaselineAction, type PracticeBaselineState } from '../lib/practiceBaseline'

async function requestBaseline(action: BaselineAction): Promise<unknown> {
  const { data, error } = await ace.rpc('prepare_2026_practice_config', { p_action: action })
  if (error) throw new Error('Practice draft could not be confirmed')
  return data
}

export default function AdminPracticeBaseline() {
  const [state, setState] = useState<PracticeBaselineState | null>(null)
  const [busy, setBusy] = useState(false)
  const [mustCheck, setMustCheck] = useState(false)
  const [error, setError] = useState('')
  const mounted = useRef(true)
  const inFlight = useRef(false)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])

  async function run(action: BaselineAction) {
    if (inFlight.current) return
    inFlight.current = true
    setBusy(true)
    setError('')
    setState(null)
    try {
      const result = action === 'create'
        ? await createPracticeBaseline(requestBaseline)
        : parsePracticeBaseline(await requestBaseline('check'), 'check')
      if (!mounted.current) return
      setState(result)
      setMustCheck(false)
    } catch {
      if (!mounted.current) return
      setMustCheck(true)
      setError(action === 'create'
        ? 'The save could not be confirmed. Check the draft before retrying.'
        : 'The draft could not be checked. Access may be unavailable or the reviewed settings may have changed. Try checking again.')
    } finally {
      inFlight.current = false
      if (mounted.current) setBusy(false)
    }
  }

  const saved = state?.state === 'exists'
  const button = 'min-h-11 rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-300'
  return <section aria-labelledby="practice-baseline-heading" aria-busy={busy} className="rounded-3xl border border-purple-300/25 bg-purple-300/5 p-5 sm:p-7">
    <h2 id="practice-baseline-heading" className="text-xl font-black">2026 practice baseline</h2>
    <p className="mt-2 text-sm leading-6 text-white/75">2 hours · 180 questions · four options. English has 60 questions, plus three chosen subjects with 40 each.</p>
    <p className="mt-2 text-sm leading-6 text-white/65">Creates an inactive practice draft using the verified 2026 rules. This is preparation guidance; 2027 dates and prescribed texts remain unconfirmed.</p>
    {busy && <p aria-live="polite" className="mt-4 text-sm text-purple-100">Checking the practice draft…</p>}
    {state && <p role="status" className="mt-4 text-sm font-semibold">{saved
      ? 'Practice draft saved and checked. Nothing was activated or published.'
      : 'The reviewed practice draft is ready to create. Nothing was activated or published.'}</p>}
    {error && <p role="alert" className="mt-4 text-sm text-red-100">{error}</p>}
    <div className="mt-4 flex flex-wrap gap-3">
      <button type="button" className={button} disabled={busy} onClick={() => void run('check')}>Check practice draft</button>
      <button type="button" className={`${button} bg-purple-300 text-[#120b1c]`} disabled={busy || mustCheck || saved} onClick={() => void run('create')}>Create 2026 practice draft</button>
    </div>
  </section>
}
