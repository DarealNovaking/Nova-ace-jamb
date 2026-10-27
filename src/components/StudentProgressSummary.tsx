import { useEffect, useMemo, useState } from 'react'
import { Trophy } from 'lucide-react'
import { fetchStudentAttempts, fetchStudentMistakes } from '../lib/practiceService'
import { summarizeAttempts, summarizeAccuracyTrend } from '../lib/progressSummary'
import type { PastAttempt, StudentQuestionMistake } from '../lib/progressSummary'

type Subject = { id: string; name: string; code: string }
type Props = {
  subjects: Subject[]
  topicCount: number
  onStartCbt: (mode?: 'cbt' | 'practice') => void
}

const MISTAKE_LIMIT = 20

export default function StudentProgressSummary({ subjects, topicCount, onStartCbt }: Props) {
  const [attempts, setAttempts] = useState<PastAttempt[]>([])
  const [mistakes, setMistakes] = useState<StudentQuestionMistake[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    void Promise.all([fetchStudentAttempts(20), fetchStudentMistakes(MISTAKE_LIMIT)]).then(([nextAttempts, nextMistakes]) => {
      if (!active) return
      setAttempts(nextAttempts)
      setMistakes(nextMistakes)
    }).catch(() => {
      if (!active) return
      setAttempts([])
      setMistakes([])
      setError('We could not load your saved performance. Check your connection and try again.')
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [reload])

  const summary = useMemo(() => summarizeAttempts(attempts), [attempts])
  const trend = useMemo(() => summarizeAccuracyTrend(attempts), [attempts])
  const subjectName = (id: string) => subjects.find((subject) => subject.id === id)?.name ?? 'Other subject'
  const hasData = summary.sessions > 0
  const recent = attempts.filter((attempt) => attempt.status === 'completed' && attempt.answered_count > 0).slice(0, 5)

  const tiles = [
    { label: 'Saved subjects', value: String(subjects.length) },
    { label: 'Approved topics', value: String(topicCount) },
    { label: 'Verified performance', value: !loading && !error && hasData ? `${summary.accuracy}% correct` : 'Not available yet' },
  ]

  return (
    <section className="glass-card rounded-3xl p-6 sm:p-8">
      <div className="flex items-center gap-3"><Trophy className="text-purple-200" /><h2 className="text-2xl font-black">Your progress</h2></div>
      <p className="mt-3 text-sm leading-6 text-white/50">Progress is calculated from your saved completed attempts, never sample numbers. The history shown covers up to 20 recent sessions.</p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p role="status" aria-live="polite" className="text-sm text-white/60">{loading ? 'Loading your saved performance…' : error ? 'Performance unavailable' : 'Saved performance loaded'}</p>
        <button type="button" onClick={() => setReload((value) => value + 1)} disabled={loading} className="min-h-11 rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold disabled:opacity-50">Refresh progress</button>
      </div>
      {error && <div role="alert" className="mt-4 rounded-xl border border-red-300/20 bg-red-500/10 p-4 text-sm text-red-100">{error}<button type="button" className="ml-3 underline" onClick={() => setReload((value) => value + 1)}>Try again</button></div>}

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {tiles.map((item) => (
          <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[.025] p-5">
            <p className="text-sm text-white/45">{item.label}</p>
            <p className="mt-3 text-xl font-black">{item.value}</p>
          </div>
        ))}
      </div>

      {!loading && !error && !hasData && <p className="mt-5 text-sm leading-6 text-white/45">Attempt scores and mastery trends will appear when saved attempt data is available to the student analytics view.</p>}

      {!loading && !error && hasData && (
        <div className="mt-6 space-y-6">
          <p className="text-sm leading-6 text-white/60">
            {summary.correct} correct out of {summary.answered} questions answered across {summary.sessions} completed session{summary.sessions === 1 ? '' : 's'}.
          </p>

          {summary.bySubject.length > 0 && (
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white/70">By subject</h3>
              <ul className="mt-3 space-y-3">
                {summary.bySubject.map((entry) => (
                  <li key={entry.subjectId}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="font-semibold">{subjectName(entry.subjectId)}</span>
                      <span className="text-white/55">{entry.accuracy}% · {entry.correct}/{entry.answered}</span>
                    </div>
                    <div role="progressbar" aria-label={`${subjectName(entry.subjectId)} accuracy`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={entry.accuracy} className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-purple-400" style={{ width: `${entry.accuracy}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white/70">Recent sessions</h3>
            <ul className="mt-3 divide-y divide-white/10 rounded-2xl border border-white/10">
              {recent.map((attempt) => (
                <li key={attempt.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <span className="text-white/60">{new Date(attempt.started_at).toLocaleDateString()} · {attempt.mode === 'practice' ? 'Practice' : 'CBT mock'}</span>
                  <span className="font-semibold">{attempt.correct_count}/{attempt.answered_count}</span>
                </li>
              ))}
            </ul>
          </div>


          {trend.recent.length > 0 && (
            <section aria-labelledby="recent-accuracy-heading" className="rounded-2xl border border-white/10 bg-white/[.025] p-5">
              <h3 id="recent-accuracy-heading" className="font-bold">Recent session accuracy</h3>
              <p className="mt-2 text-sm text-white/50">A comparison of completed sessions with saved answers. It is not a predicted JAMB score.</p>
              {trend.changePoints !== null && <p className="mt-3 text-sm font-semibold text-purple-100">{trend.changePoints > 0 ? '+' : ''}{trend.changePoints} percentage points compared with your previous session.</p>}
              <ol className="mt-4 space-y-3">{trend.recent.map((point) => <li key={point.id} className="flex items-center justify-between gap-4 text-sm">
                <span className="text-white/60">{new Date(point.when).toLocaleDateString()} · {point.mode === 'practice' ? 'Practice' : 'CBT/mock'}</span>
                <span className="font-semibold">{point.accuracy}% · {point.correct}/{point.answered}</span>
              </li>)}</ol>
            </section>
          )}

          {mistakes.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[.025] p-5">
              <p className="text-sm leading-6 text-white/60">
                You have answered {mistakes.length >= MISTAKE_LIMIT ? `${MISTAKE_LIMIT}+` : mistakes.length} question{mistakes.length === 1 ? '' : 's'} wrong at least once. Practising again is the quickest way to fix them.
              </p>
              <button type="button" onClick={() => onStartCbt('practice')} className="mt-4 rounded-xl bg-purple-500 px-4 py-2.5 text-sm font-bold text-white">Start a practice session</button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
