import { useEffect, useMemo, useRef, useState } from 'react'
import StudentStudyPlan from './StudentStudyPlan'
import StudentProgressSummary from './StudentProgressSummary'
import StudentFlashcards from './StudentFlashcards'
import StudentQuickRevision from './StudentQuickRevision'
import { ArrowLeft, BookOpen, Brain, CalendarDays, CheckCircle2, Clock3, Layers3, ListChecks, Sparkles, Target, Trophy } from 'lucide-react'

type Subject = { id: string; name: string; code: string }
type Topic = { id: string; subject_id?: string; name: string; description: string | null; subjectName: string; sort_order: number; subtopics?: Array<{ id: string; name: string; description: string | null }> }
export type StudentWorkspaceMode = 'learn' | 'practice' | 'revision' | 'flashcards' | 'progress' | 'plan'
type Props = {
  mode: StudentWorkspaceMode
  subjects: Subject[]
  topics: Topic[]
  onBack: () => void
  onStartCbt: (mode?: 'cbt' | 'practice', focus?: 'mistakes' | 'repeated' | 'speed' | 'subject' | 'topic' | 'subtopic', subjectId?: string, topicId?: string, subtopicId?: string) => void
}

const modes: { id: StudentWorkspaceMode; label: string; icon: typeof BookOpen }[] = [
  { id: 'learn', label: 'Learn', icon: BookOpen },
  { id: 'practice', label: 'Practice', icon: Brain },
  { id: 'revision', label: 'Quick revision', icon: Clock3 },
  { id: 'flashcards', label: 'Flashcards', icon: Layers3 },
  { id: 'progress', label: 'Progress', icon: Trophy },
  { id: 'plan', label: 'Study plan', icon: CalendarDays },
]

export default function StudentStudyWorkspace({ mode, subjects, topics, onBack, onStartCbt }: Props) {
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [practiceSubjectId, setPracticeSubjectId] = useState(subjects[0]?.id ?? '')
  const selectedPracticeSubjectId = subjects.some((item) => item.id === practiceSubjectId) ? practiceSubjectId : subjects[0]?.id ?? ''
  const [selectedTopicId, setSelectedTopicId] = useState('')
  const [selectedSubtopicId, setSelectedSubtopicId] = useState('')
  const [topicSearch, setTopicSearch] = useState('')
  const [practiceTopicId, setPracticeTopicId] = useState('')
  const [practiceSubtopicId, setPracticeSubtopicId] = useState('')
  const practiceTopics = useMemo(() => topics.filter((topic) => topic.subject_id ? topic.subject_id === selectedPracticeSubjectId : topic.subjectName === subjects.find((subject) => subject.id === selectedPracticeSubjectId)?.name), [topics, subjects, selectedPracticeSubjectId])
  const practiceTopic = practiceTopics.find((topic) => topic.id === practiceTopicId)
  const practiceSubtopics = practiceTopic?.subtopics ?? []
  const normalizedSearch = topicSearch.trim().toLocaleLowerCase()
  const visibleTopics = useMemo(
    () => topics.filter((topic) => {
      const subjectMatches = subjectFilter === 'all' || topic.subject_id === subjectFilter ||
        (!topic.subject_id && subjects.some((subject) => subject.id === subjectFilter && subject.name === topic.subjectName))
      return subjectMatches && (!normalizedSearch || [topic.name, topic.description ?? '', topic.subjectName,
        ...(topic.subtopics ?? []).flatMap((part) => [part.name, part.description ?? ''])]
        .some((value) => value.toLocaleLowerCase().includes(normalizedSearch)))
    }),
    [topics, subjects, subjectFilter, normalizedSearch],
  )
  const selectedTopic = visibleTopics.find((topic) => topic.id === selectedTopicId) ?? null
  const selectedSubtopic = selectedTopic?.subtopics?.find((part) => part.id === selectedSubtopicId) ?? null
  const activeMode = modes.find((item) => item.id === mode) ?? modes[0]
  const Icon = activeMode.icon
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [mode])

  return (
    <main className="min-h-screen bg-[#07050d] px-4 py-6 text-white sm:px-6 sm:py-10">
      <a className="skip-link" href="#workspace-content">Skip to workspace content</a>
      <div className="mx-auto max-w-6xl">
        <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button type="button" onClick={onBack} className="mb-4 inline-flex items-center gap-2 text-sm text-white/55 hover:text-white"><ArrowLeft size={16}/> Dashboard</button>
            <p className="text-xs uppercase tracking-[.22em] text-purple-300/70">ÑØVÃ · ACE JAMB</p>
            <h1 ref={headingRef} tabIndex={-1} className="mt-2 flex items-center gap-3 text-3xl font-black outline-none sm:text-4xl"><Icon aria-hidden="true" className="text-purple-200" size={30}/>{activeMode.label}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">Your preparation workspace uses your saved subjects and verified published content. Unpublished material is never presented as official syllabus content.</p>
          </div>
          <button type="button" onClick={() => onStartCbt('cbt')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-300 px-4 py-3 text-sm font-bold text-[#120b1c] hover:bg-purple-200"><Brain size={16}/> Open CBT</button>
        </header>

        <nav aria-label="Preparation tools" className="mb-7 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {modes.map((item) => {
            const ItemIcon = item.icon
            return <button key={item.id} type="button" aria-current={item.id === mode ? 'page' : undefined} onClick={() => { if (item.id !== mode) window.dispatchEvent(new CustomEvent('ace-workspace-navigate', { detail: item.id })) }} className={`flex min-h-12 items-center gap-2 rounded-xl border px-3 py-3 text-left text-xs font-semibold transition sm:text-sm ${item.id === mode ? 'border-purple-300/40 bg-purple-500/15 text-purple-100' : 'border-white/10 bg-white/[.025] text-white/60 hover:bg-white/[.06]'}`}><ItemIcon size={16}/>{item.label}</button>
          })}
        </nav>

        <div id="workspace-content" tabIndex={-1} className="outline-none">
        {mode === 'learn' && <section className="grid gap-5 lg:grid-cols-[.85fr_1.15fr]">
          <div className="glass-card rounded-3xl p-5 sm:p-6">
            <div className="flex items-center gap-3"><BookOpen className="text-purple-200" aria-hidden="true"/><h2 className="text-xl font-black">Verified topics</h2></div>
            <p className="mt-3 text-sm leading-6 text-white/50">Explore rights-approved syllabus outlines. An outline is not a complete lesson.</p>
            <label className="mt-5 block text-sm text-white/70">Filter by subject
              <select className="field mt-2" value={subjectFilter} onChange={(e) => { setSubjectFilter(e.target.value); setSelectedTopicId(''); setSelectedSubtopicId('') }}>
                <option value="all">All selected subjects</option>{subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
            <label className="mt-4 block text-sm text-white/70">Search approved topics or subtopics
              <input type="search" className="field mt-2" placeholder="Search by topic or subtopic" value={topicSearch} onChange={(e) => { setTopicSearch(e.target.value); setSelectedTopicId(''); setSelectedSubtopicId('') }} />
            </label>
            <p role="status" className="mt-4 text-xs text-white/50">{visibleTopics.length} approved topic{visibleTopics.length === 1 ? '' : 's'} found</p>
            {visibleTopics.length > 0 && <ul className="mt-4 max-h-[32rem] space-y-2 overflow-y-auto pr-1">{visibleTopics.map((topic) => <li key={topic.id}>
              <button type="button" aria-pressed={selectedTopicId === topic.id} onClick={() => { setSelectedTopicId(topic.id); setSelectedSubtopicId('') }} className={`w-full min-h-11 rounded-xl border p-4 text-left ${selectedTopicId === topic.id ? 'border-purple-300/40 bg-purple-500/10' : 'border-white/5 bg-white/[.025] hover:bg-white/[.05]'}`}>
                <span className="block text-xs text-purple-200/70">{topic.subjectName}</span><span className="mt-1 block font-semibold">{topic.name}</span><span className="mt-2 block text-xs text-white/45">{topic.subtopics?.length ?? 0} approved subtopics</span>
              </button>
            </li>)}</ul>}
            {!topics.length && <div className="mt-4 rounded-2xl border border-dashed border-white/15 p-5"><p className="font-semibold">No approved topics available yet</p><p className="mt-2 text-sm leading-6 text-white/45">The academic team must publish source-verified syllabus content before lessons appear here.</p></div>}
            {topics.length > 0 && !visibleTopics.length && <div className="mt-4 rounded-2xl border border-dashed border-white/15 p-5"><p className="font-semibold">No topics match your search</p><p className="mt-2 text-sm text-white/50">Try another approved topic or subject.</p><button type="button" className="mt-3 min-h-11 rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold" onClick={() => { setTopicSearch(''); setSubjectFilter('all') }}>Clear topic filters</button></div>}
          </div>
          <div className="glass-card min-h-72 rounded-3xl p-5 sm:p-7">
            {selectedTopic ? <>
              <p className="text-xs uppercase tracking-[.2em] text-purple-200/70">{selectedTopic.subjectName} · Approved syllabus outline</p>
              <h2 className="mt-3 text-2xl font-black">{selectedTopic.name}</h2>
              <p className="mt-4 whitespace-pre-wrap leading-7 text-white/65">{selectedTopic.description || 'No approved topic description is published yet.'}</p>
              <button type="button" onClick={() => {
                const s = subjects.find((s) => s.id === selectedTopic.subject_id || s.name === selectedTopic.subjectName)
                if (s) onStartCbt('practice', 'topic', s.id, selectedTopic.id)
              }} className="mt-5 min-h-11 rounded-xl border border-purple-300/40 px-4 py-2 text-sm font-semibold text-purple-100">Practise this topic</button>
              {selectedTopic.subtopics && selectedTopic.subtopics.length > 0 && <section aria-labelledby="approved-subtopics-heading" className="mt-6">
                <h3 id="approved-subtopics-heading" className="font-bold">Approved subtopics</h3>
                <p className="mt-2 text-xs text-white/45">Choose a subtopic to view its published outline and practise its own reviewed questions.</p>
                <ul className="mt-3 space-y-2">{selectedTopic.subtopics.map((part) => <li key={part.id}>
                  <button type="button" aria-pressed={part.id === selectedSubtopicId} onClick={() => setSelectedSubtopicId(part.id)} className={`w-full min-h-11 rounded-xl border p-3 text-left ${part.id === selectedSubtopicId ? 'border-purple-300/40 bg-purple-500/10' : 'border-white/10 bg-white/[.025]'}`}>{part.name}</button>
                </li>)}</ul>
                {selectedSubtopic && <article className="mt-4 rounded-2xl border border-purple-300/20 bg-purple-500/[.06] p-4">
                  <h4 className="font-bold">{selectedSubtopic.name}</h4>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/60">{selectedSubtopic.description || 'No approved subtopic description is published yet.'}</p>
                  <button type="button" className="mt-4 min-h-11 rounded-xl bg-purple-300 px-4 py-2 text-sm font-bold text-[#120b1c]" onClick={() => {
                    const s = subjects.find((s) => s.id === selectedTopic.subject_id || s.name === selectedTopic.subjectName)
                    if (s) onStartCbt('practice', 'subtopic', s.id, selectedTopic.id, selectedSubtopic.id)
                  }}>Practise this subtopic</button>
                </article>}
              </section>}
              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5"><div className="flex items-center gap-2 font-semibold"><BookOpen size={18} className="text-purple-200" aria-hidden="true"/> Lesson content</div><p className="mt-3 text-sm leading-6 text-white/50">This approved outline is not a full lesson. Reviewed lesson text and linked questions will appear when published; we never substitute unverified material.</p></div>
            </> : <div className="grid min-h-64 place-items-center text-center"><div><Sparkles className="mx-auto text-purple-200" size={28} aria-hidden="true"/><h2 className="mt-4 text-xl font-bold">Choose a topic to begin</h2><p className="mt-2 max-w-sm text-sm leading-6 text-white/45">Your selected subjects and approved syllabus topics will guide your learning.</p></div></div>}
          </div>
        </section>}

        {mode === 'practice' && <section className="glass-card rounded-3xl p-6 sm:p-8"><div className="flex items-center gap-3"><Target className="text-purple-200"/><h2 className="text-2xl font-black">Practice with purpose</h2></div><p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">Practice sessions require reviewed questions with verified answers. We will not generate fake questions or claim an empty question bank is ready.</p><div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[
            { title: 'Topic practice', detail: 'Choose an approved topic below.', action: 'Choose a topic', go: () => document.getElementById('topic-practice-heading')?.scrollIntoView() },
            { title: 'Observed weaknesses', detail: 'See review priorities backed by your real saved answers.', action: 'Review my progress', go: () => window.dispatchEvent(new CustomEvent('ace-workspace-navigate', { detail: 'progress' })) },
            { title: 'Missed questions', detail: 'Retry questions you actually missed in saved attempts.', action: 'Practise missed questions', go: () => onStartCbt('practice', 'mistakes') },
            { title: 'Repeated mistakes', detail: 'Focus on saved questions you missed more than once.', action: 'Practise repeated mistakes', go: () => onStartCbt('practice', 'repeated') },
          ].map((item) => <article key={item.title} className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><ListChecks className="text-purple-200" aria-hidden="true"/><h3 className="mt-3 font-bold">{item.title}</h3><p className="mt-2 text-sm leading-6 text-white/45">{item.detail}</p><button type="button" className="mt-4 min-h-11 rounded-xl border border-purple-300/30 px-3 py-2 text-sm font-semibold text-purple-100" onClick={item.go}>{item.action}</button></article>)}</div><div className="mt-6 rounded-2xl border border-amber-300/15 bg-amber-300/[.05] p-5"><p className="font-semibold">Question availability</p><p className="mt-2 text-sm leading-6 text-white/50">Question availability is checked when you start a session. If approved questions are not published for your selected subjects, ACE will tell you instead of inventing questions or recording a fake attempt.</p><div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={() => onStartCbt('practice')} className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-black">Start a practice session</button><button type="button" onClick={() => onStartCbt('practice', 'speed')} className="rounded-xl border border-white/20 px-4 py-3 text-sm font-bold text-white">Start speed practice · up to 10 questions in 10 minutes</button></div></div>
          <div className="mt-6 border-t border-white/10 pt-5">
            <h3 className="font-bold">Subject-specific practice</h3>
            <p className="mt-2 text-sm leading-6 text-white/50">Choose one of your saved subjects. Only currently published, reviewed questions for that subject can appear.</p>
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <label className="min-w-44 flex-1 text-sm font-semibold text-white/70">Practice subject
                <select className="field mt-2" value={selectedPracticeSubjectId} onChange={(event) => { setPracticeSubjectId(event.target.value); setPracticeTopicId(''); setPracticeSubtopicId('') }}><option value="" disabled>Select a saved subject</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select>
              </label>
              <button type="button" onClick={() => onStartCbt('practice', 'subject', selectedPracticeSubjectId)} disabled={!selectedPracticeSubjectId} className="min-h-11 rounded-xl border border-white/20 px-4 py-3 text-sm font-bold disabled:opacity-40">Start subject practice</button>
            </div>
          </div></section>}

        {mode === 'practice' && <section aria-labelledby="topic-practice-heading" className="glass-card mt-5 rounded-3xl p-6 sm:p-8">
          <div className="flex items-center gap-3"><ListChecks className="text-purple-200" aria-hidden="true"/><h2 id="topic-practice-heading" className="text-xl font-black">Topic and subtopic practice</h2></div>
          <p className="mt-3 text-sm leading-6 text-white/55">Choose an approved topic for your selected subject. Only its currently published, reviewed questions can be used. ACE never substitutes questions from another topic.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-white/75">Practice topic
              <select className="field mt-2" value={practiceTopic?.id ?? ''} disabled={!practiceTopics.length} onChange={(event) => { setPracticeTopicId(event.target.value); setPracticeSubtopicId('') }}>
                <option value="">Choose an approved topic</option>
                {practiceTopics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold text-white/75">Practice subtopic
              <select className="field mt-2" value={practiceSubtopicId} disabled={!practiceTopic || !practiceSubtopics.length} onChange={(event) => setPracticeSubtopicId(event.target.value)}>
                <option value="">Choose a published subtopic</option>
                {practiceSubtopics.map((part) => <option key={part.id} value={part.id}>{part.name}</option>)}
              </select>
            </label>
          </div>
          {!practiceTopics.length && <p className="mt-4 rounded-xl border border-dashed border-white/15 p-4 text-sm text-white/55">No approved syllabus topics are available for this subject yet.</p>}
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" disabled={!selectedPracticeSubjectId || !practiceTopic} onClick={() => onStartCbt('practice', 'topic', selectedPracticeSubjectId, practiceTopic?.id)} className="min-h-11 rounded-xl bg-purple-300 px-4 py-3 text-sm font-bold text-[#120b1c] disabled:cursor-not-allowed disabled:opacity-40">Start topic practice</button>
            <button type="button" disabled={!selectedPracticeSubjectId || !practiceTopic || !practiceSubtopicId} onClick={() => onStartCbt('practice', 'subtopic', selectedPracticeSubjectId, practiceTopic?.id, practiceSubtopicId)} className="min-h-11 rounded-xl border border-white/20 px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">Start subtopic practice</button>
          </div>
        </section>}

        {mode === 'revision' && <StudentQuickRevision subjects={subjects} topics={topics} onStartPractice={() => onStartCbt('practice')} onReviewMistakes={() => onStartCbt('practice', 'mistakes')} onReviewRepeated={() => onStartCbt('practice', 'repeated')} />}

        {mode === 'flashcards' && <StudentFlashcards subjects={subjects} topics={topics} />}

        {mode === 'progress' && <StudentProgressSummary subjects={subjects} topics={topics} topicCount={topics.length} onStartCbt={onStartCbt} />}

        {mode === 'plan' && <StudentStudyPlan subjects={subjects} topics={topics} onReviewSubtopic={(subjectId, topicId, subtopicId) => onStartCbt('practice', 'subtopic', subjectId, topicId, subtopicId)} />}
        </div>

      </div>
    </main>
  )
}
