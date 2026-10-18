import { useEffect, useMemo, useState } from 'react'
import { getStudentPreferences, getStudentProfile, saveStudentFoundationFromCatalog } from '../lib/studentService'
import { listInstitutions, listPrograms, getProgramUtmeRule } from '../lib/seasonService'
import { ace, supabase } from '../lib/supabase'

type Subject = { id: string; name: string; code: string }
type Institution = Awaited<ReturnType<typeof listInstitutions>>[number]
type Program = Awaited<ReturnType<typeof listPrograms>>[number]
type ProgramUtmeRule = { required_subject_ids: string[]; alternative_groups: Array<{ subject_codes?: string[]; minimum_required?: number }>; minimum_optional_subjects: number; notes: string | null }

export default function StudentOnboarding({ onComplete }: { onComplete: () => void }) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [selectedInstitution, setSelectedInstitution] = useState('')
  const [selectedProgram, setSelectedProgram] = useState('')
  const [combinationIds, setCombinationIds] = useState<string[]>([])
  const [programRule, setProgramRule] = useState<ProgramUtmeRule | null>(null)
  const [name, setName] = useState('')
  const [target, setTarget] = useState('300')
  const [dailyMinutes, setDailyMinutes] = useState('60')
  const [busy, setBusy] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const combination = useMemo(() => combinationIds.map((id) => subjects.find((subject) => subject.id === id)).filter(Boolean) as Subject[], [combinationIds, subjects])
  const requiredIds = programRule?.required_subject_ids ?? []
  const optionalGroups = programRule?.alternative_groups ?? []
  const optionalSubjects = useMemo(() => {
    const codes = new Set(optionalGroups.flatMap((group) => group.subject_codes ?? []))
    const required = new Set(requiredIds)
    return subjects.filter((subject) => codes.has(subject.code) && !required.has(subject.id))
  }, [optionalGroups, requiredIds, subjects])
  const groupSelectionsValid = optionalGroups.every((group) => {
    const codes = new Set(group.subject_codes ?? [])
    const selectedCount = combination.filter((subject) => codes.has(subject.code)).length
    return selectedCount >= (group.minimum_required ?? 1)
  })
  const fixedCombination = Boolean(programRule) && combinationIds.length === 4 &&
    requiredIds.every((id) => combinationIds.includes(id)) && groupSelectionsValid
  const catalogUnavailable = !busy && institutions.length === 0

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
      if (catalog.length === 0) {
        setMessage('The verified JAMB institution catalogue has not been published yet. Your preparation data is safe; return when the catalogue is available.')
      }
    }).catch((error) => setMessage(error instanceof Error ? error.message : 'Could not load your preparation setup.'))
      .finally(() => active && setBusy(false))
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!selectedInstitution) {
      setPrograms([])
      setSelectedProgram('')
      setProgramRule(null)
      setCombinationIds([])
      return
    }
    let active = true
    setSelectedProgram('')
    setProgramRule(null)
    setCombinationIds([])
    listPrograms(selectedInstitution)
      .then((items) => active && setPrograms(items))
      .catch((error) => active && setMessage(error instanceof Error ? error.message : 'Could not load courses.'))
    return () => { active = false }
  }, [selectedInstitution])

  useEffect(() => {
    if (!selectedProgram) {
      setProgramRule(null)
      setCombinationIds([])
      return
    }
    let active = true
    setProgramRule(null)
    setCombinationIds([])
    Promise.resolve(ace.from('exam_seasons').select('id').eq('status', 'active').order('exam_year', { ascending: false }).limit(1).maybeSingle())
      .then(async ({ data, error }) => {
        if (error) throw error
        if (!data) throw new Error('No active JAMB season is available yet.')
        const rule = await getProgramUtmeRule(data.id, selectedProgram)
        if (!rule) throw new Error('No verified UTME subject combination is available for this course yet.')
        if (active) {
          setProgramRule(rule as ProgramUtmeRule)
          setCombinationIds(rule.required_subject_ids)
        }
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
    if (!fixedCombination) return setMessage('Select the required UTME subjects and satisfy every official alternative group before continuing.')
    setSaving(true)
    try {
      await saveStudentFoundationFromCatalog({
        display_name: name,
        target_score: score,
        institution_id: selectedInstitution,
        program_id: selectedProgram,
        daily_minutes: minutes,
        subject_ids: combinationIds,
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
      {message && <div role="alert" className="mb-5 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">{message}</div>}
      <section className="glass-card space-y-5 rounded-3xl p-6">
        <label className="block"><span className="mb-2 block text-sm text-white/60">Display name</span><input className="field w-full" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} /></label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block"><span className="mb-2 block text-sm text-white/60">Target JAMB score</span><input className="field w-full" type="number" min="0" max="400" value={target} onChange={(e) => setTarget(e.target.value)} /></label>
          <label className="block"><span className="mb-2 block text-sm text-white/60">Daily study time (minutes)</span><input className="field w-full" type="number" min="1" max="1440" value={dailyMinutes} onChange={(e) => setDailyMinutes(e.target.value)} /></label>
        </div>
        <label className="block"><span className="mb-2 block text-sm text-white/60">Intended institution</span><select className="field w-full" value={selectedInstitution} onChange={(e) => setSelectedInstitution(e.target.value)} disabled={catalogUnavailable}><option value="">{catalogUnavailable ? 'Verified institution catalogue unavailable' : 'Select your institution'}</option>{institutions.map((institution) => <option key={institution.id} value={institution.id}>{institution.name}</option>)}</select></label>
        <label className="block"><span className="mb-2 block text-sm text-white/60">Intended course</span><select className="field w-full" value={selectedProgram} onChange={(e) => setSelectedProgram(e.target.value)} disabled={!selectedInstitution || catalogUnavailable}><option value="">{catalogUnavailable ? 'Waiting for verified catalogue' : selectedInstitution ? 'Select your course' : 'Select an institution first'}</option>{programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}</select></label>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-semibold">Verified JAMB subject combination</p>
          <p className="mt-1 text-xs text-white/40">This is derived from the active season and selected programme.</p>
          {catalogUnavailable ? <p className="mt-3 text-sm text-white/45">No verified institution/course catalogue is published yet. ACE will not guess your combination.</p> : !programRule ? <p className="mt-3 text-sm text-white/45">Select a course with an approved combination to continue.</p> : <>
            {combination.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{combination.map((subject) => <span key={subject.id} className="rounded-full border border-purple-300/30 bg-purple-500/10 px-3 py-1.5 text-xs">{subject.name}{requiredIds.includes(subject.id) ? ' · Required' : ' · Selected'}</span>)}</div>}
            {optionalSubjects.length > 0 && <fieldset className="mt-4 space-y-2"><legend className="text-sm text-white/70">Choose your alternative UTME subject(s)</legend><p className="text-xs text-white/40">Select enough options to complete four subjects. Required subjects cannot be removed.</p>{optionalSubjects.map((subject) => <label key={subject.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 p-3 text-sm"><input type="checkbox" checked={combinationIds.includes(subject.id)} disabled={!combinationIds.includes(subject.id) && combinationIds.length >= 4} onChange={(event) => { setMessage(''); setCombinationIds((current) => event.target.checked ? (current.length < 4 ? [...current, subject.id] : current) : current.filter((id) => id !== subject.id)) }} /><span>{subject.name}</span></label>)}</fieldset>}
            {programRule.notes && <p className="mt-3 text-xs text-white/45">Official requirement: {programRule.notes}</p>}
            {!fixedCombination && <p className="mt-3 text-sm text-amber-200/80">Choose the official alternative subject(s) above to complete your four-subject combination.</p>}
          </>}
        </div>
        <button type="button" disabled={saving || !fixedCombination || catalogUnavailable} onClick={save} className="w-full rounded-xl bg-white py-3 font-bold text-black disabled:opacity-50">{saving ? 'Saving…' : catalogUnavailable ? 'Waiting for verified catalogue' : 'Continue to ACE'}</button>
      </section>
      <button type="button" onClick={() => supabase.auth.signOut()} className="mt-4 w-full py-3 text-sm text-white/40">Sign out</button>
    </div>
  </main>
}
