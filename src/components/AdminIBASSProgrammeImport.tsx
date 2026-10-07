import { useEffect, useMemo, useState } from 'react';
import { ace, supabase } from '../lib/supabase';

type Institution = { id: string; name: string; state: string | null; institution_type: string };
type Result = {
  institutions_requested?: number;
  institutions_mapped?: number;
  institutions_unresolved?: number;
  programmes_discovered?: number;
  utme_rules_safe_to_stage?: number;
  unresolved?: Array<Record<string, unknown>>;
  program_import?: { batch_id?: string; row_count?: number };
  utme_rule_import?: { batch_id?: string; row_count?: number };
  error?: string;
  detail?: string;
};

const SEASON_ID = '23fc8eb7-2d2e-474f-b4db-c0a69f22cd62';
const BATCH_SIZE = 25;

export default function AdminIBASSProgrammeImport() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [offset, setOffset] = useState(0);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Loading institutions…');
  const [last, setLast] = useState<Result | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      setStatus('Sign in with the administrator account.');
      return;
    }
    const { data, error } = await ace.rpc('get_catalog_institutions');
    if (error) {
      setStatus(`Unable to load institutions: ${error.message}`);
      return;
    }
    setInstitutions((data ?? []) as Institution[]);
    setStatus(`Ready: ${data?.length ?? 0} institutions loaded.`);
  }

  const next = useMemo(() => institutions.slice(offset, offset + BATCH_SIZE), [institutions, offset]);
  const totalBatches = Math.ceil(institutions.length / BATCH_SIZE);
  const batchNumber = Math.floor(offset / BATCH_SIZE) + 1;

  async function runNext() {
    if (!next.length || busy) return;
    setBusy(true);
    setLast(null);
    try {
      const ids = next.map((x) => x.id);
      setStatus(`Staging IBASS programmes for institutions ${offset + 1}–${offset + next.length} of ${institutions.length}…`);
      const { data, error } = await supabase.functions.invoke('ibass-catalog-stage', {
        body: { institution_ids: ids, season_id: SEASON_ID },
      });
      if (error) {
        let detail = error.message;
        const ctx = (error as unknown as { context?: Response }).context;
        if (ctx) {
          try {
            const body = await ctx.clone().json();
            detail = body?.detail || body?.error || detail;
          } catch {}
          detail = `HTTP ${ctx.status}: ${detail}`;
        }
        throw new Error(detail);
      }
      const result = data as Result;
      if (result.error) throw new Error(result.detail ? `${result.error}: ${result.detail}` : result.error);

      const publish = async (label: string, batchId?: string, expected?: number) => {
        if (!batchId || !expected) return;
        setStatus(`Validating ${label} batch…`);
        const { data: validation, error: validationError } = await ace.rpc('validate_catalog_batch', { p_batch_id: batchId });
        if (validationError) throw new Error(`${label} validation: ${validationError.message}`);
        if (validation?.error_count) throw new Error(`${label} validation returned ${validation.error_count} error(s).`);
        setStatus(`Approving ${label} batch…`);
        const { error: approvalError } = await ace.rpc('approve_catalog_batch', { p_batch_id: batchId });
        if (approvalError) throw new Error(`${label} approval: ${approvalError.message}`);
        setStatus(`Publishing ${label} batch…`);
        const { data: published, error: publishError } = await ace.rpc('publish_catalog_batch', { p_batch_id: batchId });
        if (publishError) throw new Error(`${label} publication: ${publishError.message}`);
        if (published?.published_rows !== expected) throw new Error(`${label} publication count mismatch: expected ${expected}, got ${published?.published_rows ?? 'unknown'}.`);
      };

      await publish('programme', result.program_import?.batch_id, result.program_import?.row_count);
      await publish('UTME rule', result.utme_rule_import?.batch_id, result.utme_rule_import?.row_count);

      setLast(result);
      setHistory((h) => [
        `Batch ${batchNumber}/${totalBatches}: ${result.programmes_discovered ?? 0} programmes, ${result.utme_rules_safe_to_stage ?? 0} safe UTME rules, ${result.institutions_unresolved ?? 0} unresolved`,
        ...h,
      ]);
      const nextOffset = offset + next.length;
      setOffset(nextOffset);
      setStatus(nextOffset >= institutions.length ? 'All institution batches processed. Run the final live count gate.' : `Batch ${batchNumber}/${totalBatches} published. Ready for the next batch.`);
    } catch (e) {
      setStatus(`Stopped safely: ${e instanceof Error ? e.message : 'IBASS staging failed'}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="glass-card rounded-3xl p-6">
      <p className="text-xs uppercase tracking-[.2em] text-purple-300/70">Batch 2 · Kill 2</p>
      <h2 className="mt-2 text-2xl font-black">JAMB/IBASS Programme + UTME Ingestion</h2>
      <p className="mt-2 max-w-3xl text-sm text-white/50">
        Uses the official IBASS institution catalogue, deterministic name matching, programme endpoints and brochure subject requirements.
        Ambiguous requirements are preserved as unresolved; no guessed combinations are published.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs text-white/40">Institutions</p><p className="mt-1 text-xl font-bold">{institutions.length}</p></div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs text-white/40">Next batch</p><p className="mt-1 text-xl font-bold">{next.length ? `${offset + 1}–${offset + next.length}` : 'Complete'}</p></div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs text-white/40">Progress</p><p className="mt-1 text-xl font-bold">{Math.min(batchNumber, totalBatches || 1)}/{totalBatches || 0}</p></div>
      </div>

      <button
        className="mt-6 rounded-xl bg-white px-5 py-3 text-sm font-bold text-black disabled:cursor-not-allowed disabled:opacity-40"
        disabled={busy || !next.length}
        onClick={() => void runNext()}
      >
        {busy ? 'Processing…' : next.length ? `Run next ${next.length} institutions` : 'All batches processed'}
      </button>

      <p className="mt-4 text-sm text-white/65">{status}</p>

      {last && (
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
          <p><b>Mapped:</b> {last.institutions_mapped ?? 0} · <b>Programmes:</b> {last.programmes_discovered ?? 0} · <b>Safe UTME rules:</b> {last.utme_rules_safe_to_stage ?? 0}</p>
          <p className="mt-1"><b>Unresolved:</b> {last.institutions_unresolved ?? 0}</p>
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm">
          <p className="font-bold">Published batches</p>
          <ul className="mt-2 space-y-1 text-white/60">{history.slice(0, 8).map((x) => <li key={x}>{x}</li>)}</ul>
        </div>
      )}
    </section>
  );
}
