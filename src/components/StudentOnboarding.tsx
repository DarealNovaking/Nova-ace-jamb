import { useEffect, useState } from 'react'
import { getStudentProfile, getStudentSubjects, getStudentPreferences, updateStudentProfile, updateStudentPreferences, setStudentSubjects } from '../lib/studentService'
import { ace, supabase } from '../lib/supabase'

type Subject = { id: string; name: string; code: string }

export default function StudentOnboarding({ onComplete }: { onComplete: () => void }) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [name, setName] = useState('')
  const [target, setTarget] = useState('300')
  const [institution, setInstitution] = useState('')
  const [course, setCourse] = useState('')
  const [dailyMinutes, setDailyMinutes] = useState('60')
  const [busy, setBusy] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([
      ace.from('subjects').select('id,name,code').eq('active', true).order('sort_order'),
      getStudentProfile(),
      getStudentSubjects(),
      getStudentPreferences(),
    ]).then(([subjectResult, profile, currentSubjects, preferences]) => {
      if (!active) return
      if (subjectResult.error) throw subjectResult.error
      setSubjects((subjectResult.data ?? []) as Subject[])
      setName(profile.display_name ?? '')
      setTarget(String(profile.target_score ?? 300))
      setInstitution(profile.institution ?? '')
      setCourse(profile.course ?? '')
      setDailyMinutes(String(Math.max(1, preferences.daily_minutes ?? 60)))
      setSelected(currentSubjects.map((x: { subject_id: string }) => x.subject_id))
    }).catch((error) => setMessage(error instanceof Error ? error.message : 'Could not load your profile.'))
      .finally(() => active && setBusy(false))
    return () => { active = false }
  }, [])

  const toggleSubject = (id: string) => {
    setSelected((current) => current.includes(id) ? current.filter((x) => x !== id) : current.length < 4 ? [...current, id] : current)
  }

  const save = async () => {
    setMessage('')
    const score = Number(target)
    const minutes = Number(dailyMinutes)
    if (!name.trim()) return setMessage('Enter your name.')
    if (!Number.isInteger(score) || score < 0 || score > 400) return setMessage('Target score must be between 0 and 400.')
    if (!institution.trim()) return setMessage('Enter your intended institution.')
    if (!course.trim()) return setMessage('Enter your intended course.')
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440) return setMessage('Study time must be between 1 and 1440 minutes.')
    if (selected.length < 1 || selected.length > 4) return setMessage('Select between 1 and 4 subjects.')
    setSaving(true)
    try {
      await updateStudentProfile({ display_name: name, target_score: score, institution, course })
      await updateStudentPreferences({ daily_minutes: minutes })
      await setStudentSubjects(selected)
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
        <p className="mt-3 max-w-xl text-white/50">These details stay with your account and will drive your preparation experience.</p>
      </div>
      {message && <div className="mb-5 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">{message}</div>}
      <section className="glass-card space-y-5 rounded-3xl p-6">
        <label className="block"><span className="mb-2 block text-sm text-white/60">Display name</span><input className="field w-full" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} /></label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block"><span className="mb-2 block text-sm text-white/60">Target JAMB score</span><input className="field w-full" type="number" min="0" max="400" value={target} onChange={(e) => setTarget(e.target.value)} /></label>
          <label className="block"><span className="mb-2 block text-sm text-white/60">Daily study time (minutes)</span><input className="field w-full" type="number" min="1" max="1440" value={dailyMinutes} onChange={(e) => setDailyMinutes(e.target.value)} /></label>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block"><span className="mb-2 block text-sm text-white/60">Intended institution</span><input className="field w-full" value={institution} onChange={(e) => setInstitution(e.target.value)} maxLength={160} placeholder="e.g. University of Lagos" /></label>
          <label className="block"><span className="mb-2 block text-sm text-white/60">Intended course</span><input className="field w-full" value={course} onChange={(e) => setCourse(e.target.value)} maxLength={160} placeholder="e.g. Computer Science" /></label>
        </div>
        <div>
          <p className="mb-2 text-sm text-white/60">JAMB subjects</p>
          <p className="mb-3 text-xs text-white/35">Choose 1–4 for now. Final exam composition will come from the active season configuration.</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {subjects.map((subject) => <button key={subject.id} type="button" onClick={() => toggleSubject(subject.id)} className={`rounded-xl border p-3 text-left ${selected.includes(subject.id) ? 'border-purple-300/60 bg-purple-500/15' : 'border-white/10 bg-white/5'}`}><b>{subject.code}</b><span className="mt-1 block text-xs text-white/45">{subject.name}</span></button>)}
          </div>
        </div>
        <button type="button" disabled={saving} onClick={save} className="w-full rounded-xl bg-white py-3 font-bold text-black disabled:opacity-50">{saving ? 'Saving…' : 'Save my ACE profile'}</button>
      </section>
      <button type="button" onClick={() => supabase.auth.signOut()} className="mt-4 w-full py-3 text-sm text-white/40">Sign out</button>
    </div>
  </main>
}
