import { useEffect, useMemo, useRef, useState } from 'react'
import { FileQuestion, Loader2, RefreshCw } from 'lucide-react'
import { ace } from '../lib/supabase'

type ReviewRow = {
  id: string
  question_text: string
  review_status: string
  active: boolean
  subject_id: string | null
  topic_id: string | null
}

export default function AdminQuestionReviewQueue() {
  const [questions, setQuestions] = useState<ReviewRow[]>([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const sequence = useRef(0)

  async function refresh() {
    const run = ++sequence.current
    setLoading(true)
    setError('')
    try {
      const { data, error: readError } = await ace.from('questions')
        .select('id,question_text,review_status,active,subject_id,topic_id')
        .order('id', { ascending: false })
        .limit(30)
      if (readError) throw readError
      if (run === sequence.current) setQuestions((data ?? []) as ReviewRow[])
    } catch {
      if (run === sequence.current) {
        setQuestions([])
        setError('Question review records could not be loaded. Check your access and try again.')
      }
    } finally {
      if (run === sequence.current) setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
    return () => { sequence.current += 1 }
  }, [])

  const statuses = useMemo(() => [...new Set(questions.map((row) => row.review_status).filter(Boolean))].sort(), [questions])
  const visible = useMemo(() => questions.filter((row) => statusFilter === 'all' || row.review_status === statusFilter), [questions, statusFilter])

  return (
    <section aria-labelledby="admin-review-questions-heading" className="mt-6 rounded-3xl border border-white/10 bg-white/[.025] p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2"><FileQuestion className="text-purple-200" size={21} aria-hidden="true" /><h2 id="admin-review-questions-heading" className="text-xl font-black">Question publication review</h2></div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">Read-only view of up to 30 question records, ordered by ID. Status here is not approval or permission to publish; publication requires a reviewed, rights-verified authoring workflow.</p>
        </div>
        <button type="button" disabled={loading} onClick={() => void refresh()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold disabled:opacity-50"><RefreshCw size={16} aria-hidden="true"/> Refresh questions</button>
      </div>
      {error && <div role="alert" className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">{error}<button type="button" className="ml-3 underline" onClick={() => void refresh()}>Retry question review</button></div>}
      {loading && <p role="status" className="mt-5 flex items-center gap-2 text-sm text-white/60"><Loader2 size={17} className="animate-spin" aria-hidden="true" /> Loading question review records…</p>}
      {!loading && !error && questions.length === 0 && <div className="mt-5 rounded-xl border border-dashed border-white/15 p-5"><p className="font-semibold">No question records found</p><p className="mt-2 text-sm leading-6 text-white/50">The academic team must create and review rights-cleared question content before publication. This screen does not generate questions.</p></div>}
      {!loading && !error && questions.length > 0 && <>
        <label className="mt-5 block max-w-xs text-sm font-semibold text-white/70">Filter review status
          <select className="field mt-2" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All loaded statuses</option>
            {statuses.map((status) => <option value={status} key={status}>{status.replaceAll('_', ' ')}</option>)}
          </select>
        </label>
        <p className="mt-3 text-xs text-white/45">{visible.length} of {questions.length} loaded record{questions.length === 1 ? '' : 's'} shown.</p>
        <ul className="mt-4 space-y-3">{visible.map((item) => <li key={item.id} className="rounded-xl border border-white/10 p-4">
          <div className="flex flex-wrap gap-2 text-xs font-semibold text-white/55"><span className="rounded-lg border border-white/15 px-2 py-1">{item.review_status.replaceAll('_', ' ')}</span><span>{item.active ? 'Active record' : 'Inactive record'}</span></div>
          <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-white/75">{item.question_text?.slice(0, 360) || 'Question text unavailable'}</p>
          <p className="mt-2 text-xs text-white/35">Question ID: {item.id}</p>
        </li>)}</ul>
      </>}
    </section>
  )
}
