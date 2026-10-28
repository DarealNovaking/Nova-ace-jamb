import { useEffect, useRef, useState } from 'react'
import { applyReviewedCorrections, checkReviewedCorrections, reviewedCorrections } from '../lib/reviewedCorrectionsService'
import type { CorrectionPlan } from '../lib/reviewedCorrectionPlan'

export default function ReviewedDraftCorrections({ onChanged }: { onChanged: () => void }) {
  const [plan, setPlan] = useState<CorrectionPlan | null>(null)
  const [action, setAction] = useState<'check' | 'apply' | null>(null)
  const [error, setError] = useState('')
  const [mustCheck, setMustCheck] = useState(false)
  const inFlight = useRef(false)
  const mounted = useRef(true)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])

  async function run(next: 'check' | 'apply') {
    if (inFlight.current) return
    inFlight.current = true
    setAction(next)
    setError('')
    setPlan(null)
    try {
      const result = await (next === 'apply' ? applyReviewedCorrections() : checkReviewedCorrections())
      if (!mounted.current) return
      setPlan(result)
      setMustCheck(false)
      if (result.remaining.length === 0) onChanged()
    } catch {
      if (!mounted.current) return
      setMustCheck(true)
      setError(next === 'apply'
        ? 'The changes could not be confirmed. Some may have saved. Check corrections before retrying.'
        : 'These drafts no longer match the reviewed changes, or access could not be verified. Review them individually before continuing.')
    } finally {
      inFlight.current = false
      if (mounted.current) setAction(null)
    }
  }

  const busy = action !== null
  const button = 'min-h-11 rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-300'
  return <section aria-labelledby="reviewed-corrections-heading" aria-busy={busy} className="rounded-3xl border border-purple-300/25 bg-purple-300/5 p-5 sm:p-7">
    <h2 id="reviewed-corrections-heading" className="text-xl font-black">Finish reviewed corrections</h2>
    <p className="mt-2 text-sm leading-6 text-white/70">Apply the two reviewed labels and the missing source note. These drafts stay inactive; nothing is published.</p>
    <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-white/75">{reviewedCorrections.map((patch) => <li key={patch.review_id}>{patch.label}</li>)}</ul>
    {busy && <p aria-live="polite" className="mt-4 text-sm text-purple-100">{action === 'apply' ? 'Saving reviewed draft corrections…' : 'Checking reviewed corrections…'}</p>}
    {plan && <p role="status" className="mt-4 text-sm font-semibold">{plan.remaining.length === 0
      ? 'All reviewed corrections are saved. Nothing was published.'
      : `${plan.completed} of ${plan.total} reviewed changes already complete. ${plan.remaining.length} remain.`}</p>}
    {error && <p role="alert" className="mt-4 text-sm text-red-100">{error}</p>}
    <div className="mt-4 flex flex-wrap gap-3">
      <button type="button" className={button} disabled={busy} onClick={() => void run('check')}>Check corrections</button>
      <button type="button" className={`${button} bg-purple-300 text-[#120b1c]`} disabled={busy || mustCheck || plan?.remaining.length === 0} onClick={() => void run('apply')}>Apply reviewed corrections</button>
    </div>
  </section>
}
