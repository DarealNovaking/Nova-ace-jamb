import { useEffect, useMemo, useState } from 'react'
import { getStudentPreferences, getStudentProfile, saveStudentFoundationFromCatalog } from '../lib/studentService'
import { listInstitutions, listPrograms, getProgramUtmeRule } from '../lib/seasonService'
import { ace, supabase } from '../lib/supabase'

type Subject = { id: string; name: string; code: string }
type Institution = Awaited<ReturnType<typeof listInstitutions>>[number]
type Program = Awaited<ReturnType<typeof listPrograms>>[number]

export default function StudentOnboarding({ onComplete }: { onComplete: () => void }) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [selectedInstitution, setSelectedInstitution] = useState('')
  const [selectedProgram, setSelectedProgram] = useState('')
  const [combinationIds, setCombinationIds] = useState<string[]>([])
  const [name, setName] = useState('')
  const [target, setTarget] = useState('300')
  const [dailyMinutes, setDailyMinutes] = useState('60')
  const [busy, setBusy] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const combination = useMemo(() => combinationIds.map((id) => subjects.find((subject) => subject.id === id)).filter(Boolean) as Subject[], [combinationIds, subjects])

  useEffect(() => {
    let active = true
    Promise.all([
      ace.from('subjects').select('id,name,code').eq('active', true).order('sort_order'),
      getStudentProfile(),
      getStudentPreferences(),
      listInstitutions(),
    ]).then(([subjectResult, profile, preferences, catalog]) => {
      if (!active) return
      if (subjectResult.error) throw subjectResult.error
      setSubjects((subjectResult.data ?? []) as Subject[])
      setInstitutions(catalog)
      setName(profile.display_name ?? '')
      setTarget(String(profile.target_score ?? 300))
      setDailyMinutes(String(Math.max(1, preferences.daily_minutes ?? 60)))
    }).catch((error) => setMessage(error instanceof Error ? error.message : 'Could not load your preparation setup.'))
      .finally(() => active && setBusy(false))
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!selectedInstitution) {
      setPrograms([])
      setSelectedProgram('')
      setCombinationIds([])
      return
    }
    let active = true
    setSelectedProgram('')
    setCombinationIds([])
    listPrograms(selectedInstitution)
      .then((items) => active && setPrograms(items))
      .catch((error) => active && setMessage(error instanceof Error ? error.message : 'Could not load courses.'))
    return () => { active = false }
  }, [selectedInstitution])

  useEffect(() => {
    if (!selectedProgram) {
      setCombinationIds([])
      return
    }
    let active = true
    setCombinationIds([])
    ace.from('exam_seasons').select('id').eq('status', 'active').order('exam_year', { ascending: false }).limit(1).maybeSingle()
      .then(async ({ data, error }) => {
        if (error) throw error
        if (!data) throw new Error('No active JAMB season is available yet.')
        const rule = await getProgramUtmeRule(data.id, selectedProgram)
        if (!rule) throw new Error('No verified UTME subject combination is available for this course yet.')
        if (active) setCombinationIds(rule.required_subject_ids)
      })
      .catch((error) => active && setMessage(error instanceof Error ? error.message : 'Could not load the verified subject combination.'))
    return () => { active = false }
  }, [selectedProgram])

  const save = async () => {
    setMessage('')
    const score = Number(target)
    const minutes = Number(dailyMinutes)
    if (!name.trim()) return setMessage('Enter your name.')
    if (!Number.isInteger(score) || score < 0 || score > 400) return setMessage('Target score must be between 0 and 400.')
    if (!selectedInstitution || !selectedProgram) return setMessage('Select your institution and course.')
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440) return setMessage('Study time must be between 1 and 1440 minutes.')
    if (!combinationIds.length) return setMessage('A verified UTME subject combination is required before you can continue.')
    setSaving(true)
    try {
      await saveStudentFoundationFromCatalog({
        display_name: name,
        target_score: score,
        institution_id: selectedInstitution,
        program_id: selectedProgram,
        daily_minutes: minutes,
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
        <p className="mt-3 max-w-xl text-white/50">Choose your institution and course. ACE will use the verified JAMB combination for that programme instead of making you guess your subjects.</p>
      </div>
      {message && <div className="mb-5 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">{message}</div>}
      <section className="glass-card space-y-5 rounded-3xl p-6">
        <label className="block"><span className="mb-2 block text-sm text-white/60">Display name</span><input className="field w-full" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} /></label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block"><span className="mb-2 block text-sm text-white/60">Target JAMB score</span><input className="field w-full" type="number" min="0" max="400" value={target} onChange={(e) => setTarget(e.target.value)} /></label>
          <label className="block"><span className="mb-2 block text-sm text-white/60">Daily study time (minutes)</span><input className="field w-full" type="number" min="1" max="1440" value={dailyMinutes} onChange={(e) => setDailyMinutes(e.target.value)} /></label>
        </div>
        <label className="block"><span className="mb-2 block text-sm text-white/60">Intended institution</span><select className="field w-full" value={selectedInstitution} onChange={(e) => setSelectedInstitution(e.target.value)}><option value="">Select your institution</option>{institutions.map((institution) => <option key={institution.id} value={institution.id}>{institution.name}</option>)}</select></label>
        <label className="block"><span className="mb-2 block text-sm text-white/60">Intended course</span><select className="field w-full" value={selectedProgram} onChange={(e) => setSelectedProgram(e.target.value)} disabled={!selectedInstitution}><option value="">{selectedInstitution ? 'Select your course' : 'Select an institution first'}</option>{programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}</select></label>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-semibold">Verified JAMB subject combination</p>
          <p className="mt-1 text-xs text-white/40">This is derived from the active season and selected programme.</p>
          {combination.length ? <div className="mt-3 flex flex-wrap gap-2">{combination.map((subject) => <span key={subject.id} className="rounded-full border border-purple-300/30 bg-purple-500/10 px-3 py-1.5 text-xs">{subject.name}</span>)}</div> : <p className="mt-3 text-sm text-white/45">Select a course with an approved combination to continue.</p>}
        </div>
        <button type="button" disabled={saving || !combinationIds.length} onClick={save} className="w-full rounded-xl bg-white py-3 font-bold text-black disabled:opacity-50">{saving ? 'Saving…' : 'Continue to ACE'}</button>
      </section>
      <button type="button" onClick={() => supabase.auth.signOut()} className="mt-4 w-full py-3 text-sm text-white/40">Sign out</button>
    </div>
  </main>
}
