import { useEffect, useState } from 'react'
import { BookOpen, Brain, ChevronRight, Clock3, GraduationCap, Loader2, RefreshCw, CalendarDays, Layers3, Trophy } from 'lucide-react'
import StudentStudyWorkspace, { type StudentWorkspaceMode } from './StudentStudyWorkspace'
import { getStudentProfile, getStudentSubjects } from '../lib/studentService'
import { ace } from '../lib/supabase'
import { getActiveExamBlueprint, getSyllabusTree, listActiveSyllabusVersions, type SyllabusSubtopic, type SyllabusTopic } from '../lib/seasonService'

type Subject = { id: string; name: string; code: string }
type TopicRow = SyllabusTopic & { subjectName: string; subtopics: SyllabusSubtopic[] }

export default function StudentDashboard() {
  const [name, setName] = useState('')
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [topics, setTopics] = useState<TopicRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeView, setActiveView] = useState<StudentWorkspaceMode | 'home'>(() => {
    const requested = new URLSearchParams(window.location.search).get('view')
    return ['learn', 'practice', 'revision', 'flashcards', 'progress', 'plan'].includes(requested ?? '')
      ? requested as StudentWorkspaceMode
      : 'home'
  })

  async function loadDashboard() {
    setLoading(true)
    setError('')
    try {
      const [profile, selected] = await Promise.all([getStudentProfile(), getStudentSubjects()])
      setName(profile.display_name?.trim() || 'Student')

      const ids = selected.map((item) => item.subject_id)
      if (!ids.length) {
        setSubjects([])
        setTopics([])
        return
      }

      const { data: subjectRows, error: subjectError } = await ace
        .from('subjects')
        .select('id,name,code')
        .in('id', ids)
        .eq('active', true)
      if (subjectError) throw subjectError

      const orderedSubjects = (subjectRows ?? []) as Subject[]
      setSubjects(orderedSubjects)

      const blueprint = await getActiveExamBlueprint()
      const seasonId = blueprint?.season?.id
      if (!seasonId) {
        setTopics([])
        return
      }

      const versions = await listActiveSyllabusVersions(seasonId)
      const relevantVersions = versions.filter((version) => ids.includes(version.subject_id) && version.rights_status === 'approved')
      const trees = await Promise.all(relevantVersions.map(async (version) => {
        const tree = await getSyllabusTree(version.id)
        const subjectName = orderedSubjects.find((subject) => subject.id === version.subject_id)?.name ?? 'Subject'
        return tree.topics.map((topic) => ({ ...topic, subjectName, subtopics: tree.subtopics.filter((subtopic) => subtopic.topic_id === topic.id) }))
      }))
      setTopics(trees.flat())
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load your preparation dashboard.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadDashboard() }, [])

  useEffect(() => {
    const validModes: StudentWorkspaceMode[] = ['learn', 'practice', 'revision', 'flashcards', 'progress', 'plan']
    const syncFromUrl = () => {
      const requested = new URLSearchParams(window.location.search).get('view')
      setActiveView(validModes.includes(requested as StudentWorkspaceMode) ? requested as StudentWorkspaceMode : 'home')
    }
    const navigate = (event: Event) => {
      const mode = (event as CustomEvent<StudentWorkspaceMode>).detail
      if (!validModes.includes(mode)) return
      const url = new URL(window.location.href)
      url.searchParams.set('view', mode)
      url.searchParams.delete('cbt')
      window.history.pushState({}, '', url)
      setActiveView(mode)
    }
    window.addEventListener('ace-workspace-navigate', navigate)
    window.addEventListener('popstate', syncFromUrl)
    return () => {
      window.removeEventListener('ace-workspace-navigate', navigate)
      window.removeEventListener('popstate', syncFromUrl)
    }
  }, [])

  const startCbt = (mode: 'cbt' | 'practice' = 'cbt') => {
    const url = new URL(window.location.href)
    url.searchParams.set('cbt', '1')
    url.searchParams.delete('view')
    if (mode === 'practice') url.searchParams.set('mode', 'practice')
    else url.searchParams.delete('mode')
    window.history.pushState({}, '', url)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  if (loading) return <main className="grid min-h-[70vh] place-items-center text-white"><div className="text-center"><Loader2 className="mx-auto animate-spin" /><p className="mt-3 text-sm text-white/50">Loading your preparation dashboard…</p></div></main>

  if (activeView !== 'home') return <StudentStudyWorkspace mode={activeView} subjects={subjects} topics={topics} onBack={() => { const url = new URL(window.location.href); url.searchParams.delete('view'); window.history.pushState({}, '', url); setActiveView('home') }} onStartCbt={startCbt} />

  return (
    <main className="min-h-screen bg-[#07050d] px-5 py-8 text-white sm:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[.22em] text-purple-300/70">ÑØVÃ · ACE JAMB</p>
            <h1 className="mt-3 text-3xl font-black sm:text-5xl">Welcome back, {name}.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">Your preparation space. Learn from verified syllabus content when available, and practise through saved CBT sessions.</p>
          </div>
          <button type="button" onClick={() => void loadDashboard()} className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/5"><RefreshCw size={16}/> Refresh</button>
        </header>


        <nav aria-label="Preparation tools" className="mb-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { id: 'learn' as const, label: 'Learn', detail: 'Approved syllabus topics', icon: BookOpen },
            { id: 'practice' as const, label: 'Practice', detail: 'Verified question sets', icon: Brain },
            { id: 'revision' as const, label: 'Quick revision', detail: 'Review approved topics', icon: Clock3 },
            { id: 'flashcards' as const, label: 'Flashcards', detail: 'Recall and review', icon: Layers3 },
            { id: 'progress' as const, label: 'My progress', detail: 'Saved attempt results', icon: Trophy },
            { id: 'plan' as const, label: 'Study plan', detail: 'A repeatable routine', icon: CalendarDays },
          ].map((item) => { const ItemIcon = item.icon; return <button key={item.id} type="button" onClick={() => window.dispatchEvent(new CustomEvent('ace-workspace-navigate', { detail: item.id }))} className="glass-card rounded-2xl p-4 text-left transition hover:border-purple-300/30"><ItemIcon size={19} className="text-purple-200"/><span className="mt-3 block text-sm font-bold">{item.label}</span><span className="mt-1 block text-xs leading-5 text-white/40">{item.detail}</span></button> })}
        </nav>
        {error && <section role="alert" className="mb-6 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100"><p>{error}</p><button type="button" onClick={() => void loadDashboard()} className="mt-3 underline">Try again</button></section>}

        <section className="grid gap-4 md:grid-cols-2">
          <button type="button" onClick={() => startCbt('cbt')} className="glass-card group rounded-3xl p-6 text-left transition hover:border-purple-300/30 hover:bg-white/[.06] sm:p-8">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-purple-500/15 text-purple-200"><Brain size={24}/></span>
            <h2 className="mt-5 text-2xl font-black">CBT Practice</h2>
            <p className="mt-2 text-sm leading-6 text-white/50">Start a secure, timed session. Your answers and progress are saved to your account.</p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-purple-200">Start practice <ChevronRight size={16}/></span>
          </button>
          <section className="glass-card rounded-3xl p-6 sm:p-8">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/5 text-white/70"><BookOpen size={24}/></span>
            <h2 className="mt-5 text-2xl font-black">Learning</h2>
            <p className="mt-2 text-sm leading-6 text-white/50">Explore active, approved syllabus topics for your selected subjects.</p>
            <p className="mt-5 text-sm font-semibold text-white/70">{topics.length} approved topic{topics.length === 1 ? '' : 's'} available</p>
          </section>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
          <div className="glass-card rounded-3xl p-6">
            <div className="flex items-center gap-3"><GraduationCap className="text-purple-200"/><h2 className="text-xl font-black">My subjects</h2></div>
            {subjects.length ? <ul className="mt-5 space-y-3">{subjects.map((subject) => <li key={subject.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[.03] p-3"><span className="text-sm font-semibold">{subject.name}</span><span className="text-xs text-white/35">{subject.code}</span></li>)}</ul> : <p className="mt-4 text-sm leading-6 text-white/50">No saved subjects were found. Refresh or revisit your preparation profile.</p>}
          </div>
          <div className="glass-card rounded-3xl p-6">
            <div className="flex items-center gap-3"><Clock3 className="text-purple-200"/><h2 className="text-xl font-black">Syllabus topics</h2></div>
            {topics.length ? <ul className="mt-5 grid gap-3 sm:grid-cols-2">{topics.map((topic) => <li key={topic.id} className="rounded-xl border border-white/5 bg-white/[.03] p-4"><p className="text-xs text-purple-200/70">{topic.subjectName}</p><p className="mt-2 font-semibold">{topic.name}</p>{topic.description && <p className="mt-2 text-sm leading-5 text-white/45">{topic.description}</p>}</li>)}</ul> : <div className="mt-4 rounded-2xl border border-white/5 bg-white/[.025] p-5"><p className="font-semibold">Verified learning content is not published yet.</p><p className="mt-2 text-sm leading-6 text-white/45">Your account and preparation profile remain available. Topics will appear here when an active season and approved syllabus content are published. No syllabus topics are invented for this screen.</p></div>}
          </div>
        </section>
      </div>
    </main>
  )
}
