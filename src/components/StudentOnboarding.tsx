import { useEffect, useState } from 'react'
import { getStudentPreferences, getStudentProfile, getStudentSubjects, saveStudentPreparationFoundation } from '../lib/studentService'
import { ace, supabase } from '../lib/supabase'

type Subject = { id: string; name: string; code: string }

export default function StudentOnboarding({ onComplete }: { onComplete: () => void }) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const englishSubject = subjects.find((subject) => subject.code.toUpperCase() === 'ENG')
  const additionalSelectedSubjects = selectedSubjects.filter((id) => id !== englishSubject?.id)
  const [institutionGoal, setInstitutionGoal] = useState('')
  const [courseGoal, setCourseGoal] = useState('')
  const [name, setName] = useState('')
  const [target, setTarget] = useState('300')
  const [dailyMinutes, setDailyMinutes] = useState('60')
  const [busy, setBusy] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true
    const optionalRecord = async <T,>(request: Promise<T>): Promise<T | null> => {
      try {
        return await request
      } catch (error) {
        // A first-time student may not have a profile/preferences row yet.
        if ((error as { code?: string })?.code === 'PGRST116') return null
        throw error
      }
    }
    Promise.all([
      ace.from('subjects').select('id,name,code').eq('active', true).order('sort_order'),
      optionalRecord(getStudentProfile()),
      optionalRecord(getStudentPreferences()),
    ]).then(([subjectResult, profile, preferences]) => {
      if (!active) return
      if (subjectResult.error) throw subjectResult.error
      const activeSubjects = (subjectResult.data ?? []) as Subject[]
      setSubjects(activeSubjects)
      const english = activeSubjects.find((subject) => subject.code.toUpperCase() === 'ENG')
      setName(profile?.display_name ?? '')
      setTarget(String(profile?.target_score ?? 300))
      setDailyMinutes(String(Math.max(1, preferences?.daily_minutes ?? 60)))
      setInstitutionGoal(profile?.institution ?? '')
      setCourseGoal(profile?.course ?? '')
      // Keep an existing valid subject selection if it is still in the active subject list.
      return getStudentSubjects().then((rows) => {
        if (active) {
          const validIds = rows.map((row) => row.subject_id).filter((id) => activeSubjects.some((subject) => subject.id === id))
          const otherThree = validIds.filter((id) => id !== english?.id).slice(0, 3)
          setSelectedSubjects(english ? [english.id, ...otherThree] : otherThree)
        }
      })
    }).catch(() => setMessage('Could not load your preparation setup. Check your connection and try again.'))
      .finally(() => active && setBusy(false))
    return () => { active = false }
  }, [])

  const save = async () => {
    setMessage('')
    const score = Number(target)
    const minutes = Number(dailyMinutes)
    if (!name.trim()) return setMessage('Enter your name.')
    if (!Number.isInteger(score) || score < 0 || score > 400) return setMessage('Target score must be between 0 and 400.')
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440) return setMessage('Study time must be between 1 and 1440 minutes.')
    if (!englishSubject) return setMessage('English is unavailable in the subject list. Please try again later.')
    if (additionalSelectedSubjects.length !== 3) return setMessage('Choose three additional subjects. English is included automatically.')
    setSaving(true)
    try {
      await saveStudentPreparationFoundation({
        display_name: name,
        target_score: score,
        institution_goal: institutionGoal,
        course_goal: courseGoal,
        daily_minutes: minutes,
        subject_ids: selectedSubjects,
      })
      onComplete()
    } catch {
      setMessage('Could not save your preparation profile. Check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  if (busy) return <main aria-busy="true" className="grid min-h-screen place-items-center bg-[#07050d] px-5 text-white"><p role="status" aria-live="polite" aria-atomic="true" className="text-white/60">Loading your ACE profile…</p></main>

  return <main className="min-h-screen bg-[#07050d] px-5 py-8 text-white">
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[.2em] text-purple-300/70">ACE JAMB · Student setup</p>
        <h1 className="mt-2 text-4xl font-black sm:text-5xl">Build your preparation profile.</h1>
        <p className="mt-3 max-w-xl text-white/50">Choose four subjects to prepare for and set your study goal. Institution and course are optional until a verified JAMB catalogue entry is available.</p>
      </div>
      {message && <div role="alert" className="mb-5 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">{message}</div>}
      <section className="glass-card space-y-5 rounded-3xl p-6">
        <label className="block"><span className="mb-2 block text-sm text-white/60">Display name</span><input className="field w-full" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="name" /></label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block"><span className="mb-2 block text-sm text-white/60">Target JAMB score</span><input className="field w-full" type="number" min="0" max="400" value={target} onChange={(e) => setTarget(e.target.value)} /></label>
          <label className="block"><span className="mb-2 block text-sm text-white/60">Daily study time (minutes)</span><input className="field w-full" type="number" min="1" max="1440" value={dailyMinutes} onChange={(e) => setDailyMinutes(e.target.value)} /></label>
        </div>
        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-semibold">Subjects you want to prepare for</legend>
          <p className="mb-3 text-xs text-white/40">English is included automatically. Choose any three other subjects. This is your preparation selection, not confirmation of a course's official JAMB requirements.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {subjects.map((subject) => {
              const isEnglish = subject.code.toUpperCase() === 'ENG'
              const isSelected = selectedSubjects.includes(subject.id)
              return <label key={subject.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 p-3 text-sm ${isEnglish ? 'opacity-90' : ''}`}>
                <input type="checkbox" checked={isSelected} disabled={isEnglish || (!isSelected && additionalSelectedSubjects.length >= 3)} onChange={(event) => {
                  setMessage('')
                  if (isEnglish) return
                  setSelectedSubjects((current) => {
                    const englishId = englishSubject?.id
                    const others = current.filter((id) => id !== englishId && id !== subject.id)
                    const nextOthers = event.target.checked ? [...others, subject.id].slice(0, 3) : others
                    return englishId ? [englishId, ...nextOthers] : nextOthers
                  })
                }} />
                <span>{subject.name}{isEnglish ? ' · Included automatically' : ''}</span>
              </label>
            })}
          </div>
          {subjects.length === 0 && <p className="text-sm text-amber-200/80">The subject list is unavailable right now. Please try again later.</p>}
          <p className="text-xs text-white/50">English included + {additionalSelectedSubjects.length} of 3 additional subjects selected</p>
        </fieldset>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-semibold">Admission goals (optional)</p>
          <p className="mt-1 text-xs text-white/40">These are saved as your intended goals only. ACE will not mark them verified or infer your official subject combination.</p>
          <label className="mt-4 block"><span className="mb-2 block text-sm text-white/60">Intended institution</span><input className="field w-full" value={institutionGoal} onChange={(e) => setInstitutionGoal(e.target.value)} maxLength={160} placeholder="e.g. your preferred institution" /></label>
          <label className="mt-4 block"><span className="mb-2 block text-sm text-white/60">Intended course</span><input className="field w-full" value={courseGoal} onChange={(e) => setCourseGoal(e.target.value)} maxLength={160} placeholder="e.g. your intended course" /></label>
          <p className="mt-3 text-xs text-white/40">Verify official requirements using the <a className="text-purple-200 underline" href="https://ibass.jamb.gov.ng/eligibility-checker" target="_blank" rel="noreferrer">JAMB IBASS eligibility checker</a>.</p>
        </div>
        <button type="button" disabled={saving || !englishSubject || subjects.length < 4 || additionalSelectedSubjects.length !== 3} onClick={save} className="w-full rounded-xl bg-white py-3 font-bold text-black disabled:opacity-50">{saving ? 'Saving…' : 'Continue to ACE'}</button>{saving && <p role="status" aria-live="polite" aria-atomic="true" className="text-center text-sm text-white/60">Saving your preparation profile…</p>}
      </section>
      <button type="button" onClick={() => supabase.auth.signOut()} className="mt-4 w-full py-3 text-sm text-white/40">Sign out</button>
    </div>
  </main>
}
