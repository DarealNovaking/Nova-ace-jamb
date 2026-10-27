import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Clock3, Loader2, RotateCcw } from 'lucide-react'
import { fetchStudentMistakes } from '../lib/practiceService'
import type { StudentQuestionMistake } from '../lib/progressSummary'

type Subject = { id: string; name: string; code: string }
type Topic = { id: string; name: string; description: string | null; subjectName: string; sort_order: number; subtopics?: Array<{ id: string; name: string; description: string | null }> }

export default function StudentQuickRevision({ subjects, topics, onStartPractice, onReviewMistakes, onReviewRepeated }: { subjects: Subject[]; topics: Topic[]; onStartPractice: () => void; onReviewMistakes: () => void; onReviewRepeated: () => void }) {
  const [subjectId, setSubjectId] = useState('all')
  const [topicId, setTopicId] = useState('')
  const [mistakes, setMistakes] = useState<StudentQuestionMistake[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)

  const visibleTopics = useMemo(() => topics.filter((topic) => subjectId === 'all' || subjects.some((subject) => subject.id === subjectId && subject.name === topic.subjectName)), [topics, subjects, subjectId])
  const selectedTopic = visibleTopics.find((topic) => topic.id === topicId)
  const repeatedCount = mistakes.filter((mistake) => mistake.incorrect_count >= 2).length

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    void fetchStudentMistakes(20).then((records) => {
      if (active) setMistakes(records)
    }).catch(() => {
      if (!active) return
      setMistakes([])
      setError('We could not load your saved mistake history. Check your connection and try again.')
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [refresh])

  return (
    <section className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
      <div className="glass-card rounded-3xl p-6 sm:p-8">
        <div className="flex items-center gap-3"><Clock3 className="text-purple-200" aria-hidden="true" /><h2 className="text-2xl font-black">Quick revision</h2></div>
        <p className="mt-3 text-sm leading-6 text-white/55">Review approved topic outlines. Topic titles without published lesson text are not presented as complete revision notes.</p>
        <label className="mt-5 block text-sm font-semibold text-white/75">Select a subject
          <select className="field mt-2" value={subjectId} onChange={(event) => { setSubjectId(event.target.value); setTopicId('') }}>
            <option value="all">All selected subjects</option>
            {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
          </select>
        </label>
        {visibleTopics.length ? <ul className="mt-5 space-y-2">{visibleTopics.map((topic) => <li key={topic.id}><button type="button" aria-pressed={topic.id === topicId} onClick={() => setTopicId(topic.id)} className={'w-full rounded-xl border p-4 text-left hover:bg-white/5 ' + (topic.id === topicId ? 'border-purple-300/50 bg-purple-500/10' : 'border-white/10')}><span className="block text-xs text-purple-200/70">{topic.subjectName}</span><span className="mt-1 block font-semibold">{topic.name}</span></button></li>)}</ul>
          : <div className="mt-5 rounded-xl border border-dashed border-white/15 p-5"><p className="font-semibold">No published revision topics yet</p><p className="mt-2 text-sm text-white/50">Approved syllabus content must be published before topic-based revision is available.</p></div>}
        {selectedTopic && <article className="mt-5 rounded-2xl border border-purple-300/20 bg-purple-500/5 p-5"><BookOpen size={18} className="text-purple-200" aria-hidden="true" /><h3 className="mt-2 text-lg font-bold">{selectedTopic.name}</h3><p className="mt-2 text-sm leading-6 text-white/65">{selectedTopic.description || 'A reviewed lesson or revision note has not been published for this topic.'}</p>{selectedTopic.subtopics && selectedTopic.subtopics.length > 0 && <div className="mt-4"><h4 className="text-sm font-bold">Published subtopics</h4><ul className="mt-2 list-inside list-disc space-y-1 text-sm text-white/60">{selectedTopic.subtopics.map((part) => <li key={part.id}>{part.name}</li>)}</ul></div>}</article>}
      </div>
      <aside className="glass-card self-start rounded-3xl p-6 sm:p-8" aria-labelledby="revision-mistakes">
        <div className="flex items-center justify-between gap-3"><h2 id="revision-mistakes" className="text-xl font-black">Your mistake bank</h2><button type="button" disabled={loading} onClick={() => setRefresh((current) => current + 1)} aria-label="Refresh mistake history" className="rounded-lg border border-white/10 p-2 disabled:opacity-50"><RotateCcw size={17} aria-hidden="true"/></button></div>
        <p className="mt-3 text-sm leading-6 text-white/55">Your most frequently missed questions, summarized from up to 20 real saved records.</p>
        {loading && <p role="status" className="mt-5 flex items-center gap-2 text-sm text-white/65"><Loader2 size={16} className="animate-spin" aria-hidden="true"/>Loading your mistake history…</p>}
        {error && <div role="alert" className="mt-5 rounded-xl border border-red-400/20 p-4 text-sm text-red-100"><p>{error}</p><button type="button" className="mt-3 underline" onClick={() => setRefresh((current) => current + 1)}>Try again</button></div>}
        {!loading && !error && (mistakes.length ? <div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl border border-white/10 p-4"><p className="text-xs text-white/50">Questions missed</p><p className="mt-2 text-2xl font-black">{mistakes.length}{mistakes.length === 20 ? '+' : ''}</p></div><div className="rounded-xl border border-white/10 p-4"><p className="text-xs text-white/50">Missed repeatedly</p><p className="mt-2 text-2xl font-black">{repeatedCount}</p></div></div> : <p className="mt-5 rounded-xl border border-dashed border-white/15 p-4 text-sm leading-6 text-white/60">No saved incorrect-answer records are available yet. Your mistake history builds from real practice attempts.</p>)}
        {mistakes.length > 0 && !loading && !error && <p className="mt-4 text-xs leading-5 text-white/45">Mistake review uses your own saved question history. The server will include only questions that are still approved and published; it may find none.</p>}
        <div className="mt-5 flex flex-wrap gap-3">
          {mistakes.length > 0 && !loading && !error && <button type="button" onClick={onReviewMistakes} className="min-h-11 rounded-xl bg-purple-300 px-4 py-2 text-sm font-bold text-[#120b1c]">Practise missed questions</button>}
          {repeatedCount > 0 && !loading && !error && <button type="button" onClick={onReviewRepeated} className="min-h-11 rounded-xl border border-purple-300/35 px-4 py-2 text-sm font-bold text-purple-100">Practise repeated mistakes</button>}
          <button type="button" onClick={onStartPractice} className="min-h-11 rounded-xl border border-white/15 px-4 py-2 text-sm font-bold text-white">Start general practice</button>
        </div>
      </aside>
    </section>
  )
}
