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
  focus?: 'mistakes' | null
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

export default function PersistentCBT({ attemptId = null, questionCount = 20, durationSeconds = 1800, onComplete, storageKey = null, mode = 'cbt', questionIds, focus = null }: Props) {
  const [attempt, setAttempt] = useState<CbtAttemptState | null>(null)
  const [questions, setQuestions] = useState<CbtQuestion[]>([])
  const [current, setCurrent] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<Awaited<ReturnType<typeof submitCbt>> | null>(null)
  const finishing = useRef(false)

  const answers = useMemo(() => {
    const map: Record<string, string | null> = {}
    for (const answer of attempt?.answers ?? []) map[answer.question_id] = answer.selected_option_key
    return map
  }, [attempt?.answers])

  const question = questions[current]
  const selected = question ? answers[question.id] ?? null : null

  async function load(attemptToResume?: string) {
    setLoading(true)
    setError('')
    setResult(null)
    try {
      let state: CbtAttemptState
      const storedAttemptId = attemptToResume ?? (storageKey ? window.localStorage.getItem(storageKey) : null)
      if (storedAttemptId) {
        try {
          state = await resumeCbt(storedAttemptId)
        } catch (resumeError) {
          // An explicit attempt ID must fail visibly; a stale local recovery pointer may be replaced.
          if (attemptToResume || !storageKey) throw resumeError
          window.localStorage.removeItem(storageKey)
          const started = await startCbt({ mode, questionCount, durationSeconds, questionIds })
          window.localStorage.setItem(storageKey, started.attempt_id)
          state = await resumeCbt(started.attempt_id)
        }
      } else {
        const started = await startCbt({ mode, questionCount, durationSeconds, questionIds })
        if (storageKey) window.localStorage.setItem(storageKey, started.attempt_id)
        state = await resumeCbt(started.attempt_id)
      }
      if (state.status === 'completed' && storageKey) window.localStorage.removeItem(storageKey)
      const loadedQuestions = state.status === 'completed' ? [] : await loadCbtQuestions(state.question_order)
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
      const startedAt = attempt.answers.find((a) => a.question_id === question.id)?.answered_at
      const responseMs = startedAt ? Math.max(0, Date.now() - new Date(startedAt).getTime()) : null
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
      if (storageKey) window.localStorage.removeItem(storageKey)
      setAttempt((currentAttempt) => currentAttempt ? { ...currentAttempt, status: 'completed', score: completed.score, correct_count: completed.correct_count, answered_count: completed.answered_count, completed_at: completed.completed_at, remaining_seconds: 0 } : currentAttempt)
      onComplete?.(completed)
    } catch (e: any) {
      setError(safeCbtMessage(e, 'We could not submit this CBT session. Your saved answers have been kept; please retry.'))
    } finally {
      finishing.current = false
      setSubmitting(false)
    }
  }

  if (loading) return <div aria-busy="true" className="glass-card rounded-3xl p-8 text-center"><div role="status" aria-live="polite" aria-atomic="true"><Loader2 aria-hidden="true" className="mx-auto animate-spin"/><p className="mt-3 text-sm text-white/50">Restoring CBT session…</p></div></div>
  if (error && !attempt) return <div className="glass-card rounded-3xl p-6"><p className="font-semibold">CBT unavailable</p><p role="alert" className="mt-2 text-sm text-white/50">{error}</p><button type="button" className="mt-5 rounded-xl bg-white px-4 py-3 font-bold text-black" onClick={() => void load(attemptId ?? undefined)}>Retry</button></div>
  if (result) return <div className="glass-card mx-auto max-w-md rounded-3xl p-8 text-center"><Trophy className="mx-auto"/><p className="mt-4 text-5xl font-black">{result.score}%</p><p className="mt-2 text-white/50">{result.correct_count}/{result.total_questions} correct</p><p className="mt-4 text-xs text-white/30">Saved server-side as attempt {result.attempt_id}</p></div>
  if (attempt && attempt.status !== 'active') return <div className="glass-card rounded-3xl p-6"><p className="font-semibold">This CBT attempt is no longer active.</p><p className="mt-2 text-sm text-white/50">Your saved result remains attached to your account when the attempt is completed. You can start a new attempt when published questions are available.</p><button type="button" onClick={() => void load()} className="mt-5 rounded-xl bg-white px-4 py-3 font-bold text-black">Start a new CBT</button></div>
  if (!attempt || !question) return <div className="glass-card rounded-3xl p-6">No CBT questions are currently available.</div>

  const optionKeys = attempt.option_order[question.id] ?? question.options.map((o) => o.key)
  const optionsByKey = new Map(question.options.map((o) => [o.key, o]))

  return <div className="space-y-5">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="text-xs uppercase tracking-[.2em] text-purple-300/70">Persistent CBT</p><h1 className="mt-1 text-3xl font-black">{focus === 'mistakes' ? 'Mistake review practice' : 'JAMB simulation'}</h1></div>
      <div role="timer" aria-label={`Time remaining ${formatTime(remaining)}`} className={`rounded-xl px-4 py-2 font-mono ${remaining < 60 ? 'bg-red-500/20 text-red-200' : 'bg-white/5'}`}><Clock3 aria-hidden="true" className="mr-2 inline" size={16}/>{formatTime(remaining)}</div>
    </div>
    {error && <div role="alert" className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-100">{error}</div>}
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
        <div className="mt-5 flex gap-3"><button type="button" disabled={current === 0} onClick={() => setCurrent((v) => Math.max(0, v - 1))} className="flex-1 rounded-xl border border-white/10 py-3 disabled:opacity-30">Previous</button>{current < questions.length - 1 ? <button type="button" onClick={() => setCurrent((v) => Math.min(questions.length - 1, v + 1))} className="flex-1 rounded-xl bg-white py-3 font-bold text-black">Next</button> : <button type="button" disabled={submitting} onClick={() => void finish()} className="flex-1 rounded-xl bg-purple-500 py-3 font-bold">{submitting ? 'Submitting…' : 'Submit CBT'}</button>}</div>
      </section>
      <aside aria-label="Question navigation" className="glass-card h-fit rounded-2xl p-4"><p id="cbt-question-map-label" className="text-xs text-white/40">Question map</p><div role="group" aria-labelledby="cbt-question-map-label" className="mt-3 grid grid-cols-4 gap-2">{questions.map((item, index) => <button key={item.id} type="button" aria-label={`Go to question ${index + 1}, ${answers[item.id] != null ? 'answered' : 'unanswered'}`} aria-current={index === current ? 'step' : undefined} onClick={() => setCurrent(index)} className={`h-9 rounded-lg text-xs ${index === current ? 'bg-white text-black' : answers[item.id] != null ? 'bg-purple-500/25' : 'bg-white/5'}`}>{index + 1}</button>)}</div></aside>
    </div>
  </div>
}
