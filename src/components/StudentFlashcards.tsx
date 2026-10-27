import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, ChevronRight, Layers3, Loader2, RotateCcw } from 'lucide-react'
import { getStudentFlashcards, saveStudentFlashcardReview, type StudentFlashcard, type StudentFlashcardReview } from '../lib/flashcardService'

type Subject = { id: string; name: string; code: string }
type Topic = { id: string; name: string; subjectName: string; subtopics?: Array<{ id: string; name: string }> }

function shuffle<T>(items: T[]) {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function orderForReview(cards: StudentFlashcard[], reviews: Record<string, StudentFlashcardReview>) {
  const due: StudentFlashcard[] = []
  const scheduled: StudentFlashcard[] = []
  const now = Date.now()
  for (const card of cards) {
    const nextReviewAt = reviews[card.id]?.next_review_at
    const nextReviewTime = nextReviewAt ? Date.parse(nextReviewAt) : Number.NaN
    if (!Number.isFinite(nextReviewTime) || nextReviewTime <= now) due.push(card)
    else scheduled.push(card)
  }
  return [...shuffle(due), ...shuffle(scheduled)]
}

export default function StudentFlashcards({ subjects, topics }: { subjects: Subject[]; topics: Topic[] }) {
  const [cards, setCards] = useState<StudentFlashcard[]>([])
  const [reviews, setReviews] = useState<Record<string, StudentFlashcardReview>>({})
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [complete, setComplete] = useState(false)
  const loadSequence = useRef(0)
  // The dashboard can recreate its subjects array during unrelated renders.
  // Key the load effect to the selected IDs, not the array identity, so a saved
  // review/error is not immediately cleared by an unnecessary automatic reload.
  const subjectIdsKey = subjects.map((subject) => subject.id).join(',')

  const load = useCallback(async () => {
    const requestId = ++loadSequence.current
    setLoading(true)
    setError('')
    setNotice('')
    setComplete(false)
    try {
      const result = await getStudentFlashcards(subjectIdsKey ? subjectIdsKey.split(',') : [])
      // Ignore stale responses when the actual selected subject IDs change.
      if (requestId !== loadSequence.current) return
      const reviewMap = Object.fromEntries(result.reviews.map((review) => [review.flashcard_id, review]))
      setReviews(reviewMap)
      setCards(orderForReview(result.cards, reviewMap))
      setIndex(0)
      setRevealed(false)
    } catch {
      if (requestId === loadSequence.current) {
        setError('We could not load your flashcards. Check your connection and try again.')
      }
    } finally {
      if (requestId === loadSequence.current) setLoading(false)
    }
  }, [subjectIdsKey])

  useEffect(() => { void load() }, [load])

  const card = cards[index] ?? null
  const subjectName = useMemo(() => {
    if (!card?.subject_id) return 'General revision'
    return subjects.find((subject) => subject.id === card.subject_id)?.name ?? 'Selected subject'
  }, [card, subjects])
  const review = card ? reviews[card.id] : undefined
  const nextReviewTime = review?.next_review_at ? Date.parse(review.next_review_at) : Number.NaN
  const due = !Number.isFinite(nextReviewTime) || nextReviewTime <= Date.now()
  const topic = card?.topic_id ? topics.find((item) => item.id === card.topic_id) : undefined
  const subtopic = topic && card?.subtopic_id ? topic.subtopics?.find((item) => item.id === card.subtopic_id) : undefined

  async function reviewCard(recalled: boolean) {
    if (!card || saving) return
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const saved = await saveStudentFlashcardReview(card.id, recalled)
      setReviews((current) => ({ ...current, [saved.flashcard_id]: saved }))
      setNotice(recalled ? 'Review saved. Marked as recalled.' : 'Review saved. Added to your review schedule.')
      if (index + 1 < cards.length) {
        setIndex((current) => current + 1)
        setRevealed(false)
      } else {
        setComplete(true)
      }
    } catch {
      setError('We could not save this review. Your card is still available; please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <section aria-busy="true" className="glass-card rounded-3xl p-8 text-white"><div role="status" aria-live="polite" aria-atomic="true" className="flex items-center gap-3 text-sm text-white/60"><Loader2 size={18} className="animate-spin" aria-hidden="true" />Loading approved flashcards…</div></section>

  return (
    <section aria-labelledby="flashcards-title" className="glass-card rounded-3xl p-6 text-white sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3"><Layers3 className="text-purple-200" aria-hidden="true" /><div><h2 id="flashcards-title" className="text-2xl font-black">Your flashcard deck</h2><p className="mt-1 text-sm text-white/45">Recall reviewed facts and keep your review history on your account.</p></div></div>
        <button type="button" onClick={() => void load()} disabled={saving} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/5 disabled:opacity-50"><RotateCcw size={15} aria-hidden="true" /> Refresh deck</button>
      </div>

      {error && <div role="alert" className="mt-5 rounded-xl border border-red-300/20 bg-red-500/10 p-4 text-sm text-red-100"><p>{error}</p>{!saving && <button type="button" onClick={() => void load()} className="mt-2 underline">Try again</button>}</div>}
      {notice && <p role="status" aria-live="polite" aria-atomic="true" className="mt-5 rounded-xl border border-emerald-300/20 bg-emerald-500/10 p-3 text-sm text-emerald-100"><CheckCircle2 size={16} className="mr-2 inline" aria-hidden="true" />{notice}</p>}

      {!cards.length && !error && <div className="mt-6 rounded-2xl border border-dashed border-white/15 p-8 text-center"><Layers3 className="mx-auto text-white/35" size={30} aria-hidden="true" /><h3 className="mt-4 text-lg font-bold">No approved flashcards are available for your selected subjects yet.</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/45">Only active, reviewed cards are shown. Approved learning content must be published before a deck can appear; topic titles are never turned into made-up facts.</p></div>}

      {cards.length > 0 && complete && <div className="mt-6 rounded-2xl border border-emerald-300/20 bg-emerald-500/[.06] p-8 text-center"><CheckCircle2 className="mx-auto text-emerald-200" size={32} aria-hidden="true" /><h3 className="mt-3 text-xl font-black">Deck complete</h3><p className="mt-2 text-sm text-white/55">Your review responses have been saved to your account.</p><button type="button" onClick={() => { setIndex(0); setRevealed(false); setComplete(false); setNotice(''); setCards(orderForReview(cards, reviews)) }} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-purple-300 px-4 py-2 text-sm font-bold text-[#120b1c]"><RotateCcw size={15} aria-hidden="true" /> Review again</button></div>}

      {card && !complete && <div className="mt-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-white/45"><span>{subjectName}{topic ? ` · ${topic.name}` : ''}{subtopic ? ` · ${subtopic.name}` : ''}</span><span>Card {index + 1} of {cards.length}</span><span>{due ? 'Due for review' : 'Scheduled for later'}</span></div>
        <div role="progressbar" aria-label="Flashcard deck progress" aria-valuemin={0} aria-valuemax={cards.length} aria-valuenow={index + 1} className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-purple-300" style={{ width: `${((index + 1) / cards.length) * 100}%` }} /></div>
        {review && <p className="mb-4 text-xs text-white/45">Reviewed {review.review_count} time{review.review_count === 1 ? '' : 's'} · {review.correct_count} recalled{review.next_review_at ? ` · Next review ${new Date(review.next_review_at).toLocaleDateString()}` : ''}</p>}
        <div className="min-h-52 rounded-2xl border border-purple-300/20 bg-black/20 p-6 sm:p-8"><p className="text-xs font-bold uppercase tracking-[.18em] text-purple-200/70">Prompt</p><p className="mt-4 whitespace-pre-wrap text-lg font-semibold leading-8">{card.front}</p>
          {revealed ? <div className="mt-7 border-t border-white/10 pt-5"><p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-200/70">Answer</p><p className="mt-3 whitespace-pre-wrap text-base leading-7 text-white/80">{card.back}</p></div> : <button type="button" onClick={() => setRevealed(true)} className="mt-6 min-h-11 rounded-xl bg-white px-4 py-2 text-sm font-bold text-black">Show answer</button>}
        </div>
        {revealed && <div className="mt-4 flex flex-col gap-3 sm:flex-row"><button type="button" onClick={() => void reviewCard(false)} disabled={saving} className="min-h-11 flex-1 rounded-xl border border-white/15 px-4 py-3 text-sm font-bold hover:bg-white/5 disabled:opacity-50">{saving ? 'Saving review…' : 'Needs more practice'}</button><button type="button" onClick={() => void reviewCard(true)} disabled={saving} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-purple-300 px-4 py-3 text-sm font-bold text-[#120b1c] disabled:opacity-50">{saving ? 'Saving review…' : <>I knew it <ChevronRight size={16} aria-hidden="true" /></>}</button></div>}
      </div>}
    </section>
  )
}
