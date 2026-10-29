import type { ReactNode } from 'react'
import { BookOpen, Brain, CalendarDays, Clock3, GraduationCap, LayoutDashboard, Layers3, LifeBuoy, ListChecks, Settings2, ShieldCheck, Trophy } from 'lucide-react'
import type { StudentWorkspaceMode } from './StudentStudyWorkspace'

export type DashboardArea = 'student' | 'admin' | 'editor'
type Props = {
  area: DashboardArea
  activeId: string
  displayName?: string
  onStudentNavigate?: (mode: StudentWorkspaceMode | 'home') => void
  children: ReactNode
}
const studentItems = [
  { id: 'home', label: 'Overview', detail: 'Your preparation home', icon: LayoutDashboard },
  { id: 'learn', label: 'Learn', detail: 'Approved syllabus topics', icon: BookOpen },
  { id: 'practice', label: 'Practice', detail: 'Verified question sets', icon: Brain },
  { id: 'revision', label: 'Quick revision', detail: 'Review approved topics', icon: Clock3 },
  { id: 'flashcards', label: 'Flashcards', detail: 'Recall and review', icon: Layers3 },
  { id: 'progress', label: 'Progress', detail: 'Saved attempt results', icon: Trophy },
  { id: 'plan', label: 'Study plan', detail: 'A repeatable routine', icon: CalendarDays },
] as const
const adminItems = [
  { id: 'overview', label: 'Overview', detail: 'Your administration home', icon: LayoutDashboard, href: '/admin' },
  { id: 'academic', label: 'Academic Structure', detail: 'Subjects, topics & syllabus', icon: BookOpen, href: '/admin-academic' },
  { id: 'questions', label: 'Question bank', detail: 'Draft, review & publish', icon: ListChecks, href: '/admin-questions' },
] as const

/** Presentation only. All role checks and data access stay in the existing gates. */
export default function DashboardShell({ area, activeId, displayName, onStudentNavigate, children }: Props) {
  const student = area === 'student'
  const identity = student ? displayName || 'Your preparation space' : area === 'admin' ? 'Administrator' : 'Content editor'
  const currentLabel = student ? studentItems.find(item => item.id === activeId)?.label : adminItems.find(item => item.id === activeId)?.label
  return (
    <div className={`dashboard-shell dashboard-shell--${student ? 'student' : 'admin'}`}>
      <aside className="dashboard-sidebar" aria-label={student ? 'Student workspace' : 'Editorial workspace'}>
        <a href={student ? '/' : area === 'admin' ? '/admin' : '/admin-academic'} className="dashboard-brand" aria-label="ACE JAMB home">
          <span className="dashboard-brand-mark"><GraduationCap size={23} aria-hidden="true" /></span>
          <span><strong>ACE JAMB<span className="dashboard-brand-dot">.</span></strong><small>BY ÑØVÃ</small></span>
        </a>
        <p className="dashboard-nav-label">{student ? 'Your workspace' : 'Administration'}</p>
        <nav className="dashboard-navigation" aria-label={student ? 'Preparation tools' : 'Administration navigation'}>
          {student ? studentItems.map(item => {
            const Icon = item.icon
            return <button key={item.id} type="button" className="dashboard-nav-item" aria-current={activeId === item.id ? 'page' : undefined}
              aria-label={activeId === 'home' ? `${item.id === 'progress' ? 'My progress' : item.label} ${item.detail}` : item.label}
              onClick={() => { if (activeId !== item.id) onStudentNavigate?.(item.id) }}>
              <Icon size={19} aria-hidden="true" /><span>{item.label}</span>{activeId === item.id && <span className="dashboard-nav-dot" aria-hidden="true" />}
            </button>
          }) : adminItems.filter(item => area === 'admin' || item.id !== 'overview').map(item => {
            const Icon = item.icon
            return <a key={item.id} href={item.href} className="dashboard-nav-item" aria-current={activeId === item.id ? 'page' : undefined}>
              <Icon size={19} aria-hidden="true" /><span>{item.label}</span>{activeId === item.id && <span className="dashboard-nav-dot" aria-hidden="true" />}
            </a>
          })}
        </nav>
        {student && <nav className="dashboard-secondary-nav" aria-label="Account and support">
          <a className="dashboard-nav-item" href={activeId === 'home' ? '#account' : '/#account'}><Settings2 size={18} aria-hidden="true" />Account &amp; settings</a>
          <a className="dashboard-nav-item" href={activeId === 'home' ? '#learning-support' : '/#learning-support'}><LifeBuoy size={18} aria-hidden="true" />Learning support</a>
        </nav>}
        <div className="dashboard-sidebar-footer"><span className="dashboard-avatar" aria-hidden="true">{student ? (displayName?.trim().charAt(0) || 'S').toLocaleUpperCase() : <ShieldCheck size={19} />}</span><div><strong>{identity}</strong><small>{student ? 'Student account' : 'Authorized workspace'}</small></div></div>
      </aside>
      <div className="dashboard-body">
        <div className="dashboard-topbar"><p><span>{student ? 'My preparation' : 'Administration'}</span><span aria-hidden="true">/</span><strong>{currentLabel || 'Workspace'}</strong></p><span className="dashboard-environment">{student ? 'Study at your pace' : 'Review before publication'}</span></div>
        {children}
        <footer className="dashboard-footer"><span>ÑØVÃ ACE JAMB</span><span>{student ? 'One focused session at a time.' : 'Careful content. Better preparation.'}</span></footer>
      </div>
    </div>
  )
}
