export type StudySession = {
  date: string
  label: string
  subjectId: string
  subjectName: string
  minutes: number
}

type StudySubject = { id: string; name: string }

// Preview only: this does not save study-plan items or claim adaptive recommendations.
// Use local calendar dates (at noon) to avoid UTC day-boundary shifts.
const weekdayIds = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

export function buildStudySchedule(
  subjects: StudySubject[],
  preferredDays: string[],
  dailyMinutes: number,
  start: Date = new Date(),
  daysAhead = 14,
): StudySession[] {
  if (!subjects.length || !Number.isInteger(dailyMinutes) || dailyMinutes < 1 || dailyMinutes > 1440 || !Number.isFinite(start.getTime())) return []
  const activeDays = new Set(preferredDays.filter((day) => weekdayIds.includes(day)))
  if (!activeDays.size) return []
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 12)
  const sessions: StudySession[] = []
  const count = Math.max(0, Math.min(31, Math.floor(daysAhead)))
  for (let offset = 0; offset < count; offset += 1) {
    const date = new Date(startDay)
    date.setDate(startDay.getDate() + offset)
    if (!activeDays.has(weekdayIds[date.getDay()])) continue
    const subject = subjects[sessions.length % subjects.length]
    const yyyy = String(date.getFullYear())
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    sessions.push({
      date: [yyyy, mm, dd].join('-'),
      label: date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
      subjectId: subject.id,
      subjectName: subject.name,
      minutes: dailyMinutes,
    })
  }
  return sessions
}
