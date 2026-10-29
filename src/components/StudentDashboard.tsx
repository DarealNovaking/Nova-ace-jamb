import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { BookOpen, Brain, ChevronRight, Clock3, GraduationCap, Loader2, RefreshCw, ArrowUpRight, CheckCircle2 } from 'lucide-react'
import DashboardShell from './DashboardShell'
import type { StudentWorkspaceMode } from './StudentStudyWorkspace'

const StudentStudyWorkspace = lazy(() => import('./StudentStudyWorkspace'))
import StudentNotifications from './StudentNotifications'
import StudentAccountAccess from './StudentAccountAccess'
import LearningSupportStatus from './LearningSupportStatus'
import StudentAccountSettings from './StudentAccountSettings'
import { getStudentProfile, getStudentSubjects } from '../lib/studentService'
import { ace } from '../lib/supabase'
import { studyIndexReference } from '../lib/studentSyllabus'
import { getActiveExamBlueprint, getSyllabusTree, listActiveSyllabusVersions, type SyllabusSubtopic, type SyllabusTopic } from '../lib/seasonService'

type Subject = { id: string; name: string; code: string }
type TopicRow = SyllabusTopic & { subjectName: string; subtopics: SyllabusSubtopic[] }

export default function StudentDashboard() {
  const [name, setName] = useState('')
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [topics, setTopics] = useState<TopicRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const loadSequence = useRef(0)
  const [activeView, setActiveView] = useState<StudentWorkspaceMode | 'home'>(() => {
    const requested = new URLSearchParams(window.location.search).get('view')
    return ['learn', 'practice', 'revision', 'flashcards', 'progress', 'plan'].includes(requested ?? '')
      ? requested as StudentWorkspaceMode
      : 'home'
  })
  const dashboardHeadingRef = useRef<HTMLHeadingElement>(null)
  const previousActiveView = useRef(activeView)

  async function loadDashboard() {
    const sequence = ++loadSequence.current
    setLoading(true)
    setError('')
    try {
      const [profile, selected] = await Promise.all([getStudentProfile(), getStudentSubjects()])
      if (sequence !== loadSequence.current) return
      setName(profile.display_name?.trim() || 'Student')

      const ids = selected.map((item) => item.subject_id)
      if (!ids.length) {
        if (sequence !== loadSequence.current) return
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
      if (sequence !== loadSequence.current) return
      setSubjects(orderedSubjects)

      const blueprint = await getActiveExamBlueprint()
      const seasonId = blueprint?.season?.id
      if (!seasonId) {
        if (sequence !== loadSequence.current) return
        setTopics([])
        return
      }

      const versions = await listActiveSyllabusVersions(seasonId)
      const relevantVersions = versions.filter((version) => ids.includes(version.subject_id) && version.rights_status === 'approved')
      const trees = await Promise.all(relevantVersions.map(async (version) => {
        const tree = await getSyllabusTree(version.id)
        const subjectName = orderedSubjects.find((subject) => subject.id === version.subject_id)?.name ?? 'Subject'
        return tree.topics.map((topic) => ({ ...topic, ...studyIndexReference(version), subjectName, subtopics: tree.subtopics.filter((subtopic) => subtopic.topic_id === topic.id) }))
      }))
      if (sequence !== loadSequence.current) return
      setTopics(trees.flat())
    } catch {
      if (sequence !== loadSequence.current) return
      // Keep provider/database details out of student-facing errors.
      setError('We could not load your preparation dashboard. Check your connection and try again.')
    } finally {
      if (sequence === loadSequence.current) setLoading(false)
    }
  }

  useEffect(() => { void loadDashboard() }, [])

  useEffect(() => {
    if (activeView === 'home' && previousActiveView.current !== 'home') dashboardHeadingRef.current?.focus()
    previousActiveView.current = activeView
  }, [activeView])

  useEffect(() => {
    if (loading || activeView !== 'home' || window.history.state?.restoreDashboardFocus !== true) return
    dashboardHeadingRef.current?.focus()
    const nextState = { ...(window.history.state ?? {}) }
    delete nextState.restoreDashboardFocus
    window.history.replaceState(nextState, '', window.location.href)
  }, [loading, activeView])

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

  const startCbt = (mode: 'cbt' | 'practice' = 'cbt', focus?: 'mistakes' | 'repeated' | 'speed' | 'subject' | 'topic' | 'subtopic', subjectId?: string, topicId?: string, subtopicId?: string) => {
    const url = new URL(window.location.href)
    url.searchParams.set('cbt', '1')
    url.searchParams.delete('view')
    if (mode === 'practice') url.searchParams.set('mode', 'practice')
    else url.searchParams.delete('mode')
    if (mode === 'practice' && focus) url.searchParams.set('focus', focus)
    else url.searchParams.delete('focus')
    if (mode === 'practice' && (focus === 'subject' || focus === 'topic' || focus === 'subtopic') && subjectId && subjects.some((subject) => subject.id === subjectId)) url.searchParams.set('subject', subjectId)
    else url.searchParams.delete('subject')
    const approvedTopic = topics.find((topic) => topic.id === topicId && topic.subject_id === subjectId)
    if (mode === 'practice' && (focus === 'topic' || focus === 'subtopic') && approvedTopic) url.searchParams.set('topic', approvedTopic.id)
    else url.searchParams.delete('topic')
    if (mode === 'practice' && focus === 'subtopic' && approvedTopic?.subtopics.some((part) => part.id === subtopicId)) url.searchParams.set('subtopic', subtopicId!)
    else url.searchParams.delete('subtopic')
    window.history.pushState({}, '', url)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  if (loading) return <main id="main-content" aria-busy="true" className="grid min-h-[70vh] place-items-center text-white"><div role="status" aria-live="polite" aria-atomic="true" className="text-center"><Loader2 aria-hidden="true" className="mx-auto animate-spin" /><p className="mt-3 text-sm text-white/50">Loading your preparation dashboard…</p></div></main>

  if (activeView !== 'home') return <Suspense fallback={<main id="workspace-content" aria-busy="true" className="grid min-h-[50vh] place-items-center bg-[#07050d] px-5 text-white"><p role="status" aria-live="polite" aria-atomic="true">Loading your study workspace…</p></main>}><StudentStudyWorkspace mode={activeView} subjects={subjects} topics={topics} onBack={() => { const url = new URL(window.location.href); url.searchParams.delete('view'); window.history.pushState({}, '', url); setActiveView('home') }} onStartCbt={startCbt} /></Suspense>

  return (
    <DashboardShell area="student" activeId="home" displayName={name} onStudentNavigate={(mode) => { if (mode !== 'home') window.dispatchEvent(new CustomEvent('ace-workspace-navigate', { detail: mode })) }}>
      <a className="skip-link" href="#dashboard-content">Skip to dashboard content</a>
      <main id="dashboard-content" tabIndex={-1} className="dashboard-content">
        <header className="dashboard-heading">
          <div><p className="dashboard-eyebrow">Let’s make progress</p><h1 ref={dashboardHeadingRef} tabIndex={-1} className="dashboard-title">Welcome back, {name}.</h1><p className="dashboard-description">Your subjects, your study space. Pick up where you want to begin.</p></div>
          <button type="button" onClick={() => void loadDashboard()} className="dashboard-button self-start"><RefreshCw size={15} aria-hidden="true" /> Refresh</button>
        </header>
        {error && <section role="alert" className="mb-6 rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100"><p>{error}</p><button type="button" onClick={() => void loadDashboard()} className="mt-3 min-h-11 underline">Try again</button></section>}

        <div className="dashboard-home-grid">
          <section className="dashboard-study-hero" aria-labelledby="study-session-title">
            <p className="dashboard-eyebrow">A little focus goes a long way</p>
            <h2 id="study-session-title">Make your next study session count.</h2>
            <p>Explore a topic or open a timed CBT session. Your saved work stays with your account.</p>
            <div className="flex flex-wrap gap-3"><button type="button" aria-label="CBT Practice — Start practice" onClick={() => startCbt('cbt')} className="dashboard-button dashboard-button--primary"><Brain size={17} aria-hidden="true" /> Start practice <ArrowUpRight size={16} aria-hidden="true" /></button><button type="button" onClick={() => window.dispatchEvent(new CustomEvent('ace-workspace-navigate', { detail: 'learn' }))} className="dashboard-button">Explore learning <ChevronRight size={15} aria-hidden="true" /></button></div>
            <div className="dashboard-hero-art" aria-hidden="true"><BookOpen size={55} strokeWidth={1.2} /></div>
          </section>
          <section className="dashboard-panel" aria-labelledby="learning-overview-title">
            <div className="dashboard-section-heading"><div><h2 id="learning-overview-title">Learning</h2><p>Your preparation at a glance</p></div><GraduationCap size={20} className="text-purple-300" aria-hidden="true" /></div>
            <div className="dashboard-stat-list">
              <div className="dashboard-stat"><div className="dashboard-stat-icon"><BookOpen size={19} aria-hidden="true" /></div><div><strong>{topics.length}</strong><span>{topics.length} approved topic{topics.length === 1 ? '' : 's'} available</span></div></div>
              <div className="dashboard-stat"><div className="dashboard-stat-icon"><CheckCircle2 size={19} aria-hidden="true" /></div><div><strong>{subjects.length}</strong><span>Saved subjects</span></div></div>
            </div>
          </section>
          <section className="dashboard-panel" aria-labelledby="syllabus-preview-title">
            <div className="dashboard-section-heading"><div><h2 id="syllabus-preview-title">Syllabus topics</h2><p>A starting point for your next session</p></div><button type="button" className="dashboard-button shrink-0" onClick={() => window.dispatchEvent(new CustomEvent('ace-workspace-navigate', { detail: 'learn' }))}>View all topics <ArrowUpRight size={14} aria-hidden="true" /></button></div>
            {topics.length ? <ol className="dashboard-topic-list">{topics.slice(0,6).map((topic,index) => <li key={topic.id} className="dashboard-topic-row"><span className="dashboard-topic-index" aria-hidden="true">{String(index+1).padStart(2,'0')}</span><div><h3>{topic.name}</h3><p>{topic.subjectName}</p></div></li>)}</ol> : <div className="rounded-xl border border-white/5 bg-white/[.02] p-5"><p className="font-semibold">Verified learning content is not published yet.</p><p className="mt-2 text-sm leading-6 text-white/60">Your saved subjects are ready. Approved topics will appear here when they are published.</p></div>}
          </section>
          <section className="dashboard-panel" aria-labelledby="my-subjects-title">
            <div className="dashboard-section-heading"><div><h2 id="my-subjects-title">My subjects</h2><p>Your saved preparation choices</p></div><GraduationCap size={19} className="text-purple-300" aria-hidden="true" /></div>
            {subjects.length ? <ul className="dashboard-subject-list">{subjects.map(subject => <li key={subject.id} className="dashboard-subject"><span className="dashboard-subject-code" aria-hidden="true">{subject.code}</span><div><strong>{subject.name}</strong><small>Selected subject</small></div></li>)}</ul> : <p className="text-sm leading-6 text-white/60">No saved subjects were found. Refresh or revisit your preparation profile.</p>}
          </section>
        </div>

        <div id="account" tabIndex={-1} className="dashboard-account-area">
          <div className="dashboard-section-heading"><div><h2>Updates &amp; account</h2><p>Manage your preferences, access and preparation profile.</p></div></div>
          <StudentNotifications />
          <StudentAccountSettings />
          <StudentAccountAccess />
        </div>
        <div id="learning-support" tabIndex={-1} className="dashboard-support-area"><LearningSupportStatus /></div>
      </main>
    </DashboardShell>
  )
}
