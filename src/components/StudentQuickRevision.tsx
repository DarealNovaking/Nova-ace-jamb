import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Clock3, Loader2, RotateCcw } from 'lucide-react'
import { fetchStudentMistakes } from '../lib/practiceService'
import type { StudentQuestionMistake } from '../lib/progressSummary'

type Subject = { id: string; name: string; code: string }
type Topic = { id: string; name: string; description: string | null; subjectName: string; sort_order: number; subtopics?: Array<{ id: string; name: string; description: string | null }> }

export default function StudentQuickRevision({ subjects, topics, onStartPractice, onReviewMistakes, onReviewRepeated, onStartTopicPractice, onStartSubtopicPractice }: { subjects: Subject[]; topics: Topic[]; onStartPractice: () => void; onReviewMistakes: () => void; onReviewRepeated: () => void; onStartTopicPractice: (subjectId: string, topicId: string) => void; onStartSubtopicPractice: (subjectId: string, topicId: string, subtopicId: string) => void }) {
  const [subjectId, setSubjectId] = useState('all')
  const [topicId, setTopicId] = useState('')
  const [subtopicId, setSubtopicId] = useState('')
  const [search, setSearch] = useState('')
  const [mistakes, setMistakes] = useState<StudentQuestionMistake[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)

  const normalizedSearch = search.trim().toLocaleLowerCase()
  const visibleTopics = useMemo(() => topics.filter((topic) =>
    (subjectId === 'all' || subjects.some((subject) => subject.id === subjectId && subject.name === topic.subjectName)) &&
    (!normalizedSearch || [topic.name, topic.description ?? '', ...(topic.subtopics ?? []).flatMap((part) => [part.name, part.description ?? ''])].some((item) => item.toLocaleLowerCase().includes(normalizedSearch)))
  ), [topics, subjects, subjectId, normalizedSearch])
  const selectedTopic = visibleTopics.find((topic) => topic.id === topicId)
  const selectedSubtopic = selectedTopic?.subtopics?.find((part) => part.id === subtopicId)
  const selectedSubjectId = subjects.find((item) => item.name === selectedTopic?.subjectName)?.id
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
          <select className="field mt-2" value={subjectId} onChange={(event) => { setSubjectId(event.target.value); setTopicId(''); setSubtopicId('') }}>
            <option value="all">All selected subjects</option>
            {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
          </select>
        </label>
        <label className="mt-4 block text-sm font-semibold text-white/75">Search revision outlines
          <input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setTopicId(''); setSubtopicId('') }} placeholder="Topic or subtopic name" className="field mt-2" />
        </label>
        <p role="status" className="mt-3 text-xs text-white/50">{visibleTopics.length} approved revision topic{visibleTopics.length === 1 ? '' : 's'} found</p>
        {visibleTopics.length ? <ul className="mt-5 max-h-[30rem] space-y-2 overflow-y-auto pr-1">{visibleTopics.map((topic) => <li key={topic.id}><button type="button" aria-pressed={topic.id === topicId} onClick={() => { setTopicId(topic.id); setSubtopicId('') }} className={'w-full rounded-xl border p-4 text-left hover:bg-white/5 ' + (topic.id === topicId ? 'border-purple-300/50 bg-purple-500/10' : 'border-white/10')}><span className="block text-xs text-purple-200/70">{topic.subjectName}</span><span className="mt-1 block font-semibold">{topic.name}</span></button></li>)}</ul>
          : <div className="mt-5 rounded-xl border border-dashed border-white/15 p-5"><p className="font-semibold">{topics.length ? 'No revision topics match your search' : 'No published revision topics yet'}</p><p className="mt-2 text-sm text-white/50">{topics.length ? 'Change your subject or search to find an approved outline.' : 'Approved syllabus content must be published before topic-based revision is available.'}</p>{topics.length > 0 && <button type="button" onClick={() => { setSubjectId('all'); setSearch('') }} className="mt-3 min-h-11 rounded-xl border border-white/20 px-3 py-2 text-sm font-semibold">Clear revision filters</button>}</div>}
        {selectedTopic && <article className="mt-5 rounded-2xl border border-purple-300/20 bg-purple-500/5 p-5">
          <BookOpen size={18} className="text-purple-200" aria-hidden="true"/>
          <h3 className="mt-2 text-lg font-bold">{selectedTopic.name}</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/65">{selectedTopic.description || 'A reviewed lesson or revision note has not been published for this topic.'}</p>
          {selectedSubjectId && <button type="button" className="mt-4 min-h-11 rounded-xl border border-purple-300/35 px-4 py-2 text-sm font-semibold text-purple-100" onClick={() => onStartTopicPractice(selectedSubjectId, selectedTopic.id)}>Practise selected revision topic</button>}
          {selectedTopic.subtopics && selectedTopic.subtopics.length > 0 && <section className="mt-5">
            <h4 className="text-sm font-bold">Approved subtopics</h4>
            <ul className="mt-3 space-y-2">{selectedTopic.subtopics.map((part) => <li key={part.id}><button type="button" aria-pressed={subtopicId === part.id} onClick={() => setSubtopicId(part.id)} className={`w-full min-h-11 rounded-lg border p-3 text-left text-sm ${subtopicId === part.id ? 'border-purple-300/40 bg-purple-500/10' : 'border-white/10'}`}>{part.name}</button></li>)}</ul>
            {selectedSubtopic && <div className="mt-4 rounded-xl border border-white/10 p-4">
              <h5 className="font-semibold">{selectedSubtopic.name}</h5>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/55">{selectedSubtopic.description || 'An approved subtopic description is not published yet.'}</p>
              {selectedSubjectId && <button type="button" onClick={() => onStartSubtopicPractice(selectedSubjectId, selectedTopic.id, selectedSubtopic.id)} className="mt-3 min-h-11 rounded-xl bg-purple-300 px-4 py-2 text-sm font-semibold text-[#120b1c]">Practise selected revision subtopic</button>}
            </div>}
          </section>}
        </article>}
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
