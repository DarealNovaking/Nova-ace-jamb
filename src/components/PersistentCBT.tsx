import { useEffect, useMemo, useRef, useState } from 'react'
import { Clock3, Loader2, Trophy } from 'lucide-react'
import {
  getRemainingSeconds,
  loadCbtQuestions,
  resumeCbt,
  saveCbtAnswer,
  startCbt,
  submitCbt,
  type CbtAttemptState,
  type CbtMode,
  type CbtQuestion,
} from '../lib/cbtService'

type Props = {
  attemptId?: string | null
  questionCount?: number
  durationSeconds?: number
  onComplete?: (result: Awaited<ReturnType<typeof submitCbt>>) => void
  storageKey?: string | null
  mode?: CbtMode
  questionIds?: string[]
  focus?: 'mistakes' | 'repeated' | 'speed' | 'subject' | 'topic' | 'subtopic' | null
  subjectId?: string | null
}

function safeCbtMessage(error: unknown, fallback: string) {
  // Supabase/PostgREST errors may be plain structured objects rather than native Error instances.
  const rawMessage = error instanceof Error
    ? error.message
    : typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string'
      ? error.message
      : typeof error === 'string'
        ? error
        : ''
  const message = rawMessage.toLowerCase()
  if (message.includes('no published questions') || message.includes('no questions available')) {
    return 'No reviewed questions are published for this session yet. Please try again after the academic team publishes approved questions.'
  }
  return fallback
}

function formatTime(seconds: number) {
  const safe = Math.max(0, seconds)
  const h = Math.floor(safe / 3600)
  const m = Math.floor((safe % 3600) / 60)
  const s = safe % 60
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':')
}

export default function PersistentCBT({ attemptId = null, questionCount = 20, durationSeconds = 1800, onComplete, storageKey = null, mode = 'cbt', questionIds, focus = null, subjectId }: Props) {
  const [attempt, setAttempt] = useState<CbtAttemptState | null>(null)
  const [questions, setQuestions] = useState<CbtQuestion[]>([])
  const [current, setCurrent] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<Awaited<ReturnType<typeof submitCbt>> | null>(null)
  const [markedForReview, setMarkedForReview] = useState<string[]>([])
  const [confirmSubmit, setConfirmSubmit] = useState(false)
  const finishing = useRef(false)
  const questionPresentedAt = useRef<{ id: string; at: number } | null>(null)

  const answers = useMemo(() => {
    const map: Record<string, string | null> = {}
    for (const answer of attempt?.answers ?? []) map[answer.question_id] = answer.selected_option_key
    return map
  }, [attempt?.answers])

  const question = questions[current]
  const selected = question ? answers[question.id] ?? null : null

  useEffect(() => {
    questionPresentedAt.current = question ? { id: question.id, at: performance.now() } : null
  }, [attempt?.attempt_id, question?.id])

  async function load(attemptToResume?: string) {
    setLoading(true)
    setError('')
    setResult(null)
    setConfirmSubmit(false)
    try {
      let state: CbtAttemptState
      const storedAttemptId = attemptToResume ?? (storageKey ? window.localStorage.getItem(storageKey) : null)
      if (storedAttemptId) {
        try {
          state = await resumeCbt(storedAttemptId)
        } catch (resumeError) {
          // Do not discard a recoverable student attempt on a network, auth or server failure.
          // Only a definitive, server-reported "Attempt not found" (P0002) proves
          // that a local recovery pointer is stale. No other error creates a new attempt.
          const code = typeof resumeError === 'object' && resumeError !== null && 'code' in resumeError
            ? resumeError.code : null
          if (attemptToResume || !storageKey || code !== 'P0002') throw resumeError
          window.localStorage.removeItem(storageKey)
          const started = await startCbt({ mode, questionCount, durationSeconds, questionIds, subjectId })
          window.localStorage.setItem(storageKey, started.attempt_id)
          state = await resumeCbt(started.attempt_id)
        }
      } else {
        const started = await startCbt({ mode, questionCount, durationSeconds, questionIds, subjectId })
        if (storageKey) window.localStorage.setItem(storageKey, started.attempt_id)
        state = await resumeCbt(started.attempt_id)
      }
      if (state.status === 'completed' && storageKey) window.localStorage.removeItem(storageKey)
      const loadedQuestions = state.status === 'completed' ? [] : await loadCbtQuestions(state.question_order)
      // Local review marks help navigation but never affect authoritative answers.
      // Ignore flags for questions not on this server-owned attempt.
      const reviewKey = 'ace-cbt-review-flags:' + state.attempt_id
      if (state.status === 'completed') {
        try { window.localStorage.removeItem(reviewKey) } catch { /* Optional local storage. */ }
        setMarkedForReview([])
      } else {
        try {
          const value: unknown = JSON.parse(window.localStorage.getItem(reviewKey) ?? '[]')
          setMarkedForReview(Array.isArray(value)
            ? [...new Set(value.filter((id): id is string => typeof id === 'string' && state.question_order.includes(id)))]
            : [])
        } catch { setMarkedForReview([]) }
      }
      setAttempt(state)
      setQuestions(loadedQuestions)
      setRemaining(state.remaining_seconds ?? getRemainingSeconds(state.started_at, state.duration_seconds))
      if (state.status === 'completed' && state.score !== null && state.completed_at) {
        setResult({
          attempt_id: state.attempt_id,
          status: 'completed',
          score: state.score,
          correct_count: state.correct_count,
          answered_count: state.answered_count,
          total_questions: state.question_order.length,
          completed_at: state.completed_at,
        })
      }
      const firstUnanswered = state.question_order.findIndex((id) => !state.answers.some((a) => a.question_id === id && a.selected_option_key !== null))
      setCurrent(firstUnanswered >= 0 ? firstUnanswered : 0)
    } catch (e: any) {
      setError(safeCbtMessage(e, 'We could not load this CBT session. Check your connection and try again.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load(attemptId ?? undefined) }, [attemptId])

  useEffect(() => {
    if (!attempt || attempt.status !== 'active') return
    const timer = window.setInterval(() => {
      const next = getRemainingSeconds(attempt.started_at, attempt.duration_seconds)
      setRemaining(next)
      if (next <= 0) {
        window.clearInterval(timer)
        void finish()
      }
    }, 1000)
    return () => window.clearInterval(timer)
  }, [attempt?.attempt_id, attempt?.status, attempt?.started_at, attempt?.duration_seconds])

  async function choose(optionKey: string) {
    if (!attempt || attempt.status !== 'active' || !question || saving || submitting || remaining <= 0) return
    setSaving(true)
    setError('')
    try {
      // Measure time from when this question became visible, including the first answer.
      // Prior code used the previous answer timestamp, making first-answer speeds null.
      const shown = questionPresentedAt.current
      const responseMs = shown?.id === question.id
        ? Math.max(0, Math.round(performance.now() - shown.at))
        : null
      const saved = await saveCbtAnswer(attempt.attempt_id, question.id, optionKey, responseMs)
      setAttempt((currentAttempt) => currentAttempt ? {
        ...currentAttempt,
        answers: currentAttempt.answers.some((a) => a.question_id === question.id)
          ? currentAttempt.answers.map((a) => a.question_id === question.id ? { ...a, selected_option_key: saved.selected_option_key, response_ms: responseMs, answered_at: saved.answered_at } : a)
          : [...currentAttempt.answers, { question_id: question.id, selected_option_key: saved.selected_option_key, response_ms: responseMs, answered_at: saved.answered_at }],
        answered_count: saved.answered_count,
      } : currentAttempt)
    } catch (e: any) {
      setError(safeCbtMessage(e, 'Your answer could not be saved. Please retry before moving on.'))
    } finally {
      setSaving(false)
    }
  }

  async function finish() {
    if (!attempt || attempt.status !== 'active' || submitting || finishing.current) return
    finishing.current = true
    setSubmitting(true)
    setError('')
    try {
      const submitted = await submitCbt(attempt.attempt_id)
      // Older idempotent submit responses may omit total_questions; the saved attempt order is authoritative.
      const completed = { ...submitted, total_questions: submitted.total_questions ?? attempt.question_order.length }
      setResult(completed)
      setConfirmSubmit(false)
      if (storageKey) window.localStorage.removeItem(storageKey)
      try { window.localStorage.removeItem('ace-cbt-review-flags:' + attempt.attempt_id) } catch { /* Optional local storage. */ }
      setMarkedForReview([])
      setAttempt((currentAttempt) => currentAttempt ? { ...currentAttempt, status: 'completed', score: completed.score, correct_count: completed.correct_count, answered_count: completed.answered_count, completed_at: completed.completed_at, remaining_seconds: 0 } : currentAttempt)
      onComplete?.(completed)
    } catch (e: any) {
      setError(safeCbtMessage(e, 'We could not submit this CBT session. Your saved answers have been kept; please retry.'))
    } finally {
      finishing.current = false
      setSubmitting(false)
    }
  }

  function toggleReviewMark() {
    if (!attempt || attempt.status !== 'active' || !question) return
    const next = markedForReview.includes(question.id)
      ? markedForReview.filter((id) => id !== question.id)
      : [...markedForReview, question.id]
    setMarkedForReview(next)
    try { window.localStorage.setItem('ace-cbt-review-flags:' + attempt.attempt_id, JSON.stringify(next)) }
    catch { /* Review works without persistent local storage. */ }
  }

  function nextUnanswered() {
    if (!questions.length) return
    for (let offset = 1; offset <= questions.length; offset += 1) {
      const index = (current + offset) % questions.length
      if (answers[questions[index].id] == null) {
        setCurrent(index)
        return
      }
    }
  }

  function submitRequested() {
    if (saving || submitting || !attempt || attempt.status !== 'active') return
    const unanswered = questions.filter((item) => answers[item.id] == null).length
    if (remaining > 0 && (unanswered > 0 || markedForReview.length > 0)) {
      setConfirmSubmit(true)
      return
    }
    void finish()
  }

  function reviewBeforeSubmit() {
    const firstMarked = questions.findIndex((item) => markedForReview.includes(item.id))
    const firstUnanswered = questions.findIndex((item) => answers[item.id] == null)
    setCurrent(firstMarked >= 0 ? firstMarked : firstUnanswered >= 0 ? firstUnanswered : current)
    setConfirmSubmit(false)
  }

  if (loading) return <div aria-busy="true" className="glass-card rounded-3xl p-8 text-center"><div role="status" aria-live="polite" aria-atomic="true"><Loader2 aria-hidden="true" className="mx-auto animate-spin"/><p className="mt-3 text-sm text-white/50">Restoring CBT session…</p></div></div>
  if (error && !attempt) return <div className="glass-card rounded-3xl p-6"><p className="font-semibold">CBT unavailable</p><p role="alert" className="mt-2 text-sm text-white/50">{error}</p><button type="button" className="mt-5 rounded-xl bg-white px-4 py-3 font-bold text-black" onClick={() => void load(attemptId ?? undefined)}>Retry</button></div>
  if (result) return <section aria-labelledby="cbt-result-title" className="glass-card mx-auto max-w-lg rounded-3xl p-8 text-center">
    <Trophy className="mx-auto text-purple-200" aria-hidden="true"/>
    <h1 id="cbt-result-title" className="mt-3 text-xl font-bold">Session completed</h1>
    <p className="mt-4 text-5xl font-black">{result.score}%</p>
    <p className="mt-2 text-white/60">{result.correct_count}/{result.total_questions} correct</p>
    <div className="mt-5 rounded-xl border border-white/10 p-4 text-left text-sm text-white/70">
      <h2 className="font-bold">Saved answer summary</h2>
      <p className="mt-2">{result.answered_count} answered · {Math.max(0, result.total_questions - result.answered_count)} unanswered</p>
      <p className="mt-2 text-xs text-white/45">Server-scored result from this attempt. This is not a predicted JAMB score.</p>
    </div>
    <a href="/?view=progress" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-purple-300 px-5 py-3 text-sm font-bold text-[#120b1c]">View progress history</a>
    <p className="mt-4 break-all text-xs text-white/30">Saved server-side as attempt {result.attempt_id}</p>
  </section>
  if (attempt && attempt.status !== 'active') return <div className="glass-card rounded-3xl p-6"><p className="font-semibold">This CBT attempt is no longer active.</p><p className="mt-2 text-sm text-white/50">Your saved result remains attached to your account when the attempt is completed. You can start a new attempt when published questions are available.</p><button type="button" onClick={() => void load()} className="mt-5 rounded-xl bg-white px-4 py-3 font-bold text-black">Start a new CBT</button></div>
  if (!attempt || !question) return <div className="glass-card rounded-3xl p-6">No CBT questions are currently available.</div>

  const optionKeys = attempt.option_order[question.id] ?? question.options.map((o) => o.key)
  const optionsByKey = new Map(question.options.map((o) => [o.key, o]))
  const answeredCount = questions.filter((item) => answers[item.id] != null).length
  const pendingCount = questions.length - answeredCount
  const markedCount = questions.filter((item) => markedForReview.includes(item.id)).length

  return <div className="space-y-5">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="text-xs uppercase tracking-[.2em] text-purple-300/70">Persistent CBT</p><h1 className="mt-1 text-3xl font-black">{focus === 'mistakes' ? 'Mistake review practice' : focus === 'repeated' ? 'Repeated-mistake practice' : focus === 'speed' ? 'Speed practice' : focus === 'subject' ? 'Subject practice' : focus === 'topic' ? 'Topic practice' : focus === 'subtopic' ? 'Subtopic practice' : 'JAMB simulation'}</h1></div>
      <div role="timer" aria-label={`Time remaining ${formatTime(remaining)}`} className={`rounded-xl px-4 py-2 font-mono ${remaining < 60 ? 'bg-red-500/20 text-red-200' : 'bg-white/5'}`}><Clock3 aria-hidden="true" className="mr-2 inline" size={16}/>{formatTime(remaining)}</div>
    </div>
    {error && <div role="alert" className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-100">{error}</div>}
    {confirmSubmit && <section aria-labelledby="cbt-submission-confirm" className="rounded-2xl border border-amber-200/30 bg-amber-300/[.06] p-5">
      <h2 id="cbt-submission-confirm" className="text-lg font-bold">Review before submitting</h2>
      <p className="mt-2 text-sm leading-6 text-white/70">{pendingCount} unanswered and {markedCount} marked for review. Submission ends this attempt, and your saved answers will be scored by the server.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" onClick={reviewBeforeSubmit} className="min-h-11 rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold">Review questions</button>
        <button type="button" disabled={saving || submitting} onClick={() => void finish()} className="min-h-11 rounded-xl bg-purple-300 px-4 py-3 text-sm font-bold text-[#120b1c] disabled:opacity-40">Submit anyway</button>
      </div>
    </section>}
    <p role="status" aria-live="polite" aria-atomic="true" className="min-h-5 text-sm text-purple-200/80">{saving ? 'Saving your answer…' : submitting ? 'Submitting your CBT…' : ''}</p>
    <div className="grid gap-5 lg:grid-cols-[1fr_230px]">
      <section className="glass-card rounded-3xl p-6">
        <div className="flex items-center justify-between text-xs text-white/40"><span>Question {current + 1} of {questions.length}</span><span>{attempt.answered_count} answered</span></div>
        <h2 id="cbt-question-title" className="mt-5 text-xl font-bold leading-8">{question.text}</h2>
        <div role="group" aria-labelledby="cbt-question-title" className="mt-6 grid gap-3">{optionKeys.map((key) => {
          const option = optionsByKey.get(key)
          if (!option) return null
          return <button key={key} type="button" aria-pressed={selected === key} aria-label={String.fromCharCode(65 + optionKeys.indexOf(key)) + '. ' + option.text} disabled={saving || submitting} onClick={() => void choose(key)} className={`rounded-xl border p-4 text-left transition ${selected === key ? 'border-purple-300/60 bg-purple-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}><span aria-hidden="true" className="mr-3 font-bold">{String.fromCharCode(65 + optionKeys.indexOf(key))}.</span>{option.text}</button>
        })}</div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button type="button" onClick={toggleReviewMark} aria-pressed={markedForReview.includes(question.id)} className="min-h-11 rounded-xl border border-purple-300/40 px-4 py-2 text-sm font-semibold text-purple-100">{markedForReview.includes(question.id) ? 'Remove review mark' : 'Mark for review'}</button>
          <button type="button" onClick={nextUnanswered} disabled={pendingCount === 0} className="min-h-11 rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold disabled:opacity-40">Next unanswered</button>
        </div>
        <div className="mt-5 flex gap-3"><button type="button" disabled={current === 0} onClick={() => setCurrent((v) => Math.max(0, v - 1))} className="flex-1 rounded-xl border border-white/10 py-3 disabled:opacity-30">Previous</button>{current < questions.length - 1 ? <button type="button" onClick={() => setCurrent((v) => Math.min(questions.length - 1, v + 1))} className="flex-1 rounded-xl bg-white py-3 font-bold text-black">Next</button> : <button type="button" disabled={submitting || saving} onClick={submitRequested} className="flex-1 rounded-xl bg-purple-500 py-3 font-bold disabled:opacity-40">{submitting ? 'Submitting…' : 'Submit CBT'}</button>}</div>
      </section>
      <aside aria-label="Question navigation" className="glass-card h-fit rounded-2xl p-4"><p id="cbt-question-map-label" className="text-xs text-white/40">Question map</p><p className="mt-2 text-xs text-white/60">{answeredCount} answered · {pendingCount} unanswered · {markedCount} marked for review</p><p className="mt-2 text-xs text-white/40">Review marks remain on this device during an active attempt; answers are saved separately on the server.</p><div role="group" aria-labelledby="cbt-question-map-label" className="mt-3 grid grid-cols-4 gap-2">{questions.map((item, index) => <button key={item.id} type="button" aria-label={`Go to question ${index + 1}, ${answers[item.id] != null ? 'answered' : 'unanswered'}${markedForReview.includes(item.id) ? ', marked for review' : ''}`} aria-current={index === current ? 'step' : undefined} onClick={() => setCurrent(index)} className={`h-9 rounded-lg text-xs ${index === current ? 'bg-white text-black' : markedForReview.includes(item.id) ? 'border border-purple-300 bg-purple-500/20 text-purple-100' : answers[item.id] != null ? 'bg-purple-500/25' : 'bg-white/5'}`}>{index + 1}</button>)}</div></aside>
    </div>
  </div>
}
