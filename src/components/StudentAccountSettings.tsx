import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Loader2, Settings2 } from 'lucide-react'
import { getStudentPreferences, getStudentProfile, updateStudentPreferences, updateStudentProfile } from '../lib/studentService'

export default function StudentAccountSettings() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [targetScore, setTargetScore] = useState('')
  const [institution, setInstitution] = useState('')
  const [course, setCourse] = useState('')
  const [dailyMinutes, setDailyMinutes] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [profile, preferences] = await Promise.all([getStudentProfile(), getStudentPreferences()])
      setDisplayName(profile.display_name ?? '')
      setTargetScore(profile.target_score === null ? '' : String(profile.target_score))
      setInstitution(profile.institution ?? '')
      setCourse(profile.course ?? '')
      setDailyMinutes(preferences.daily_minutes === null ? '' : String(preferences.daily_minutes))
    } catch {
      setError('We could not load your account settings. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (open) void load() }, [open])

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const score = Number(targetScore)
      const minutes = Number(dailyMinutes)
      if (!Number.isInteger(score) || score < 0 || score > 400) throw new Error('Enter a target score from 0 to 400.')
      if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440) throw new Error('Enter daily study time from 1 to 1440 minutes.')
      await updateStudentProfile({
        display_name: displayName,
        target_score: score,
        institution,
        course,
      })
      await updateStudentPreferences({ daily_minutes: minutes })
      setNotice('Your account settings were saved.')
    } catch (caught) {
      setError(caught instanceof Error && /target score|daily study time/i.test(caught.message) ? caught.message : 'We could not save your account settings. Check your entries and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="glass-card mt-8 rounded-3xl p-6 sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-xs uppercase tracking-[.18em] text-purple-200/50">Your account</p><h2 className="mt-1 text-xl font-black">Account settings</h2><p className="mt-1 text-sm text-white/45">Update your preparation profile and daily study time.</p></div>
        <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/5"><Settings2 size={16} aria-hidden="true" /> {open ? 'Close settings' : 'Edit settings'}</button>
      </div>
      {open && (loading ? <div className="grid min-h-24 place-items-center text-white/45"><Loader2 size={20} className="animate-spin" aria-label="Loading account settings" /></div> : <form onSubmit={save} className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold">Display name<input required minLength={1} maxLength={80} value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-white outline-none focus:border-purple-300/50" /></label>
        <label className="text-sm font-semibold">Target JAMB score<input required type="number" min={0} max={400} step={1} value={targetScore} onChange={(event) => setTargetScore(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-white outline-none focus:border-purple-300/50" /></label>
        <label className="text-sm font-semibold">Intended institution <span className="font-normal text-white/35">(optional)</span><input maxLength={160} value={institution} onChange={(event) => setInstitution(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-white outline-none focus:border-purple-300/50" /></label>
        <label className="text-sm font-semibold">Intended course <span className="font-normal text-white/35">(optional)</span><input maxLength={160} value={course} onChange={(event) => setCourse(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-white outline-none focus:border-purple-300/50" /></label>
        <label className="text-sm font-semibold sm:col-span-2">Daily study time (minutes)<input required type="number" min={1} max={1440} step={1} value={dailyMinutes} onChange={(event) => setDailyMinutes(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-white outline-none focus:border-purple-300/50 sm:max-w-xs" /><span className="mt-1 block text-xs font-normal text-white/35">Enter a value between 1 and 1,440 minutes.</span></label>
        {error && <p role="alert" className="sm:col-span-2 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-100">{error}</p>}
        {notice && <p role="status" className="sm:col-span-2 rounded-xl border border-emerald-300/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">{notice}</p>}
        <div className="sm:col-span-2"><button type="submit" disabled={saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-purple-300 px-5 py-2 text-sm font-bold text-[#120b1c] disabled:opacity-50">{saving && <Loader2 size={15} className="animate-spin" />} Save account settings</button></div>
      </form>)}
    </section>
  )
}
