import { useEffect, useState } from 'react'
import { BookOpen, Brain, CalendarDays, CheckCircle2, ListTodo, Loader2, RotateCcw, Save } from 'lucide-react'
import { getStudentPreferences, updateStudentPreferences } from '../lib/studentService'

type Subject = { id: string; name: string; code: string }

const days = [
  { id: 'monday', label: 'Mon', full: 'Monday' },
  { id: 'tuesday', label: 'Tue', full: 'Tuesday' },
  { id: 'wednesday', label: 'Wed', full: 'Wednesday' },
  { id: 'thursday', label: 'Thu', full: 'Thursday' },
  { id: 'friday', label: 'Fri', full: 'Friday' },
  { id: 'saturday', label: 'Sat', full: 'Saturday' },
  { id: 'sunday', label: 'Sun', full: 'Sunday' },
]

function localDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function StudentStudyPlan({ subjects }: { subjects: Subject[] }) {
  const [todayKey, setTodayKey] = useState(() => localDateKey())
  const todayId = days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1].id
  const [completedTasks, setCompletedTasks] = useState<string[]>(() => {
    try {
      const stored = window.localStorage.getItem(`ace-study-routine-${todayKey}`)
      return stored ? JSON.parse(stored) as string[] : []
    } catch {
      return []
    }
  })
  useEffect(() => {
    const refreshForNewDay = () => {
      const nextKey = localDateKey()
      if (nextKey === todayKey) return
      setTodayKey(nextKey)
      try {
        const stored = window.localStorage.getItem(`ace-study-routine-${nextKey}`)
        setCompletedTasks(stored ? JSON.parse(stored) as string[] : [])
      } catch {
        setCompletedTasks([])
      }
    }
    const timer = window.setInterval(refreshForNewDay, 60_000)
    return () => window.clearInterval(timer)
  }, [todayKey])

  const [dailyMinutes, setDailyMinutes] = useState(60)
  const [selectedDays, setSelectedDays] = useState<string[]>(['monday', 'tuesday', 'wednesday', 'thursday', 'friday'])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const preferences = await getStudentPreferences()
        if (cancelled) return
        if (preferences.daily_minutes && preferences.daily_minutes >= 1 && preferences.daily_minutes <= 1440) {
          setDailyMinutes(preferences.daily_minutes)
        }
        if (Array.isArray(preferences.preferred_study_days)) {
          const validDays = preferences.preferred_study_days.filter((day) => days.some((item) => item.id === day))
          setSelectedDays(validDays)
        }
      } catch (caught) {
        if (!cancelled) setError('We could not load your saved study preferences. Check your connection and try again.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [])

  function toggleDay(day: string) {
    setSelectedDays((current) => current.includes(day) ? current.filter((item) => item !== day) : [...current, day])
    setNotice('')
  }

  function toggleTask(taskId: string) {
    setCompletedTasks((current) => {
      const updated = current.includes(taskId) ? current.filter((id) => id !== taskId) : [...current, taskId]
      try {
        window.localStorage.setItem(`ace-study-routine-${todayKey}`, JSON.stringify(updated))
      } catch {
        // Keep the checklist usable if local storage is unavailable.
      }
      return updated
    })
  }

  function resetTodayTasks() {
    setCompletedTasks([])
    try {
      window.localStorage.removeItem(`ace-study-routine-${todayKey}`)
    } catch {
      // Keep the checklist usable if local storage is unavailable.
    }
  }

  const weeklySchedule = days.map((day, index) => ({
    ...day,
    selected: selectedDays.includes(day.id),
    primary: subjects.length && selectedDays.includes(day.id) ? subjects[index % subjects.length] : null,
    secondary: subjects.length > 1 && selectedDays.includes(day.id) ? subjects[(index + 1) % subjects.length] : null,
  }))
  const todaySchedule = weeklySchedule.find((day) => day.id === todayId)
  const routineTasks = [
    { id: 'concept-review', label: 'Review an approved syllabus topic', detail: todaySchedule?.primary ? `Focus on ${todaySchedule.primary.name}.` : 'Choose an approved topic when one is available.', icon: BookOpen },
    { id: 'practice-drill', label: 'Complete a practice session', detail: todaySchedule?.secondary ? `Try ${todaySchedule.secondary.name} if reviewed questions are available.` : 'Use reviewed questions when available; no practice content is invented.', icon: Brain },
    { id: 'mistake-review', label: 'Review saved mistakes and notes', detail: 'Revisit recorded mistakes or your own notes if available.', icon: CheckCircle2 },
  ]

  async function savePlan() {
    setSaving(true)
    setError('')
    setNotice('')
    try {
      await updateStudentPreferences({ daily_minutes: dailyMinutes, preferred_study_days: selectedDays })
      setNotice('Your study preferences have been saved to your account.')
    } catch (caught) {
      setError('We could not save your study preferences. Check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="glass-card rounded-3xl p-6 sm:p-8">
      <div className="flex items-center gap-3"><CalendarDays className="text-purple-200"/><h2 className="text-2xl font-black">Build your study routine</h2></div>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">Choose the time and days that fit your week. Your preferences are saved to your account; this does not claim that a lesson schedule has been generated.</p>

      {error && <div role="alert" className="mt-5 rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>}
      {notice && <p role="status" className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-300/5 p-4 text-sm text-emerald-100"><CheckCircle2 size={17}/>{notice}</p>}

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 p-5">
          <label htmlFor="daily-study-minutes" className="block font-bold">Daily study time</label>
          <p className="mt-1 text-sm text-white/45">How much time can you usually set aside?</p>
          <div className="mt-4 flex items-center gap-3">
            <input id="daily-study-minutes" type="number" min={1} max={1440} step={5} value={dailyMinutes} disabled={loading || saving} onChange={(event) => { setDailyMinutes(Number(event.target.value)); setNotice('') }} className="field w-28" />
            <span className="text-sm text-white/55">minutes per study day</span>
          </div>
          <p className="mt-3 text-xs text-white/35">Enter a value from 1 to 1,440 minutes.</p>
        </div>

        <fieldset className="rounded-2xl border border-white/10 p-5" disabled={loading || saving}>
          <legend className="px-1 font-bold">Preferred study days</legend>
          <p className="mt-1 text-sm text-white/45">Choose the days you want to study.</p>
          <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-7">
            {days.map((day) => <label key={day.id} className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border p-3 text-xs font-semibold transition ${selectedDays.includes(day.id) ? 'border-purple-300/40 bg-purple-500/15 text-purple-100' : 'border-white/10 text-white/55 hover:bg-white/5'}`}><input type="checkbox" className="accent-purple-300" checked={selectedDays.includes(day.id)} onChange={() => toggleDay(day.id)} aria-label={day.label}/>{day.label}</label>)}
          </div>
        </fieldset>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-black/15 p-5">
        <h3 className="font-bold">Your preparation subjects</h3>
        {subjects.length ? <p className="mt-2 text-sm leading-6 text-white/55">{subjects.map((subject) => subject.name).join(' · ')}</p> : <p className="mt-2 text-sm text-white/45">No saved subjects were found. You can update your preparation profile from onboarding.</p>}
      </div>



      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 p-5" aria-labelledby="weekly-study-schedule-title">
          <div className="flex items-center gap-2"><CalendarDays className="text-purple-200" size={18} aria-hidden="true"/><h3 id="weekly-study-schedule-title" className="font-bold">Your weekly subject plan</h3></div>
          <p className="mt-2 text-sm leading-6 text-white/45">Subjects rotate across your selected study days. This is a planning aid, not a claim that lessons or question sets are published.</p>
          <ul className="mt-4 space-y-2">{weeklySchedule.map((day) => <li key={day.id} className={`rounded-xl border p-3 ${day.selected ? 'border-purple-300/20 bg-purple-500/[.06]' : 'border-white/5 opacity-60'}`}><div className="flex items-start justify-between gap-3"><span className="text-sm font-semibold">{day.full}</span><span className="text-xs text-white/40">{day.selected ? 'Study day' : 'Rest day'}</span></div>{day.selected && <p className="mt-2 text-sm text-white/55">{day.primary ? day.primary.name : 'Select subjects in your preparation profile'}{day.secondary && day.secondary.id !== day.primary?.id ? ` · ${day.secondary.name}` : ''}</p>}</li>)}</ul>
        </section>
        <section className="rounded-2xl border border-white/10 p-5" aria-labelledby="daily-routine-title">
          <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><ListTodo className="text-purple-200" size={18} aria-hidden="true"/><h3 id="daily-routine-title" className="font-bold">Today's checklist</h3></div><span className="text-xs text-white/40">{completedTasks.length}/{routineTasks.length}</span></div>
          <p className="mt-2 text-sm leading-6 text-white/45">Your checkmarks are saved on this device for today. They do not represent server-verified study activity.</p>
          <ul className="mt-4 space-y-3">{routineTasks.map((task) => { const TaskIcon = task.icon; const checked = completedTasks.includes(task.id); return <li key={task.id} className="rounded-xl border border-white/10 p-3"><label className="flex cursor-pointer items-start gap-3"><input type="checkbox" checked={checked} onChange={() => toggleTask(task.id)} className="mt-1 accent-purple-300"/><span className="min-w-0 flex-1"><span className={`flex items-center gap-2 text-sm font-semibold ${checked ? 'text-white/45 line-through' : 'text-white'}`}><TaskIcon size={15} aria-hidden="true"/>{task.label}</span><span className="mt-1 block text-xs leading-5 text-white/40">{task.detail}</span></span></label></li> })}</ul>
          <button type="button" onClick={resetTodayTasks} disabled={completedTasks.length === 0} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-white/60 hover:bg-white/5 disabled:opacity-40"><RotateCcw size={14} aria-hidden="true"/> Reset today's checklist</button>
        </section>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-white/35">{selectedDays.length} study day{selectedDays.length === 1 ? '' : 's'} selected · {dailyMinutes || 0} minutes per selected day</p>
        <button type="button" onClick={() => void savePlan()} disabled={loading || saving || !Number.isInteger(dailyMinutes) || dailyMinutes < 1 || dailyMinutes > 1440} className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-300 px-4 py-3 text-sm font-bold text-[#120b1c] transition hover:bg-purple-200 disabled:cursor-not-allowed disabled:opacity-40">{saving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} {saving ? 'Saving…' : 'Save study preferences'}</button>
      </div>
      {loading && <p role="status" aria-live="polite" aria-atomic="true" className="mt-4 flex items-center gap-2 text-sm text-white/45"><Loader2 aria-hidden="true" size={15} className="animate-spin"/> Loading your saved preferences…</p>}
    </section>
  )
}
