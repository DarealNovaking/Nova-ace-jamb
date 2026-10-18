import { useEffect, useMemo, useState } from 'react'
import { ace, supabase } from '../lib/supabase'

type Institution = {
  id: string
  name: string
  jamb_code: string | null
  institution_type: string
  ownership: string | null
  state: string | null
  status: string
  source_url: string | null
  provenance: Record<string, unknown> | null
}
type Source = { id: string; title: string; status: string; source_type: string; source_url: string }

export default function AdminReviewOnlyStage() {
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [sources, setSources] = useState<Source[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('Loading catalogue records and approved sources…')

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const [{ data: rows, error: rowsError }, { data: sourceRows, error: sourceError }] = await Promise.all([
          ace.from('institutions').select('id,name,jamb_code,institution_type,ownership,state,status,source_url,provenance').order('name').limit(1000),
          ace.from('catalog_sources').select('id,title,status,source_type,source_url').eq('status', 'approved').order('title'),
        ])
        if (rowsError) throw rowsError
        if (sourceError) throw sourceError
        if (active) {
          setInstitutions((rows ?? []) as Institution[])
          setSources((sourceRows ?? []) as Source[])
          setMessage('Choose one existing institution and inspect the payload before staging.')
        }
      } catch (error) {
        if (active) setMessage(error instanceof Error ? error.message : 'Unable to load review-only staging data.')
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [])

  const selected = institutions.find(row => row.id === selectedId)
  const source = useMemo(() => {
    if (!selected) return undefined
    const sourceId = String(selected.provenance?.catalog_source_id ?? '')
    return sources.find(item => item.id === sourceId && item.status === 'approved')
  }, [selected, sources])

  const stage = async () => {
    if (!selected || !source || !confirmed || busy) return
    setBusy(true)
    setMessage('Submitting one row to the secured staging endpoint…')
    try {
      const externalKey = String(selected.provenance?.external_key ?? selected.jamb_code ?? selected.id)
      const body = {
        source_id: source.id,
        dataset_type: 'institutions',
        rows: [{
          row_number: 1,
          entity_type: 'institution',
          external_key: externalKey,
          payload: {
            jamb_code: selected.jamb_code,
            name: selected.name,
            institution_type: selected.institution_type,
            ownership: selected.ownership,
            state: selected.state,
            source_reference: selected.source_url ?? source.source_url,
            source_url: selected.source_url ?? source.source_url,
            verification_status: selected.status,
            provenance: selected.provenance ?? {},
          },
        }],
        metadata: {
          importer: 'nova-ace-review-only-single-row',
          purpose: 'review-only safety verification',
          institution_id: selected.id,
          source_title: source.title,
        },
      }
      if (body.rows.length !== 1) throw new Error('Safety check failed: exactly one row is required.')
      const { data, error } = await supabase.functions.invoke('catalog-import', { body })
      if (error) throw new Error(error.message)
      if (!data?.batch_id || data?.status !== 'staged' || data?.row_count !== 1) {
        throw new Error('The endpoint did not confirm a one-row staged batch. Stop and inspect the response; no validation or publication was requested by this UI.')
      }
      setMessage(`Review-only staging confirmed. Batch ${data.batch_id} contains one row and remains staged. No validation, approval, or publication was called.`)
      setConfirmed(false)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Review-only staging failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mb-6 rounded-3xl border border-emerald-300/20 bg-emerald-500/[0.04] p-6">
      <p className="text-xs uppercase tracking-[.2em] text-emerald-200/80">Batch 2 · Safe staging</p>
      <h2 className="mt-2 text-2xl font-black">Single-row review-only staging</h2>
      <p className="mt-2 max-w-3xl text-sm text-white/60">This isolated path submits exactly one institution to <code>catalog-import</code> and stops at <code>staged</code>. It does not call validation, approval, or publication. The bulk XLSX importer below is a separate workflow and can publish data.</p>
      <label className="mt-5 block text-sm font-semibold" htmlFor="review-institution">Institution</label>
      <select id="review-institution" value={selectedId} disabled={loading || busy} onChange={event => { setSelectedId(event.target.value); setConfirmed(false) }} className="mt-2 w-full rounded-xl border border-white/10 bg-[#100c1a] p-3 text-white">
        <option value="">Select one institution…</option>
        {institutions.map(row => <option key={row.id} value={row.id}>{row.name} · {row.state ?? 'State unknown'} · {row.status}</option>)}
      </select>
      {selected && <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm">
        <p><span className="text-white/45">Status:</span> {selected.status}</p>
        <p className="mt-1"><span className="text-white/45">External key:</span> {String(selected.provenance?.external_key ?? selected.jamb_code ?? selected.id)}</p>
        <p className="mt-1"><span className="text-white/45">Source:</span> {source ? source.title : 'Blocked — no matching approved source'}</p>
        <p className="mt-3 font-semibold">Payload preview</p>
        <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-black/30 p-3 text-xs text-white/70">{JSON.stringify({ dataset_type: 'institutions', row_count: 1, entity_type: 'institution', name: selected.name, institution_type: selected.institution_type, ownership: selected.ownership, state: selected.state, source_id: source?.id }, null, 2)}</pre>
      </div>}
      <label className="mt-4 flex items-start gap-3 text-sm text-white/70">
        <input type="checkbox" checked={confirmed} disabled={!selected || !source || busy} onChange={event => setConfirmed(event.target.checked)} className="mt-1" />
        I confirm this submits one row for review only. I understand it will not be approved or published by this action.
      </label>
      <button type="button" onClick={() => void stage()} disabled={!selected || !source || !confirmed || loading || busy} className="mt-4 rounded-xl bg-emerald-200 px-5 py-3 font-bold text-black disabled:cursor-not-allowed disabled:opacity-40">{busy ? 'Staging one row…' : 'Stage one row for review only'}</button>
      <p role="status" aria-live="polite" className="mt-4 break-words text-sm text-white/65">{loading ? 'Loading…' : message}</p>
      {institutions.length === 0 && !loading && <p className="mt-2 text-xs text-amber-200/80">No institution records were returned. This path cannot stage until the live catalogue is available.</p>}
    </section>
  )
}
