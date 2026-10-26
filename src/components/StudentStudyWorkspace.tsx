import { useEffect, useMemo, useRef, useState } from 'react'
import StudentStudyPlan from './StudentStudyPlan'
import StudentAnalyticsMastery from './StudentAnalyticsMastery'
import { ArrowLeft, BookOpen, Brain, CalendarDays, CheckCircle2, Clock3, Layers3, ListChecks, Sparkles, Target, Trophy, Flame, AlertCircle } from 'lucide-react'
import { listStudentMistakes, type StudentQuestionMistake } from '../lib/practiceService'

type Subject = { id: string; name: string; code: string }
type Topic = { id: string; subject_id: string; name: string; description: string | null; subjectName: string; sort_order: number; subtopics?: Array<{ id: string; name: string; description: string | null }> }
export type StudentWorkspaceMode = 'learn' | 'practice' | 'revision' | 'flashcards' | 'progress' | 'plan'
type Props = {
  mode: StudentWorkspaceMode
  subjects: Subject[]
  topics: Topic[]
  onBack: () => void
  onStartCbt: (mode?: 'cbt' | 'practice', subjectId?: string, count?: number, duration?: number) => void
}

const modes: { id: StudentWorkspaceMode; label: string; icon: typeof BookOpen }[] = [
  { id: 'learn', label: 'Learn', icon: BookOpen },
  { id: 'practice', label: 'Practice', icon: Brain },
  { id: 'revision', label: 'Quick revision', icon: Clock3 },
  { id: 'flashcards', label: 'Flashcards', icon: Layers3 },
  { id: 'progress', label: 'Progress', icon: Trophy },
  { id: 'plan', label: 'Study plan', icon: CalendarDays },
]

type PracticeWorkspaceProps = {
  subjects: Subject[]
  topics: Topic[]
  practiceTab: 'standard' | 'weakness' | 'mistake' | 'speed'
  setPracticeTab: (tab: 'standard' | 'weakness' | 'mistake' | 'speed') => void
  practiceSubjectId: string
  setPracticeSubjectId: (id: string) => void
  practiceQuestionCount: number
  setPracticeQuestionCount: (count: number) => void
  mistakes: StudentQuestionMistake[]
  setMistakes: (rows: StudentQuestionMistake[]) => void
  mistakesLoading: boolean
  setMistakesLoading: (loading: boolean) => void
  mistakesError: string
  setMistakesError: (error: string) => void
  onStartCbt: Props['onStartCbt']
}

function PracticeWorkspace(props: PracticeWorkspaceProps) {
  const { subjects, topics, practiceTab, setPracticeTab, practiceSubjectId, setPracticeSubjectId, practiceQuestionCount, setPracticeQuestionCount, mistakes, setMistakes, mistakesLoading, setMistakesLoading, mistakesError, setMistakesError, onStartCbt } = props
  useEffect(() => {
    if (practiceTab !== 'mistake') return
    let active = true
    setMistakesLoading(true)
    setMistakesError('')
    listStudentMistakes(20).then((rows) => { if (active) setMistakes(rows) }).catch(() => { if (active) setMistakesError('We could not load your mistake history. Please retry.') }).finally(() => { if (active) setMistakesLoading(false) })
    return () => { active = false }
  }, [practiceTab, setMistakes, setMistakesError, setMistakesLoading])
  const chosenSubject = subjects.find((subject) => subject.id === practiceSubjectId)
  const scopedTopics = topics.filter((topic) => practiceSubjectId === 'all' || topic.subject_id === practiceSubjectId)
  const tabs = [
    { id: 'standard' as const, label: 'Practice session' },
    { id: 'weakness' as const, label: 'Topic & weakness' },
    { id: 'mistake' as const, label: 'Mistake bank' },
    { id: 'speed' as const, label: 'Speed drill' },
  ]
  return <section className="glass-card rounded-3xl p-6 sm:p-8">
    <div className="flex items-center gap-3"><Target className="text-purple-200"/><h2 className="text-2xl font-black">Practice with purpose</h2></div>
    <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">Choose a subject and session size. Sessions use reviewed questions and verified answers only; no sample questions or fake attempts are created.</p>
    <div className="mt-5 grid gap-4 sm:grid-cols-2">
      <label className="block text-sm text-white/60">Subject
        <select className="field mt-2" value={practiceSubjectId} onChange={(event) => setPracticeSubjectId(event.target.value)}>
          <option value="all">All selected subjects</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
        </select>
      </label>
      <label className="block text-sm text-white/60">Questions
        <select className="field mt-2" value={practiceQuestionCount} onChange={(event) => setPracticeQuestionCount(Number(event.target.value))}>
          <option value={10}>10 questions</option><option value={20}>20 questions</option><option value={40}>40 questions</option>
        </select>
      </label>
    </div>
    <div role="tablist" aria-label="Practice tools" className="mt-6 flex flex-wrap gap-2">
      {tabs.map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={practiceTab === tab.id} onClick={() => setPracticeTab(tab.id)} className={`rounded-xl border px-3 py-2 text-sm font-semibold ${practiceTab === tab.id ? 'border-purple-300/40 bg-purple-500/15 text-purple-100' : 'border-white/10 text-white/55'}`}>{tab.label}</button>)}
    </div>
    {practiceTab === 'standard' && <div className="mt-5 rounded-2xl border border-white/10 bg-white/[.025] p-5">
      <h3 className="font-bold">Standard practice</h3><p className="mt-2 text-sm leading-6 text-white/50">{chosenSubject ? `Practice questions from ${chosenSubject.name}.` : 'Practice questions across your selected subjects.'} Question availability is checked by the CBT service before a session starts.</p>
      <button type="button" onClick={() => onStartCbt('practice', chosenSubject?.id, practiceQuestionCount, practiceQuestionCount * 90)} className="mt-4 rounded-xl bg-white px-4 py-3 text-sm font-bold text-black">Start {practiceQuestionCount}-question practice</button>
    </div>}
    {practiceTab === 'weakness' && <div className="mt-5 space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><h3 className="font-bold">Topic & weakness focus</h3><p className="mt-2 text-sm leading-6 text-white/50">Choose a subject area to practise. The current CBT service filters by subject; it does not yet restrict a session to a single topic, so topic cards below are study guidance rather than a guarantee of topic-only questions.</p></div>
      {scopedTopics.length ? <ul className="grid gap-2 sm:grid-cols-2">{scopedTopics.map((topic) => <li key={topic.id} className="rounded-xl border border-white/10 bg-black/20 p-4"><p className="text-xs text-purple-200/70">{topic.subjectName}</p><p className="mt-1 font-semibold">{topic.name}</p><button type="button" onClick={() => onStartCbt('practice', topic.subject_id, 10, 900)} className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold">Start 10-question subject drill</button></li>)}</ul> : <p className="rounded-xl border border-dashed border-white/15 p-5 text-sm text-white/50">No approved topics are available for this selection yet.</p>}
    </div>}
    {practiceTab === 'mistake' && <div className="mt-5 rounded-2xl border border-white/10 bg-white/[.025] p-5">
      <div className="flex items-center gap-2"><AlertCircle size={18} className="text-purple-200"/><h3 className="font-bold">Personal mistake bank</h3></div>
      {mistakesLoading ? <p role="status" className="mt-3 text-sm text-white/50">Loading saved mistake history…</p> : mistakesError ? <div role="alert" className="mt-3 text-sm text-red-200">{mistakesError}<button type="button" onClick={() => setPracticeTab('standard')} className="ml-2 underline">Return to practice</button></div> : mistakes.length ? <><p className="mt-2 text-sm text-white/50">{mistakes.length} questions have saved incorrect answers. This list is based on account history.</p><ul className="mt-4 space-y-2">{mistakes.map((mistake) => <li key={mistake.question_id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 p-3"><div><p className="text-sm">Question reference <span className="font-mono text-white/50">{mistake.question_id.slice(0, 8)}…</span></p><p className="mt-1 text-xs text-white/45">Incorrect {mistake.incorrect_count} time{mistake.incorrect_count === 1 ? '' : 's'}</p></div><button type="button" onClick={() => onStartCbt('practice', chosenSubject?.id, 10, 900)} className="rounded-lg bg-purple-300 px-3 py-2 text-xs font-bold text-black">Start practice</button></li>)}</ul><p className="mt-3 text-xs text-white/40">The current CBT API does not yet target exact saved question IDs, so this starts a new practice session rather than promising those exact questions.</p></> : <p className="mt-3 text-sm text-white/50">No saved mistakes yet. Complete a practice session to build your history.</p>}
    </div>}
    {practiceTab === 'speed' && <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/[.04] p-5">
      <div className="flex items-center gap-2"><Flame className="text-amber-300"/><h3 className="font-bold">Speed & pacing drill</h3></div><p className="mt-2 text-sm leading-6 text-white/50">A short timed session for practising decisions under time pressure. It uses the same reviewed-question pool as standard practice.</p><p className="mt-3 text-xs text-amber-200/80">10 questions · 7 minutes</p><button type="button" onClick={() => onStartCbt('practice', chosenSubject?.id, 10, 420)} className="mt-4 rounded-xl bg-amber-300 px-4 py-3 text-sm font-bold text-black">Launch speed drill</button>
    </div>}
    <div className="mt-6 rounded-2xl border border-amber-300/15 bg-amber-300/[.05] p-4"><p className="font-semibold">Question availability</p><p className="mt-2 text-sm leading-6 text-white/50">If reviewed questions are not published for your selected subjects, ACE will explain that no session is available rather than inventing questions or recording a fake attempt.</p></div>
  </section>
}

export default function StudentStudyWorkspace({ mode, subjects, topics, onBack, onStartCbt }: Props) {
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [selectedTopicId, setSelectedTopicId] = useState('')
  const [practiceTab, setPracticeTab] = useState<'standard' | 'weakness' | 'mistake' | 'speed'>('standard')
  const [practiceSubjectId, setPracticeSubjectId] = useState('all')
  const [practiceQuestionCount, setPracticeQuestionCount] = useState(20)
  const [mistakes, setMistakes] = useState<StudentQuestionMistake[]>([])
  const [mistakesLoading, setMistakesLoading] = useState(false)
  const [mistakesError, setMistakesError] = useState('')
  const selectedTopic = topics.find((topic) => topic.id === selectedTopicId) ?? null
  const visibleTopics = useMemo(
    () => topics.filter((topic) => subjectFilter === 'all' || topic.subject_id === subjectFilter),
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

        {mode === 'practice' && <PracticeWorkspace
          subjects={subjects}
          topics={topics}
          practiceTab={practiceTab}
          setPracticeTab={setPracticeTab}
          practiceSubjectId={practiceSubjectId}
          setPracticeSubjectId={setPracticeSubjectId}
          practiceQuestionCount={practiceQuestionCount}
          setPracticeQuestionCount={setPracticeQuestionCount}
          mistakes={mistakes}
          setMistakes={setMistakes}
          mistakesLoading={mistakesLoading}
          setMistakesLoading={setMistakesLoading}
          mistakesError={mistakesError}
          setMistakesError={setMistakesError}
          onStartCbt={onStartCbt}
        />}

        {mode === 'revision' && <section className="glass-card rounded-3xl p-6 sm:p-8"><div className="flex items-center gap-3"><Clock3 className="text-purple-200"/><h2 className="text-2xl font-black">Quick revision</h2></div><p className="mt-3 text-sm leading-6 text-white/50">A compact list of approved topics for your final review. Topic names alone are not a substitute for published revision notes.</p>{visibleTopics.length ? <div className="mt-6 grid gap-3 sm:grid-cols-2">{visibleTopics.map((topic) => <article key={topic.id} className="rounded-2xl border border-white/10 p-4"><p className="text-xs text-purple-200/70">{topic.subjectName}</p><h3 className="mt-2 font-bold">{topic.name}</h3><p className="mt-2 text-sm text-white/45">{topic.description || 'Revision notes have not been published for this topic yet.'}</p></article>)}</div> : <div className="mt-6 rounded-2xl border border-dashed border-white/15 p-6"><p className="font-semibold">Revision materials are not published yet</p><p className="mt-2 text-sm leading-6 text-white/45">Once reviewed topic content is published, it will be available here.</p></div>}</section>}

        {mode === 'flashcards' && <section className="glass-card rounded-3xl p-6 sm:p-8"><div className="flex items-center gap-3"><Layers3 className="text-purple-200"/><h2 className="text-2xl font-black">Flashcards</h2></div><p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">Flashcards will be built from reviewed definitions, formulas and facts, with progress tracked against your account.</p><div className="mt-6 rounded-2xl border border-dashed border-white/15 p-8 text-center"><Layers3 className="mx-auto text-white/35" size={30}/><h3 className="mt-4 text-lg font-bold">No verified flashcard deck yet</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/45">We will not turn topic titles into made-up study facts. Approved learning content is needed before a deck can be created.</p></div></section>}

        {mode === 'progress' && <StudentAnalyticsMastery subjects={subjects} topics={topics} onStartCbt={onStartCbt} />}

        {mode === 'plan' && <StudentStudyPlan subjects={subjects} />}
        </div>
      </div>
    </main>
  )
}
