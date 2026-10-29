import { useEffect, useRef, useState } from 'react'
import { ace } from '../lib/supabase'
import { changeStudyIndex, parseStudyResult, studyDigest, type StudyAction, type StudyResult } from '../lib/studyPublication'

async function requestStudy(action: StudyAction): Promise<unknown> {
  const { default: packageData } = await import('../data/fcb02StudyPublication.json')
  if (packageData.digest !== studyDigest) throw new Error('Study package changed')
  const { data, error } = await ace.rpc('manage_fcb02_study_index', { p_action: action, p_digest: studyDigest, p_package: packageData.payload })
  if (error) throw new Error('Study-index action could not be confirmed')
  return data
}

export default function AdminStudyPublication() {
  const [state, setState] = useState<StudyResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [mustCheck, setMustCheck] = useState(false)
  const [error, setError] = useState('')
  const mounted = useRef(true)
  const inFlight = useRef(false)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])

  async function run(action: StudyAction) {
    if (inFlight.current) return
    inFlight.current = true
    setBusy(true); setError('')
    try {
      const result = action === 'check' ? parseStudyResult(await requestStudy('check')) : await changeStudyIndex(action, requestStudy)
      if (mounted.current) { setState(result); setMustCheck(false) }
    } catch {
      if (mounted.current) {
        setState(null); setMustCheck(true)
        setError('The final state could not be confirmed. Check the study index before publishing again. Withdrawal remains available if the reviewed content has changed.')
      }
    } finally {
      inFlight.current = false
      if (mounted.current) setBusy(false)
    }
  }
  const button = 'min-h-11 rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-300'
  return <section aria-labelledby="study-publication-heading" aria-busy={busy} className="rounded-3xl border border-purple-300/25 bg-purple-300/5 p-5 sm:p-7">
    <h2 id="study-publication-heading" className="text-xl font-black">ACE study index publication</h2>
    <p className="mt-2 text-sm leading-6 text-white/75">25 subjects · 108 ACE study groups · 1,167 concept entries. Our original arrangement references JAMB coverage; it is not an official JAMB publication or a complete lesson.</p>
    <p className="mt-2 text-sm leading-6 text-white/65">Publishing approves only factual concept names and ACE’s arrangement under the documented source-use assessment. It excludes source PDF text, books, lessons, questions, images and audio. Original IBASS review drafts stay private.</p>
    <p className="mt-2 text-sm leading-6 text-white/65">This also activates the saved 2026-format practice baseline for preparation. 2027 dates and prescribed texts remain unconfirmed. Withdrawal hides this index and disables its practice baseline without deleting records.</p>
    {busy && <p aria-live="polite" className="mt-4 text-sm">Checking the study index…</p>}
    {state && <p role="status" className="mt-4 text-sm font-semibold">{state.state === 'published' ? 'ACE study index published and checked. The 2026-format practice baseline is active.' : state.state === 'withdrawn' ? 'ACE study index withdrawn and checked. Its practice baseline is inactive.' : 'The reviewed ACE study index is ready to publish. Nothing is published yet.'}</p>}
    {error && <p role="alert" className="mt-4 text-sm text-red-100">{error}</p>}
    <div className="mt-4 flex flex-wrap gap-3">
      <button type="button" className={button} disabled={busy} onClick={() => void run('check')}>Check study index</button>
      <button type="button" className={`${button} bg-purple-300 text-[#120b1c]`} disabled={busy || mustCheck || state?.state === 'published'} onClick={() => void run('publish')}>Publish ACE study index</button>
      <button type="button" className={button} disabled={busy || state?.state === 'absent' || state?.state === 'withdrawn'} onClick={() => void run('withdraw')}>Withdraw ACE study index</button>
    </div>
  </section>
}
