import { useState } from 'react';
import * as XLSX from 'xlsx';
import { ace, supabase } from '../lib/supabase';

type Source = { id: string; title: string; status: string; source_type: string };
const MATCHES: Record<string, string[]> = { NUC: ['nuc', 'national universities commission'], NBTE: ['nbte', 'national board for technical education'], NCCE: ['ncce', 'national commission for colleges of education'] };
const text = (v: unknown) => String(v ?? '').trim();
const typeOf = (v: unknown) => { const x=text(v).toLowerCase(); if(x.includes('university')) return 'university'; if(x.includes('polytechnic')) return 'polytechnic'; if(x.includes('college')&&x.includes('education')) return 'college_of_education'; return 'other'; };
const ownerOf = (v: unknown) => { const x=text(v).toLowerCase(); return x==='federal'||x==='state'||x==='private'?x:'other'; };
const sourceFor = (sources: Source[], key: string) => sources.find(s=>s.status==='approved'&&MATCHES[key].some(t=>s.title.toLowerCase().includes(t)));

export default function AdminCatalogueImport({ onMessage }:{onMessage?:(message:string)=>void}) {
  const [busy,setBusy]=useState(false),[status,setStatus]=useState('Ready'),[progress,setProgress]=useState(0),[errors,setErrors]=useState<string[]>([]);
  const stop=(m:string)=>{setStatus(m);setErrors(e=>[...e,m]);onMessage?.(m)};
  const run=async(file:File)=>{
    setBusy(true);setProgress(0);setErrors([]);
    try{
      const {data:sd}=await supabase.auth.getSession(); if(!sd.session) throw new Error('Sign in with the administrator account before importing.');
      const {data:isAdmin,error:roleError}=await ace.rpc('is_admin'); if(roleError||!isAdmin) throw new Error('Administrator access is required.');
      setStatus('Reading workbook…');
      const wb=XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:true}), sheet=wb.Sheets.INSTITUTIONS;
      if(!sheet) throw new Error('The workbook must contain an INSTITUTIONS sheet.');
      const raw=XLSX.utils.sheet_to_json<Record<string,unknown>>(sheet,{defval:''});
      if(raw.length!==791) throw new Error(`Preflight stopped: expected 791 institution rows, found ${raw.length}.`);
      const ids=new Set<string>(),names=new Set<string>();
      const rows=raw.map((r,i)=>{const external_key=text(r['Institution ID']),name=text(r['Institution Name']),institution_type=typeOf(r['Institution Type']),sourceAuthority=text(r['Source Authority']); if(!external_key||!name) throw new Error(`Preflight row ${i+2}: Institution ID and Institution Name are required.`); if(ids.has(external_key.toLowerCase())) throw new Error(`Preflight row ${i+2}: duplicate Institution ID ${external_key}.`); if(names.has(name.toLowerCase())) throw new Error(`Preflight row ${i+2}: duplicate institution name ${name}.`); if(institution_type==='other') throw new Error(`Preflight row ${i+2}: unsupported institution type.`); ids.add(external_key.toLowerCase());names.add(name.toLowerCase()); return {row_number:i+2,entity_type:'institution',external_key,sourceAuthority,payload:{jamb_code:null,name,institution_type,ownership:ownerOf(r['Ownership']),state:text(r['State'])||null,verification_status:text(r['Verification Status'])||null,source_reference:text(r['Source / Reference'])||null,last_verified:text(r['Last Verified'])||null,notes:text(r['Notes'])||null}};});
      const groups:Record<string,typeof rows>={NUC:[],NBTE:[],NCCE:[]};
      for(const r of rows){const a=r.sourceAuthority.toLowerCase(),k=a.includes('nuc')?'NUC':a.includes('nbte')?'NBTE':a.includes('ncce')?'NCCE':'';if(!k) throw new Error(`Preflight row ${r.row_number}: unknown source authority.`);groups[k].push(r)}
      if(groups.NUC.length!==328||groups.NBTE.length!==199||groups.NCCE.length!==264) throw new Error(`Preflight stopped: expected NUC 328, NBTE 199, NCCE 264; got NUC ${groups.NUC.length}, NBTE ${groups.NBTE.length}, NCCE ${groups.NCCE.length}.`);
      const {data:sources,error:se}=await ace.from('catalog_sources').select('id,title,status,source_type').order('title'); if(se) throw se;
      for(const [index,[key,group]] of (Object.entries(groups) as [string,typeof rows][]).entries()){
        const source=sourceFor(sources as Source[],key); if(!source) throw new Error(`No approved ${key} catalogue source is registered.`);
        const body={source_id:source.id,dataset_type:'institutions',rows:group.map(({sourceAuthority:_,...r})=>r),metadata:{importer:'nova-ace-admin-catalogue-import',workbook:file.name,authority:key,expected_rows:group.length}};
        const bytes=new TextEncoder().encode(JSON.stringify(body)).byteLength;if(bytes>=3500000) throw new Error(`${key} payload is too large (${bytes} bytes); stopped before submission.`);
        setStatus(`Staging ${group.length} ${key} institutions…`); const {data:staged,error:ie}=await supabase.functions.invoke('catalog-import',{body}); if(ie) throw new Error(`${key} staging failed: ${ie.message}`); if(!staged?.batch_id) throw new Error(`${key} staging returned no batch ID.`);
        setStatus(`Validating ${key} batch…`); const {data:v,error:ve}=await ace.rpc('validate_catalog_batch',{p_batch_id:staged.batch_id}); if(ve) throw new Error(`${key} validation failed: ${ve.message}`); if(v?.error_count) throw new Error(`${key} validation found ${v.error_count} error(s); batch remains unpublished.`);
        setStatus(`Approving ${key} batch…`); const {error:ae}=await ace.rpc('approve_catalog_batch',{p_batch_id:staged.batch_id}); if(ae) throw new Error(`${key} approval failed: ${ae.message}`);
        setStatus(`Publishing ${key} batch…`); const {data:p,error:pe}=await ace.rpc('publish_catalog_batch',{p_batch_id:staged.batch_id}); if(pe) throw new Error(`${key} publication failed: ${pe.message}`); if(p?.published_rows!==group.length) throw new Error(`${key} publication count mismatch.`);
        setProgress(Math.round(((index+1)/3)*100));
      }
      const {count,error:ce}=await ace.from('institutions').select('id',{count:'exact',head:true}); if(ce) throw ce; if(count!==791) throw new Error(`Post-import verification failed: expected 791 institutions, database reports ${count??'unknown'}.`);
      setStatus('Institution import complete and verified: 791 records.');onMessage?.('Institution import complete and verified: 791 records.');
    }catch(e){stop(e instanceof Error?e.message:'Institution import failed.')}finally{setBusy(false)}
  };
  return <section className="glass-card rounded-3xl p-6"><div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div><p className="text-xs uppercase tracking-[.2em] text-purple-300/70">Batch 2 · Catalogue Engine</p><h2 className="mt-2 text-2xl font-black">Authoritative institution importer</h2><p className="mt-2 max-w-2xl text-sm text-white/50">Preflights the 791-row Phase 1 workbook, separates NUC/NBTE/NCCE authority, stages through the secured Edge Function, validates, approves, publishes and verifies the database count.</p></div><label className={`shrink-0 cursor-pointer rounded-xl bg-white px-4 py-3 text-sm font-bold text-black ${busy?'pointer-events-none opacity-50':''}`}>{busy?'Importing…':'Choose XLSX'}<input className="hidden" type="file" accept=".xlsx,.xls" disabled={busy} onChange={e=>{const f=e.target.files?.[0];if(f)void run(f);e.currentTarget.value=''}}/></label></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-purple-500 transition-all" style={{width:`${progress}%`}}/></div><p className="mt-3 text-sm text-white/65">{status}</p>{errors.length>0&&<div className="mt-5 rounded-xl border border-red-300/20 bg-red-500/10 p-4 text-sm text-red-100"><b>Stopped safely</b><ul className="mt-2 list-disc pl-5">{errors.slice(-5).map((e,i)=><li key={`${e}-${i}`}>{e}</li>)}</ul></div>}</section>;
}
