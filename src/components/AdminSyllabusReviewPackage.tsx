import { useEffect, useRef, useState } from 'react'
import { manageSyllabusReview, type ReviewAction, type ReviewPackageState } from '../lib/syllabusReviewService'

const buttonClass = 'min-h-11 rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-300'

export default function AdminSyllabusReviewPackage({ onChanged }: { onChanged: () => void }) {
  const [state, setState] = useState<ReviewPackageState | null>(null)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const active = useRef(true)
  const inFlight = useRef(false)

  async function run(action: ReviewAction) {
    if (inFlight.current) return
    inFlight.current = true
    setBusy(true)
    setError('')
    setState(null)
    setConfirmed(false)
    try {
      const result = await manageSyllabusReview(action)
      if (!active.current) return
      setState(result)
      if (action !== 'preview') onChanged()
    } catch (caught) {
      if (!active.current) return
      setError(caught instanceof Error && caught.message === 'REVIEW_HELPER_UNAVAILABLE'
        ? 'Bulk syllabus staging isn’t available yet. You can continue using the academic editor below.'
        : 'The review package operation could not be confirmed. Check the package before trying another action. Changed or referenced drafts require individual review.')
    } finally {
      inFlight.current = false
      if (active.current) setBusy(false)
    }
  }

  useEffect(() => {
    active.current = true
    void run('preview')
    return () => { active.current = false }
  }, [])

  return <section aria-labelledby="syllabus-review-package" aria-busy={busy} className="rounded-3xl border border-purple-300/20 bg-purple-300/5 p-5 sm:p-7">
    <h2 id="syllabus-review-package" className="text-xl font-black">IBASS private review package</h2>
    <p className="mt-2 text-sm leading-6 text-white/70">2027 candidate: 25 subject drafts, 214 topics and 954 subtopics. All topics remain inactive. Rights, academic review and year applicability still need approval. The English reading-text placeholder is excluded.</p>
    {busy && <p aria-live="polite" className="mt-4 text-sm text-purple-100">Checking the private review package…</p>}
    {error && <p role="alert" className="mt-4 text-sm text-red-100">{error}</p>}
    {state && <>
      <p aria-live="polite" className="mt-4 font-semibold">{state.state === 'staged' ? 'Private review drafts are staged.' : 'Ready for private review staging.'}</p>
      {state.state === 'staged' && !state.can_undo && <p className="mt-2 text-sm text-amber-100">These drafts are in use. Review them individually; bulk removal is unavailable.</p>}
      {(state.can_stage || state.can_undo) && <>
        <label className="mt-4 flex min-h-11 cursor-pointer items-start gap-3 text-sm leading-6 text-white/80">
          <input type="checkbox" checked={confirmed} disabled={busy} onChange={event => setConfirmed(event.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-purple-300"/>
          {state.can_stage ? 'I understand these drafts still need rights and academic approval.' : 'Remove only this unchanged, unused review package.'}
        </label>
        <button type="button" className={`${buttonClass} mt-3 bg-purple-300 text-[#120b1c]`} disabled={busy || !confirmed} onClick={() => { if (confirmed) void run(state.can_stage ? 'stage' : 'undo') }}>
          {state.can_stage ? 'Stage private review drafts' : 'Remove unchanged review drafts'}
        </button>
      </>}
    </>}
    <div className="mt-4"><button type="button" className={buttonClass} disabled={busy} onClick={() => void run('preview')}>Check review package</button></div>
  </section>
}
