import { useEffect, useState } from 'react';
import { ace, supabase } from '../lib/supabase';

type Source = { id: string; title: string; status: string; source_type: string };
type InstitutionType = 'university' | 'polytechnic' | 'college_of_education';
type Ownership = 'federal' | 'state' | 'private' | 'other';

const TYPES: { value: InstitutionType; label: string }[] = [
  { value: 'university', label: 'University' },
  { value: 'polytechnic', label: 'Polytechnic' },
  { value: 'college_of_education', label: 'College of Education' },
];
const OWNERSHIP: Ownership[] = ['federal', 'state', 'private', 'other'];

export default function AdminCatalogueReviewOnly({ onMessage }: { onMessage?: (message: string) => void }) {
  const [sources, setSources] = useState<Source[]>([]);
  const [sourceId, setSourceId] = useState('');
  const [name, setName] = useState('');
  const [externalKey, setExternalKey] = useState('');
  const [institutionType, setInstitutionType] = useState<InstitutionType>('university');
  const [ownership, setOwnership] = useState<Ownership>('other');
  const [state, setState] = useState('');
  const [loadingSources, setLoadingSources] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Choose an approved source and enter one institution.');
  const [batchId, setBatchId] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingSources(true);
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!sessionData.session) throw new Error('Sign in through the catalogue administrator account first.');
        const { data: isAdmin, error: roleError } = await ace.rpc('is_admin');
        if (roleError || !isAdmin) throw new Error('Administrator/editor access is required.');
        const { data, error } = await ace
          .from('catalog_sources')
          .select('id,title,status,source_type')
          .in('status', ['reviewed', 'approved'])
          .order('title');
        if (error) throw error;
        if (!cancelled) {
          const eligible = (data ?? []) as Source[];
          setSources(eligible);
          setSourceId(eligible[0]?.id ?? '');
          if (!eligible.length) setStatus('No reviewed or approved catalogue sources are available. Nothing was staged.');
        }
      } catch (error) {
        if (!cancelled) setStatus(error instanceof Error ? error.message : 'Unable to load approved sources.');
      } finally {
        if (!cancelled) setLoadingSources(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, []);

  const selectedSource = sources.find((source) => source.id === sourceId);
  const canStage = !busy && !loadingSources && !!selectedSource && !!name.trim() && !!state.trim() && !batchId;

  const stageOne = async () => {
    if (!canStage || !selectedSource) return;
    setBusy(true);
    setStatus('Checking administrator access…');
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!sessionData.session) throw new Error('Your session has expired. Sign in again.');
      const { data: isAdmin, error: roleError } = await ace.rpc('is_admin');
      if (roleError || !isAdmin) throw new Error('Administrator/editor access is required.');

      // Deliberately submit exactly one row. This workflow must never validate, approve, or publish.
      const body = {
        source_id: selectedSource.id,
        dataset_type: 'institutions',
        rows: [{
          row_number: 1,
          entity_type: 'institution',
          external_key: externalKey.trim() || null,
          payload: {
            jamb_code: null,
            name: name.trim(),
            institution_type: institutionType,
            ownership,
            state: state.trim(),
            verification_status: 'pending_review',
            source_reference: null,
            last_verified: null,
            notes: 'Staged through the single-record review-only workflow; verify against the source before approval.',
          },
        }],
        metadata: {
          importer: 'nova-ace-review-only-single-institution',
          review_only: true,
          requested_row_count: 1,
        },
      };

      if (body.rows.length !== 1) throw new Error('Safety check failed: exactly one row is required.');
      setStatus('Staging one institution for review…');
      const { data, error } = await supabase.functions.invoke('catalog-import', { body });
      if (error) throw new Error(`Staging request failed: ${error.message}`);
      if (!data?.batch_id || data.status !== 'staged' || data.row_count !== 1) {
        throw new Error('The staging response did not confirm one staged row. Check the import batches before retrying to avoid a duplicate.');
      }
      setBatchId(String(data.batch_id));
      const message = `One institution staged for review. Batch ID: ${data.batch_id}. No validation, approval, or publication was requested.`;
      setStatus(message);
      onMessage?.(message);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to stage the institution.';
      setStatus(message);
      onMessage?.(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="glass-card rounded-3xl p-6" aria-labelledby="review-only-title">
      <p className="text-xs uppercase tracking-[.2em] text-purple-300/70">Batch 2 · Safe review workflow</p>
      <h2 id="review-only-title" className="mt-2 text-2xl font-black">Stage one institution for review</h2>
      <p className="mt-2 max-w-2xl text-sm text-white/55">
        This workflow submits exactly one institution to a new review batch. It stops after staging and does not validate, approve, or publish records.
      </p>

      {loadingSources ? <p className="mt-5 text-sm text-white/60">Checking session and approved catalogue sources…</p> : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm text-white/70 sm:col-span-2">
            Reviewed/approved source
            <select className="field mt-2 w-full" value={sourceId} onChange={(event) => setSourceId(event.target.value)} disabled={busy || !!batchId || !sources.length}>
              {sources.map((source) => <option key={source.id} value={source.id}>{source.title} · {source.status}</option>)}
            </select>
          </label>
          <label className="block text-sm text-white/70 sm:col-span-2">
            Institution name *
            <input className="field mt-2 w-full" value={name} onChange={(event) => setName(event.target.value)} maxLength={200} required disabled={busy || !!batchId} />
          </label>
          <label className="block text-sm text-white/70">
            External identifier (optional)
            <input className="field mt-2 w-full" value={externalKey} onChange={(event) => setExternalKey(event.target.value)} maxLength={100} disabled={busy || !!batchId} />
          </label>
          <label className="block text-sm text-white/70">
            Institution type
            <select className="field mt-2 w-full" value={institutionType} onChange={(event) => setInstitutionType(event.target.value as InstitutionType)} disabled={busy || !!batchId}>
              {TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
            </select>
          </label>
          <label className="block text-sm text-white/70">
            Ownership
            <select className="field mt-2 w-full" value={ownership} onChange={(event) => setOwnership(event.target.value as Ownership)} disabled={busy || !!batchId}>
              {OWNERSHIP.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label className="block text-sm text-white/70">
            State / FCT *
            <input className="field mt-2 w-full" value={state} onChange={(event) => setState(event.target.value)} maxLength={100} required disabled={busy || !!batchId} />
          </label>
        </div>
      )}

      <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="text-xs uppercase tracking-wider text-white/40">Submission preview</p>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div><dt className="text-white/40">Rows</dt><dd className="font-bold">1 institution only</dd></div>
          <div><dt className="text-white/40">Source</dt><dd>{selectedSource?.title ?? 'No eligible source'}</dd></div>
          <div><dt className="text-white/40">Institution</dt><dd>{name.trim() || 'Not entered'}</dd></div>
          <div><dt className="text-white/40">Type / ownership</dt><dd>{institutionType.replaceAll('_', ' ')} · {ownership}</dd></div>
          <div><dt className="text-white/40">State / FCT</dt><dd>{state.trim() || 'Not entered'}</dd></div>
          <div><dt className="text-white/40">Post-submit actions</dt><dd>None — stop at staged</dd></div>
        </dl>
      </div>

      <button type="button" onClick={() => void stageOne()} disabled={!canStage} className="mt-5 rounded-xl bg-white px-5 py-3 font-bold text-black disabled:cursor-not-allowed disabled:opacity-40">
        {busy ? 'Staging…' : batchId ? 'Staged — locked against duplicate submission' : 'Stage one record for review'}
      </button>
      <p role="status" aria-live="polite" className="mt-3 break-words text-sm text-white/65">{status}</p>
      {batchId && <p className="mt-2 break-all text-xs text-purple-200">Review batch ID: {batchId}</p>}
    </section>
  );
}
