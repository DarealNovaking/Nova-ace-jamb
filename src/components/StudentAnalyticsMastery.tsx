import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, Clock3, RefreshCw, Trophy } from 'lucide-react'
import { listPastAttempts, listStudentMistakes, type PastAttempt, type StudentQuestionMistake } from '../lib/practiceService'

type Subject = { id: string; name: string; code: string }
type Props = { subjects: Subject[]; onStartCbt: (mode?: 'cbt' | 'practice') => void }

export default function StudentAnalyticsMastery({ subjects, onStartCbt }: Props) {
  const [attempts, setAttempts] = useState<PastAttempt[]>([])
  const [mistakes, setMistakes] = useState<StudentQuestionMistake[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [savedAttempts, savedMistakes] = await Promise.all([listPastAttempts(50), listStudentMistakes(50)])
      setAttempts(savedAttempts)
      setMistakes(savedMistakes)
    } catch {
      setError('We could not load your saved progress. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const completed = useMemo(() => attempts.filter((attempt) => attempt.status === 'completed'), [attempts])
  const totals = useMemo(() => completed.reduce((result, attempt) => ({
    answered: result.answered + (attempt.answered_count || 0),
    correct: result.correct + (attempt.correct_count || 0),
  }), { answered: 0, correct: 0 }), [completed])
  const accuracy = totals.answered ? Math.round((totals.correct / totals.answered) * 100) : null
  const subjectSummary = useMemo(() => subjects.map((subject) => {
    const rows = completed.filter((attempt) => attempt.subject_id === subject.id)
    const answered = rows.reduce((sum, attempt) => sum + (attempt.answered_count || 0), 0)
    const correct = rows.reduce((sum, attempt) => sum + (attempt.correct_count || 0), 0)
    return { ...subject, attempts: rows.length, answered, accuracy: answered ? Math.round(correct / answered * 100) : null }
  }), [subjects, completed])

  return <section className="glass-card space-y-6 rounded-3xl p-6 sm:p-8" aria-labelledby="progress-summary-title">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><div className="flex items-center gap-3"><Trophy className="text-purple-200" aria-hidden="true"/><h2 id="progress-summary-title" className="text-2xl font-black">Your progress & mastery</h2></div><p className="mt-2 text-sm leading-6 text-white/50">Calculated from your saved attempts. This is practice performance, not an official JAMB score prediction.</p></div>
      <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/5 disabled:opacity-50"><RefreshCw size={15} aria-hidden="true" className={loading ? 'animate-spin' : ''}/> Refresh</button>
    </div>
    {loading ? <p role="status" aria-live="polite" className="text-sm text-white/60">Loading saved progress…</p> : error ? <div role="alert" className="rounded-2xl border border-red-300/20 bg-red-500/10 p-4"><div className="flex items-start gap-2 text-sm text-red-100"><AlertCircle size={18} aria-hidden="true"/><p>{error}</p></div><button type="button" onClick={() => void load()} className="mt-3 underline text-sm">Try again</button></div> : <>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><p className="text-sm text-white/45">Completed attempts</p><p className="mt-2 text-2xl font-black">{completed.length}</p></div>
        <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><p className="text-sm text-white/45">Questions answered</p><p className="mt-2 text-2xl font-black">{totals.answered}</p></div>
        <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><p className="text-sm text-white/45">Answer accuracy</p><p className="mt-2 text-2xl font-black">{accuracy === null ? '—' : `${accuracy}%`}</p></div>
      </div>
      <div><h3 className="font-bold">By subject</h3>{subjectSummary.length ? <ul className="mt-3 grid gap-2 sm:grid-cols-2">{subjectSummary.map((subject) => <li key={subject.id} className="rounded-xl border border-white/10 bg-white/[.02] p-4"><div className="flex items-center justify-between gap-3"><span className="font-semibold">{subject.name}</span><span className="text-sm text-white/55">{subject.accuracy === null ? 'No results yet' : `${subject.accuracy}% accuracy`}</span></div><p className="mt-1 text-xs text-white/40">{subject.attempts} completed attempt{subject.attempts === 1 ? '' : 's'} · {subject.answered} answered</p></li>)}</ul> : <p className="mt-2 text-sm text-white/50">No saved subjects are available yet.</p>}</div>
      <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><div className="flex items-center gap-2"><CheckCircle2 size={17} className="text-purple-200" aria-hidden="true"/><h3 className="font-bold">Revision focus</h3></div><p className="mt-2 text-sm leading-6 text-white/50">{mistakes.length ? `${mistakes.length} questions have recorded incorrect answers. Review the topics and retry practice to strengthen recall.` : 'No recorded mistakes to review yet. Complete a practice session to build your progress history.'}</p><p className="mt-3 flex items-center gap-2 text-xs text-white/40"><Clock3 size={14} aria-hidden="true"/> Results update from saved attempt records.</p></div>
      {completed.length === 0 && <div className="rounded-2xl border border-dashed border-white/15 p-5"><p className="font-semibold">Your progress starts with your first completed session.</p><p className="mt-2 text-sm leading-6 text-white/50">We will show real saved results here and will not fill this screen with sample scores.</p><button type="button" onClick={() => onStartCbt('practice')} className="mt-4 rounded-xl bg-white px-4 py-3 text-sm font-bold text-black">Start practice</button></div>}
    </>}
  </section>
}
