import { useCallback, useEffect, useState } from 'react'
import { Bell, CheckCheck, Loader2, RefreshCw, Settings2 } from 'lucide-react'
import { ace, supabase } from '../lib/supabase'

type NotificationRow = {
  id: string
  type: string
  title: string
  body: string
  data: Record<string, unknown>
  scheduled_at: string | null
  sent_at: string | null
  read_at: string | null
  created_at: string
}

type Preferences = {
  in_app: boolean
  push: boolean
  email: boolean
  marketing: boolean
  categories: Record<string, unknown>
}

const defaultPreferences: Preferences = {
  in_app: true,
  push: true,
  email: true,
  marketing: false,
  categories: {},
}

function friendlyDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export default function StudentNotifications() {
  const [items, setItems] = useState<NotificationRow[]>([])
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [markingId, setMarkingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [showSettings, setShowSettings] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    setNotice('')
    try {
      const { data: auth, error: authError } = await supabase.auth.getUser()
      if (authError) throw authError
      if (!auth.user) throw new Error('Authentication required')

      const [notificationResult, preferenceResult] = await Promise.all([
        ace.from('notifications')
          .select('id,type,title,body,data,scheduled_at,sent_at,read_at,created_at')
          .eq('user_id', auth.user.id)
          .not('sent_at', 'is', null)
          .order('created_at', { ascending: false })
          .limit(30),
        ace.from('notification_preferences')
          .select('in_app,push,email,marketing,categories')
          .eq('user_id', auth.user.id)
          .maybeSingle(),
      ])
      if (notificationResult.error) throw notificationResult.error
      if (preferenceResult.error) throw preferenceResult.error
      setItems((notificationResult.data ?? []) as NotificationRow[])
      setPreferences(preferenceResult.data ? { ...defaultPreferences, ...preferenceResult.data } as Preferences : defaultPreferences)
    } catch {
      setError('We could not load your notifications. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  async function markRead(item: NotificationRow) {
    if (item.read_at) return
    setMarkingId(item.id)
    setError('')
    setNotice('')
    try {
      const readAt = new Date().toISOString()
      const { error: updateError } = await ace.from('notifications')
        .update({ read_at: readAt })
        .eq('id', item.id)
        .eq('user_id', item.user_id ?? '')
      if (updateError) throw updateError
      setItems((current) => current.map((row) => row.id === item.id ? { ...row, read_at: readAt } : row))
    } catch {
      setError('We could not mark that notification as read. Please try again.')
    } finally {
      setMarkingId(null)
    }
  }

  async function savePreferences() {
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const { data: auth, error: authError } = await supabase.auth.getUser()
      if (authError) throw authError
      if (!auth.user) throw new Error('Authentication required')
      const { error: saveError } = await ace.from('notification_preferences').upsert({
        user_id: auth.user.id,
        in_app: preferences.in_app,
        push: preferences.push,
        email: preferences.email,
        marketing: preferences.marketing,
        categories: preferences.categories,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      if (saveError) throw saveError
      setNotice('Your notification preferences were saved.')
    } catch {
      setError('We could not save your notification preferences. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const unreadCount = items.filter((item) => !item.read_at).length

  return (
    <section aria-labelledby="notifications-title" className="glass-card mt-8 rounded-3xl p-6 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-purple-500/15 text-purple-200"><Bell size={21} aria-hidden="true" /></span>
          <div>
            <h2 id="notifications-title" className="text-xl font-black">Notifications</h2>
            <p className="mt-1 text-sm text-white/45">{unreadCount ? `${unreadCount} unread` : 'Your personal updates and announcements'}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setShowSettings((value) => !value)} aria-expanded={showSettings} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/5"><Settings2 size={16} aria-hidden="true" /> Preferences</button>
          <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/5 disabled:opacity-50"><RefreshCw size={15} aria-hidden="true" className={loading ? 'animate-spin' : ''} /> Refresh</button>
        </div>
      </div>

      {error && <p role="alert" className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-100">{error}</p>}
      {notice && <p role="status" className="mt-4 rounded-xl border border-emerald-300/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">{notice}</p>}

      {showSettings && <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5">
        <h3 className="font-bold">Notification preferences</h3>
        <p className="mt-1 text-xs leading-5 text-white/45">These preferences are saved to your account. Email and push delivery depend on server-side integrations being configured.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {([
            ['in_app', 'In-app notifications', 'Show updates in your ACE inbox.'],
            ['email', 'Email notifications', 'Allow eligible account emails.'],
            ['marketing', 'Product announcements', 'Allow optional product news.'],
          ] as const).map(([key, label, detail]) => <label key={key} className="flex items-start gap-3 rounded-xl border border-white/5 p-3">
            <input type="checkbox" checked={preferences[key]} onChange={(event) => setPreferences((current) => ({ ...current, [key]: event.target.checked }))} className="mt-1 accent-purple-300" />
            <span><span className="block text-sm font-semibold">{label}</span><span className="mt-1 block text-xs leading-5 text-white/40">{detail}</span></span>
          </label>)}
          <div className="flex items-start gap-3 rounded-xl border border-white/5 p-3 opacity-70">
            <input type="checkbox" checked={preferences.push} disabled aria-label="Push notifications unavailable" className="mt-1 accent-purple-300" />
            <span><span className="block text-sm font-semibold">Push notifications</span><span className="mt-1 block text-xs leading-5 text-white/40">Push delivery is not configured yet; this saved preference does not enable device push.</span></span>
          </div>
        </div>
        <button type="button" onClick={() => void savePreferences()} disabled={saving} className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-purple-300 px-4 py-2 text-sm font-bold text-[#120b1c] disabled:opacity-50">{saving && <Loader2 size={15} className="animate-spin" />} Save preferences</button>
      </div>}

      {loading ? <div className="grid min-h-24 place-items-center text-sm text-white/45"><Loader2 className="animate-spin" size={20} aria-label="Loading notifications" /></div>
        : items.length ? <ul className="mt-5 space-y-3">{items.map((item) => <li key={item.id} className={`rounded-2xl border p-4 ${item.read_at ? 'border-white/5 bg-white/[.02]' : 'border-purple-300/20 bg-purple-500/[.06]'}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">{item.title}</h3>{!item.read_at && <span className="rounded-full bg-purple-300/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-100">New</span>}</div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/60">{item.body}</p><p className="mt-2 text-xs text-white/35">{friendlyDate(item.sent_at ?? item.created_at)}</p></div>
            {!item.read_at && <button type="button" onClick={() => void markRead(item)} disabled={markingId === item.id} className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-white/10 px-2.5 py-2 text-xs font-semibold hover:bg-white/5 disabled:opacity-50">{markingId === item.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />} Mark read</button>}
          </div>
        </li>)}</ul>
        : <div className="mt-5 rounded-2xl border border-white/5 bg-white/[.025] p-5"><p className="font-semibold">You’re all caught up.</p><p className="mt-2 text-sm leading-6 text-white/45">No sent notifications are available for your account yet. New updates will appear here when the notification delivery service publishes them.</p></div>}
    </section>
  )
}
