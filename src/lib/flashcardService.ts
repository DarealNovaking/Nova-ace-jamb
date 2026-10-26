import { ace, supabase } from './supabase'

export type StudentFlashcard = {
  id: string
  subject_id: string | null
  topic_id: string | null
  subtopic_id: string | null
  front: string
  back: string
  source_type: string
  source_metadata: Record<string, unknown>
  content_version: number
  created_at: string
}

export type StudentFlashcardReview = {
  user_id: string
  flashcard_id: string
  review_count: number
  correct_count: number
  last_reviewed_at: string | null
  next_review_at: string | null
  ease: number
  interval_days: number
}

export async function getStudentFlashcards(subjectIds: string[]) {
  const { data: auth, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  if (!auth.user) throw new Error('Authentication required')

  const ids = [...new Set(subjectIds.filter((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)))]
  if (!ids.length) return { cards: [] as StudentFlashcard[], reviews: [] as StudentFlashcardReview[] }

  const columns = 'id,subject_id,topic_id,subtopic_id,front,back,source_type,source_metadata,content_version,created_at'
  const [subjectCards, generalCards] = await Promise.all([
    ace.from('flashcards').select(columns).eq('active', true).in('subject_id', ids).order('created_at', { ascending: true }),
    ace.from('flashcards').select(columns).eq('active', true).is('subject_id', null).order('created_at', { ascending: true }),
  ])
  if (subjectCards.error) throw subjectCards.error
  if (generalCards.error) throw generalCards.error

  const cards = [...(subjectCards.data ?? []), ...(generalCards.data ?? [])] as StudentFlashcard[]
  if (!cards.length) return { cards, reviews: [] as StudentFlashcardReview[] }

  const { data: reviews, error: reviewError } = await ace
    .from('flashcard_reviews')
    .select('user_id,flashcard_id,review_count,correct_count,last_reviewed_at,next_review_at,ease,interval_days')
    .eq('user_id', auth.user.id)
    .in('flashcard_id', cards.map((card) => card.id))
  if (reviewError) throw reviewError

  return { cards, reviews: (reviews ?? []) as StudentFlashcardReview[] }
}

export async function saveStudentFlashcardReview(flashcardId: string, recalled: boolean) {
  const { data: auth, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  if (!auth.user) throw new Error('Authentication required')

  const { data: previous, error: previousError } = await ace
    .from('flashcard_reviews')
    .select('review_count,correct_count,ease,interval_days')
    .eq('user_id', auth.user.id)
    .eq('flashcard_id', flashcardId)
    .maybeSingle()
  if (previousError) throw previousError

  const now = new Date()
  const previousReviews = previous?.review_count ?? 0
  const ease = Math.max(1.3, (previous?.ease ?? 2.5) + (recalled ? 0.1 : -0.2))
  const intervalDays = recalled
    ? previousReviews === 0 ? 1 : previousReviews === 1 ? 3 : Math.max(1, Math.round((previous?.interval_days ?? 1) * ease))
    : 1
  const nextReview = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000).toISOString()

  const review = {
    user_id: auth.user.id,
    flashcard_id: flashcardId,
    review_count: previousReviews + 1,
    correct_count: (previous?.correct_count ?? 0) + (recalled ? 1 : 0),
    last_reviewed_at: now.toISOString(),
    next_review_at: nextReview,
    ease,
    interval_days: intervalDays,
  }

  const { data, error } = await ace
    .from('flashcard_reviews')
    .upsert(review, { onConflict: 'user_id,flashcard_id' })
    .select('user_id,flashcard_id,review_count,correct_count,last_reviewed_at,next_review_at,ease,interval_days')
    .single()
  if (error) throw error
  return data as StudentFlashcardReview
}
