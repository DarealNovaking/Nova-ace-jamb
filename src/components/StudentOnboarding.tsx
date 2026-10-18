import { useEffect, useState } from 'react'
import { getStudentPreferences, getStudentProfile, saveStudentPreparationFoundation } from '../lib/studentService'
import { ace, supabase } from '../lib/supabase'

type Subject = { id: string; name: string; code: string }

export default function StudentOnboarding({ onComplete }: { onComplete: () => void }) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
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
    Promise.all([
      ace.from('subjects').select('id,name,code').eq('active', true).order('sort_order'),
      getStudentProfile(),
      getStudentPreferences(),
    ]).then(([subjectResult, profile, preferences]) => {
      if (!active) return
      if (subjectResult.error) throw subjectResult.error
      setSubjects((subjectResult.data ?? []) as Subject[])
      setName(profile.display_name ?? '')
      setTarget(String(profile.target_score ?? 300))
      setDailyMinutes(String(Math.max(1, preferences.daily_minutes ?? 60)))
      setInstitutionGoal(profile.institution ?? '')
      setCourseGoal(profile.course ?? '')
      // Keep an existing valid subject selection if it is still in the active subject list.
      return ace.from('student_subjects').select('subject_id,sort_order').order('sort_order').then(({ data, error }) => {
        if (error) throw error
        if (active) setSelectedSubjects((data ?? []).map((row) => row.subject_id).filter((id) => (subjectResult.data ?? []).some((subject) => subject.id === id)).slice(0, 4))
      })
    }).catch((error) => setMessage(error instanceof Error ? error.message : 'Could not load your preparation setup.'))
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
    if (selectedSubjects.length !== 4) return setMessage('Choose exactly four subjects to prepare for.')
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
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save your profile.')
    } finally {
      setSaving(false)
    }
  }

  if (busy) return <div className="grid min-h-screen place-items-center bg-[#07050d] px-5 text-white"><p className="text-white/60">Loading your ACE profile…</p></div>

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
          <p className="mb-3 text-xs text-white/40">Select exactly four. These are your preparation choices, not a confirmation that they satisfy a specific course's official JAMB requirements.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {subjects.map((subject) => <label key={subject.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 p-3 text-sm">
              <input type="checkbox" checked={selectedSubjects.includes(subject.id)} disabled={!selectedSubjects.includes(subject.id) && selectedSubjects.length >= 4} onChange={(event) => { setMessage(''); setSelectedSubjects((current) => event.target.checked ? [...current, subject.id].slice(0, 4) : current.filter((id) => id !== subject.id)) }} />
              <span>{subject.name}</span>
            </label>)}
          </div>
          {subjects.length === 0 && <p className="text-sm text-amber-200/80">The subject list is unavailable right now. Please try again later.</p>}
          <p className="text-xs text-white/50">{selectedSubjects.length} of 4 selected</p>
        </fieldset>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-semibold">Admission goals (optional)</p>
          <p className="mt-1 text-xs text-white/40">These are saved as your intended goals only. ACE will not mark them verified or infer your official subject combination.</p>
          <label className="mt-4 block"><span className="mb-2 block text-sm text-white/60">Intended institution</span><input className="field w-full" value={institutionGoal} onChange={(e) => setInstitutionGoal(e.target.value)} maxLength={160} placeholder="e.g. your preferred institution" /></label>
          <label className="mt-4 block"><span className="mb-2 block text-sm text-white/60">Intended course</span><input className="field w-full" value={courseGoal} onChange={(e) => setCourseGoal(e.target.value)} maxLength={160} placeholder="e.g. your intended course" /></label>
          <p className="mt-3 text-xs text-white/40">Verify official requirements using the <a className="text-purple-200 underline" href="https://ibass.jamb.gov.ng/eligibility-checker" target="_blank" rel="noreferrer">JAMB IBASS eligibility checker</a>.</p>
        </div>
        <button type="button" disabled={saving || subjects.length < 4 || selectedSubjects.length !== 4} onClick={save} className="w-full rounded-xl bg-white py-3 font-bold text-black disabled:opacity-50">{saving ? 'Saving…' : 'Continue to ACE'}</button>
      </section>
      <button type="button" onClick={() => supabase.auth.signOut()} className="mt-4 w-full py-3 text-sm text-white/40">Sign out</button>
    </div>
  </main>
}
