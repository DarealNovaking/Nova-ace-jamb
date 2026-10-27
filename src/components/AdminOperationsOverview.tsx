import { useCallback, useEffect, useRef, useState } from 'react'
import { Activity, AudioLines, BellRing, BrainCircuit, CreditCard, Database, Gift, RefreshCw, Smartphone } from 'lucide-react'
import { ace } from '../lib/supabase'

type Metric = number | null
type Metrics = {
  activeProducts: Metric
  enabledPaymentProviders: Metric
  pendingPayments: Metric
  notificationRecords: Metric
  activeReferralCampaigns: Metric
  approvedKnowledgeSources: Metric
  enabledAiProviders: Metric
  activeFlashcards: Metric
  registeredDevices: Metric
}

const emptyMetrics: Metrics = {
  activeProducts: null,
  enabledPaymentProviders: null,
  pendingPayments: null,
  notificationRecords: null,
  activeReferralCampaigns: null,
  approvedKnowledgeSources: null,
  enabledAiProviders: null,
  activeFlashcards: null,
  registeredDevices: null,
}

async function countRows<T extends { count: number | null; error: unknown }>(query: PromiseLike<T>): Promise<Metric> {
  try {
    const result = await query
    return result.error ? null : result.count
  } catch {
    return null
  }
}

function metricText(value: Metric) {
  return value === null ? 'Unavailable' : value.toLocaleString()
}

export default function AdminOperationsOverview() {
  const [metrics, setMetrics] = useState<Metrics>(emptyMetrics)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [loadError, setLoadError] = useState('')
  const loadRun = useRef(0)

  const load = useCallback(async () => {
    const run = ++loadRun.current
    setLoading(true)
    setLoadError('')
    const [
      activeProducts, enabledPaymentProviders, pendingPayments, notificationRecords,
      activeReferralCampaigns, approvedKnowledgeSources, enabledAiProviders,
      activeFlashcards, registeredDevices,
    ] = await Promise.all([
      countRows(ace.from('products').select('id', { count: 'exact', head: true }).eq('active', true)),
      countRows(ace.from('payment_providers').select('id', { count: 'exact', head: true }).eq('enabled', true)),
      countRows(ace.from('payments').select('id', { count: 'exact', head: true }).eq('status', 'pending')),
      countRows(ace.from('notifications').select('id', { count: 'exact', head: true })),
      countRows(ace.from('referral_campaigns').select('id', { count: 'exact', head: true }).eq('active', true)),
      countRows(ace.from('knowledge_sources').select('id', { count: 'exact', head: true }).eq('active', true).in('rights_status', ['owned', 'licensed', 'permitted'])),
      countRows(ace.from('ai_providers').select('id', { count: 'exact', head: true }).eq('enabled', true)),
      countRows(ace.from('flashcards').select('id', { count: 'exact', head: true }).eq('active', true)),
      countRows(ace.from('devices').select('id', { count: 'exact', head: true })),
    ])
    if (run !== loadRun.current) return
    const next = { activeProducts, enabledPaymentProviders, pendingPayments, notificationRecords, activeReferralCampaigns, approvedKnowledgeSources, enabledAiProviders, activeFlashcards, registeredDevices }
    setMetrics(next)
    const anyAvailable = Object.values(next).some((value) => value !== null)
    setLastUpdated(anyAvailable ? new Date().toISOString() : null)
    if (!anyAvailable) setLoadError('Operational counts could not be loaded. Check your access and retry.')
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
    return () => { loadRun.current += 1 }
  }, [load])

  const cards = [
    { label: 'Active products', value: metrics.activeProducts, detail: 'Products currently listed', icon: Database },
    { label: 'Enabled payment providers', value: metrics.enabledPaymentProviders, detail: metrics.enabledPaymentProviders === 0 ? 'Checkout must remain disabled' : 'Provider configuration count', icon: CreditCard },
    { label: 'Pending payments', value: metrics.pendingPayments, detail: 'Server-side verification required', icon: Activity },
    { label: 'Notification records', value: metrics.notificationRecords, detail: 'No delivery worker is currently listed', icon: BellRing },
    { label: 'Active referral campaigns', value: metrics.activeReferralCampaigns, detail: metrics.activeReferralCampaigns === 0 ? 'No reward target should be shown' : 'Campaign configuration count', icon: Gift },
    { label: 'Rights-cleared knowledge sources', value: metrics.approvedKnowledgeSources, detail: metrics.approvedKnowledgeSources === 0 ? 'Grounded student AI stays disabled' : metrics.approvedKnowledgeSources === null ? 'Readiness unavailable; student AI stays disabled' : 'Active approved sources; provider and request gates still required', icon: BrainCircuit },
    { label: 'Enabled AI providers', value: metrics.enabledAiProviders, detail: 'Provider alone does not enable student AI', icon: BrainCircuit },
    { label: 'Active flashcards', value: metrics.activeFlashcards, detail: 'Only active cards counted', icon: Database },
    { label: 'Registered devices', value: metrics.registeredDevices, detail: 'Device records; not proof of push delivery', icon: Smartphone },
  ]

  return (
    <section aria-labelledby="admin-operations-title" aria-busy={loading} className="mb-8 rounded-3xl border border-purple-300/15 bg-white/[.025] p-5 sm:p-7">
      <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">{loading ? 'Checking operational readiness counts…' : 'Operational readiness check finished.'}</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs uppercase tracking-[.2em] text-purple-200/60">Operational readiness</p><h2 id="admin-operations-title" className="mt-2 text-2xl font-black">Operations command center</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">Read-only counts from existing ACE tables. These indicators do not send notifications, verify payments, qualify referrals, or enable AI services.</p></div>
        <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex min-h-10 w-fit items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/5 disabled:opacity-50"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} aria-hidden="true" /> Refresh status</button>
      </div>
      {loadError && <p role="alert" className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/5 p-3 text-sm text-amber-100">{loadError}</p>}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => { const Icon = card.icon; return <article key={card.label} className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-white/75">{card.label}</p><Icon size={17} className="shrink-0 text-purple-200/70" aria-hidden="true" /></div><p className="mt-3 text-2xl font-black">{loading ? '…' : metricText(card.value)}</p><p className="mt-1 text-xs leading-5 text-white/40">{card.detail}</p></article> })}
      </div>
      <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200/10 bg-amber-200/[.035] p-3 text-xs leading-5 text-amber-100/70"><AudioLines size={15} className="mt-0.5 shrink-0" aria-hidden="true" /><p>Audio content has no dedicated table or delivery service in the inspected schema. Do not publish an audio player or report audio readiness from these counts.</p></div>
      {lastUpdated && <p className="mt-3 text-right text-[11px] text-white/30">Last checked {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(lastUpdated))}</p>}
    </section>
  )
}
