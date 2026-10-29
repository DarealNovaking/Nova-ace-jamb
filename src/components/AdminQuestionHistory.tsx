import { useEffect, useRef, useState } from 'react'
import { listQuestionHistory, restoreQuestion } from '../lib/questionWorkflowService'
import type { QuestionHistory, QuestionRole, QuestionRow } from '../lib/questionWorkflow'

type Props={initial:QuestionRow;userId:string;role:QuestionRole;onClose:()=>void;onRestored:(row:QuestionRow)=>void;onUncertain:()=>void}
const button='min-h-11 rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold disabled:opacity-40'
export default function AdminQuestionHistory({initial,userId,role,onClose,onRestored,onUncertain}:Props) {
  const [history,setHistory]=useState<QuestionHistory|null>(null)
  const [cursors,setCursors]=useState<(number|null)[]>([null])
  const [loading,setLoading]=useState(true)
  const [busy,setBusy]=useState(false)
  const [uncertain,setUncertain]=useState(false)
  const [error,setError]=useState('')
  const [reason,setReason]=useState('')
  const [reload,setReload]=useState(0)
  const alive=useRef(false)
  const writeLock=useRef(false)
  const before=cursors[cursors.length-1]
  useEffect(()=>{alive.current=true;return()=>{alive.current=false}},[])
  useEffect(()=>{
    let active=true;setLoading(true);setError('');setHistory(null)
    void listQuestionHistory(initial.id,before).then(data=>{if(active)setHistory(data)}).catch(()=>{if(active)setError('Version history could not be loaded. Check your access and retry.')}).finally(()=>{if(active)setLoading(false)})
    return()=>{active=false}
  },[initial.id,before,reload])
  const stale=!!history&&history.current_version!==initial.content_version
  const canRestore=!initial.active&&(initial.created_by===userId||role==='admin')
  const disabled=loading||busy||uncertain||stale||!canRestore||!reason.trim()
  async function restore(version:number) {
    if(disabled||writeLock.current||version>=initial.content_version)return
    writeLock.current=true;setBusy(true);setError('')
    try {
      const saved=await restoreQuestion(initial.id,initial.content_version,version,reason)
      if(alive.current)onRestored(saved)
    }catch{
      if(alive.current){setUncertain(true);onUncertain();setError('The restoration could not be confirmed. Close history and refresh question records before retrying. No restored state or publication is assumed.')}
    }finally{if(alive.current)setBusy(false)}
  }
  return <section aria-labelledby="question-history-title" className="mt-6 min-w-0 rounded-2xl border border-purple-300/20 bg-purple-500/5 p-4 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 id="question-history-title" className="text-lg font-bold">Question version history</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">Inspect immutable saved revisions. Restoring older text creates a new private draft, resets approval and requires independent review again.</p></div><button type="button" disabled={busy} className={button} onClick={onClose}>Close history and refresh questions</button></div>
    <p className="mt-3 break-all text-xs text-white/50">Question ID: {initial.id}</p>
    {loading&&<p role="status" className="mt-4 text-sm text-white/60">Loading version history…</p>}
    {busy&&<p role="status" className="mt-4 text-sm text-white/60">Restoring a new private draft…</p>}
    {error&&<div role="alert" className="mt-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-100">{error}{!uncertain&&!busy&&<button type="button" className={`${button} ml-3`} onClick={()=>setReload(value=>value+1)}>Retry version history</button>}</div>}
    {initial.active&&<p className="mt-4 text-sm text-amber-100">Withdraw this published question before restoring older content.</p>}
    {!initial.active&&!canRestore&&<p className="mt-4 text-sm text-amber-100">Only the author or an administrator can restore this question.</p>}
    {stale&&<p role="status" className="mt-4 text-sm text-amber-100">Question changed since the list was loaded. Close history and refresh before restoring.</p>}
    {history&&<>
      <label className="mt-5 block text-sm font-semibold">Reason for restoring<textarea rows={2} maxLength={2000} disabled={busy||uncertain} className="field mt-2" value={reason} onChange={event=>setReason(event.target.value)}/></label>
      <p className="mt-3 text-xs text-white/55">Current revision {history.current_version}. Showing {history.versions.length} saved revisions on this page.</p>
      {!history.versions.length&&<p className="mt-4 text-sm text-white/60">No older revisions on this page.</p>}
      <ol className="mt-4 space-y-4">{history.versions.map(entry=><li key={entry.version} className="min-w-0 rounded-xl border border-white/10 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h4 className="font-bold">Revision {entry.version}</h4><p className="mt-1 text-xs text-white/55">{entry.snapshot.review_status.replaceAll('_',' ')} · <time dateTime={entry.created_at}>{new Date(entry.created_at).toLocaleString()}</time></p></div>{entry.version<initial.content_version&&<button type="button" disabled={disabled} className={button} onClick={()=>void restore(entry.version)}>Restore revision {entry.version}</button>}</div>
        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6">{entry.snapshot.stem.slice(0,360)}{entry.snapshot.stem.length>360?'…':''}</p>
        <details className="mt-3 text-sm"><summary className="cursor-pointer font-semibold text-purple-200">Inspect revision {entry.version}</summary>{entry.snapshot.stem.length>360&&<p className="mt-3 whitespace-pre-wrap break-words">{entry.snapshot.stem}</p>}<ul className="mt-3 space-y-2">{entry.snapshot.options.map(option=><li key={option.key} className="whitespace-pre-wrap break-words">{option.key}. {option.text}</li>)}</ul><p className="mt-3 font-semibold">Correct answer: {entry.snapshot.correct_option_key}</p><p className="mt-2 whitespace-pre-wrap break-words">{entry.snapshot.explanation}</p><p className="mt-3 break-words text-white/70">{entry.snapshot.exam}{entry.snapshot.exam_year?` · ${entry.snapshot.exam_year}`:''} · {entry.snapshot.provenance.source_title} · {entry.snapshot.provenance.author_label}</p><p className="mt-2 whitespace-pre-wrap break-words text-white/70">{entry.snapshot.provenance.rights_evidence}</p>{entry.snapshot.provenance.source_url&&<p className="mt-2 break-all text-white/55">{entry.snapshot.provenance.source_url}</p>}</details>
      </li>)}</ol>
      <nav aria-label="Question history pages" className="mt-5 flex flex-wrap items-center gap-3"><button type="button" className={button} disabled={busy||uncertain||cursors.length===1} onClick={()=>setCursors(values=>values.slice(0,-1))}>Newer revisions</button><span className="text-sm text-white/60">History page {cursors.length}</span><button type="button" className={button} disabled={busy||uncertain||!history.has_next} onClick={()=>setCursors(values=>[...values,history.next_before])}>Older revisions</button></nav>
    </>}
  </section>
}
