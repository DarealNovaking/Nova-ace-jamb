import { useEffect, useState } from 'react';
import { ace, supabase } from '../lib/supabase';
type Institution = { id: string; name: string; state?: string | null; institution_type?: string | null };
type Season = { id: string; name: string; code: string; exam_year: number; status: string };
type StageResult = { institutions_requested?: number; institutions_mapped?: number; programmes_discovered?: number; utme_rules_safe_to_stage?: number; unresolved?: Array<{name?:string;reason?:string;programme_title?:string;utme_subject_requirements?:string}>; program_import?: {batch_id?:string;status?:string;row_count?:number}|null; utme_rule_import?: {batch_id?:string;status?:string;row_count?:number}|null; error?: string; detail?: string };
export default function AdminIbassStage() {
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[allowed,setAllowed]=useState(false);
 const [institutions,setInstitutions]=useState<Institution[]>([]),[seasons,setSeasons]=useState<Season[]>([]);
 const [seasonId,setSeasonId]=useState(''),[selected,setSelected]=useState<string[]>([]),[filter,setFilter]=useState('');
 const [message,setMessage]=useState('Loading admin access and catalogue options…'),[result,setResult]=useState<StageResult|null>(null);
 useEffect(()=>{let live=true;(async()=>{try{
  const {data:sessionData}=await supabase.auth.getSession();if(!sessionData.session)throw new Error('Sign in with the administrator account first.');
  const {data:isAdmin,error:roleError}=await ace.rpc('is_admin');if(roleError||isAdmin!==true)throw new Error('Administrator access is required.');
  const [{data:inst,error:instError},{data:season,error:seasonError}]=await Promise.all([ace.rpc('get_catalog_institutions'),ace.from('exam_seasons').select('id,name,code,exam_year,status').neq('status','archived').order('exam_year',{ascending:false})]);
  if(instError)throw instError;if(seasonError)throw seasonError;if(!live)return;
  setAllowed(true);setInstitutions((inst??[]) as Institution[]);setSeasons((season??[]) as Season[]);
  const preferred=(season??[]).find((s:any)=>s.exam_year===new Date().getFullYear()+1&&s.status!=='archived')??(season??[]).find((s:any)=>s.status!=='archived');if(preferred)setSeasonId(preferred.id);
  setMessage('Choose an exam season and up to 25 institutions. This action stages data for review only.');
 }catch(e){if(live)setMessage(e instanceof Error?e.message:'Could not load staging options.');}finally{if(live)setLoading(false)}})();return()=>{live=false}},[]);
 const toggle=(id:string)=>setSelected(current=>current.includes(id)?current.filter(x=>x!==id):current.length>=25?current:[...current,id]);
 const run=async()=>{setBusy(true);setResult(null);try{
  const {data:sessionData}=await supabase.auth.getSession();if(!sessionData.session)throw new Error('Your session expired. Sign in again.');
  const {data:isAdmin,error:roleError}=await ace.rpc('is_admin');if(roleError||isAdmin!==true)throw new Error('Administrator access could not be verified.');
  if(!seasonId)throw new Error('Select an exam season.');if(!selected.length||selected.length>25)throw new Error('Select between 1 and 25 institutions.');
  setMessage('Fetching official JAMB/IBASS data. No rows will be approved or published automatically.');
  const {data,error}=await supabase.functions.invoke('ibass-catalog-stage',{body:{institution_ids:selected,season_id:seasonId}});if(error)throw new Error(error.message||'IBASS staging request failed.');
  const payload=data as StageResult;if(payload?.error)throw new Error(payload.detail?payload.error+': '+payload.detail:payload.error);
  setResult(payload);setMessage('Staging request finished. Review the batch IDs and unresolved requirements below; nothing was approved or published.');
 }catch(e){setMessage(e instanceof Error?e.message:'Staging failed safely.');}finally{setBusy(false)}};
 const visible=institutions.filter(i=>i.name.toLowerCase().includes(filter.toLowerCase())||(i.state??'').toLowerCase().includes(filter.toLowerCase()));
 return <section className="glass-card mt-6 rounded-3xl p-6"><p className="text-xs uppercase tracking-[.2em] text-purple-300/70">Batch 2 · IBASS</p><h2 className="mt-2 text-2xl font-black">Stage programmes &amp; UTME requirements</h2><p className="mt-2 text-sm text-white/55">Fetches JAMB/IBASS source data for selected institutions. It only stages records; validation, review, approval and publication remain separate gates.</p><p className="mt-4 text-sm text-white/75">{message}</p>
 {allowed&&!loading&&<div className="mt-5 space-y-4"><label className="block text-sm font-semibold">Exam season<select className="field mt-2" value={seasonId} onChange={e=>setSeasonId(e.target.value)}><option value="">Select season</option>{seasons.map(s=><option key={s.id} value={s.id}>{s.name} · {s.status}</option>)}</select></label>
 <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><label className="text-sm font-semibold">Institutions ({selected.length}/25)<input className="field mt-2" value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Filter by name or state"/></label><button className="rounded-xl border border-white/15 px-3 py-2 text-sm" onClick={()=>setSelected([])} disabled={!selected.length||busy}>Clear selection</button></div>
 <div className="max-h-64 overflow-y-auto rounded-xl border border-white/10">{visible.map(i=><label key={i.id} className="flex cursor-pointer items-center gap-3 border-b border-white/5 px-3 py-2 text-sm last:border-0"><input type="checkbox" checked={selected.includes(i.id)} disabled={busy||(!selected.includes(i.id)&&selected.length>=25)} onChange={()=>toggle(i.id)}/><span>{i.name}<span className="ml-2 text-white/35">{i.state??''}</span></span></label>)}</div>
 <button className="w-full rounded-xl bg-white px-4 py-3 font-bold text-black disabled:opacity-50" disabled={busy||!seasonId||!selected.length} onClick={()=>void run()}>{busy?'Staging source data…':'Stage '+selected.length+' institution(s)'}</button></div>}
 {result&&<div className="mt-5 space-y-3 rounded-xl border border-white/10 bg-black/20 p-4 text-sm"><h3 className="font-bold">Staging summary</h3><p>Institutions mapped: {result.institutions_mapped??0}/{result.institutions_requested??selected.length}; programmes discovered: {result.programmes_discovered??0}; UTME rules staged: {result.utme_rules_safe_to_stage??0}; unresolved items: {result.unresolved?.length??0}.</p>
 {[['Programme batch',result.program_import],['UTME-rule batch',result.utme_rule_import]].map(([label,batch]:any)=><p key={label}>{label}: {batch?.batch_id??'No rows staged'}{batch?.row_count!==undefined?' · '+batch.row_count+' rows · '+(batch.status??'staged'):''}</p>)}
 {(result.unresolved??[]).length>0&&<details><summary className="cursor-pointer font-semibold">Review unresolved source requirements</summary><ul className="mt-2 list-disc space-y-1 pl-5">{result.unresolved!.slice(0,100).map((u,i)=><li key={i}>{u.name??u.programme_title??'Unresolved item'} — {u.reason??'Needs review'}{u.utme_subject_requirements?': '+u.utme_subject_requirements:''}</li>)}</ul></details>}</div>}</section>;
}