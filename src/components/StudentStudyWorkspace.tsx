import { useEffect, useMemo, useRef, useState } from 'react'
import StudentStudyPlan from './StudentStudyPlan'
import StudentProgressSummary from './StudentProgressSummary'
import StudentFlashcards from './StudentFlashcards'
import StudentQuickRevision from './StudentQuickRevision'
import { ArrowLeft, BookOpen, Brain, CalendarDays, CheckCircle2, Clock3, Layers3, ListChecks, Sparkles, Target, Trophy } from 'lucide-react'

type Subject = { id: string; name: string; code: string }
type Topic = { id: string; name: string; description: string | null; subjectName: string; sort_order: number; subtopics?: Array<{ id: string; name: string; description: string | null }> }
export type StudentWorkspaceMode = 'learn' | 'practice' | 'revision' | 'flashcards' | 'progress' | 'plan'
type Props = {
  mode: StudentWorkspaceMode
  subjects: Subject[]
  topics: Topic[]
  onBack: () => void
  onStartCbt: (mode?: 'cbt' | 'practice') => void
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
  const [selectedTopicId, setSelectedTopicId] = useState('')
  const selectedTopic = topics.find((topic) => topic.id === selectedTopicId) ?? null
  const visibleTopics = useMemo(
    () => topics.filter((topic) => subjectFilter === 'all' || subjects.find((subject) => subject.name === topic.subjectName)?.id === subjectFilter),
    [topics, subjects, subjectFilter],
  )
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
            <div className="flex items-center gap-3"><BookOpen className="text-purple-200"/><h2 className="text-xl font-black">Verified topics</h2></div>
            <label className="mt-5 block text-sm text-white/60">Filter by subject<select className="field mt-2" value={subjectFilter} onChange={(e) => { setSubjectFilter(e.target.value); setSelectedTopicId('') }}><option value="all">All selected subjects</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></label>
            <div className="mt-4 space-y-2">{visibleTopics.map((topic) => <button key={topic.id} type="button" aria-pressed={selectedTopicId === topic.id} onClick={() => setSelectedTopicId(topic.id)} className={`w-full rounded-xl border p-4 text-left ${selectedTopicId === topic.id ? 'border-purple-300/40 bg-purple-500/10' : 'border-white/5 bg-white/[.025] hover:bg-white/[.05]'}`}><span className="block text-xs text-purple-200/70">{topic.subjectName}</span><span className="mt-1 block font-semibold">{topic.name}</span></button>)}</div>
            {!visibleTopics.length && <div className="mt-4 rounded-2xl border border-dashed border-white/15 p-5"><p className="font-semibold">No approved topics available yet</p><p className="mt-2 text-sm leading-6 text-white/45">The academic team must publish source-verified syllabus content before lessons appear here.</p></div>}
          </div>
          <div className="glass-card min-h-72 rounded-3xl p-5 sm:p-7">
            {selectedTopic ? <><p className="text-xs uppercase tracking-[.2em] text-purple-200/70">{selectedTopic.subjectName}</p><h2 className="mt-3 text-2xl font-black">{selectedTopic.name}</h2>{selectedTopic.description && <p className="mt-4 leading-7 text-white/65">{selectedTopic.description}</p>}{selectedTopic.subtopics && selectedTopic.subtopics.length > 0 && <section className="mt-6"><h3 className="font-bold">Subtopics</h3><ul className="mt-3 space-y-2">{selectedTopic.subtopics.map((subtopic) => <li key={subtopic.id} className="rounded-xl border border-white/10 bg-white/[.025] p-3"><p className="font-semibold">{subtopic.name}</p>{subtopic.description && <p className="mt-1 text-sm leading-5 text-white/45">{subtopic.description}</p>}</li>)}</ul></section>}<div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5"><div className="flex items-center gap-2 font-semibold"><BookOpen size={18} className="text-purple-200"/> Lesson content</div><p className="mt-3 text-sm leading-6 text-white/50">This syllabus topic is available, but a reviewed lesson and linked questions are not yet published. This page will show the lesson when approved content is connected.</p></div></> : <div className="grid min-h-64 place-items-center text-center"><div><Sparkles className="mx-auto text-purple-200" size={28}/><h2 className="mt-4 text-xl font-bold">Choose a topic to begin</h2><p className="mt-2 max-w-sm text-sm leading-6 text-white/45">Your selected subjects and approved syllabus topics will guide your learning.</p></div></div>}
          </div>
        </section>}

        {mode === 'practice' && <section className="glass-card rounded-3xl p-6 sm:p-8"><div className="flex items-center gap-3"><Target className="text-purple-200"/><h2 className="text-2xl font-black">Practice with purpose</h2></div><p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">Practice sessions require reviewed questions with verified answers. We will not generate fake questions or claim an empty question bank is ready.</p><div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{['Topic practice','Weakness practice','Mistake review'].map((label) => <div key={label} className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><ListChecks className="text-purple-200"/><h3 className="mt-3 font-bold">{label}</h3><p className="mt-2 text-sm leading-6 text-white/45">Available when the required reviewed question and attempt data is published.</p></div>)}</div><div className="mt-6 rounded-2xl border border-amber-300/15 bg-amber-300/[.05] p-5"><p className="font-semibold">Question availability</p><p className="mt-2 text-sm leading-6 text-white/50">Question availability is checked when you start a session. If approved questions are not published for your selected subjects, ACE will tell you instead of inventing questions or recording a fake attempt.</p><button type="button" onClick={() => onStartCbt('practice')} className="mt-4 rounded-xl bg-white px-4 py-3 text-sm font-bold text-black">Start a practice session</button></div></section>}

        {mode === 'revision' && <StudentQuickRevision subjects={subjects} topics={topics} onStartPractice={() => onStartCbt('practice')} />}

        {mode === 'flashcards' && <StudentFlashcards subjects={subjects} topics={topics} />}

        {mode === 'progress' && <StudentProgressSummary subjects={subjects} topicCount={topics.length} onStartCbt={onStartCbt} />}

        {mode === 'plan' && <StudentStudyPlan subjects={subjects} />}
        </div>

      </div>
    </main>
  )
}
