import {useCallback,useEffect,useState} from 'react'
import {AlertTriangle,Loader2,RefreshCw} from 'lucide-react'
import {listQuestionReports,manageQuestionReport,type QuestionReport,type QuestionReportStatus} from '../lib/questionReportService'
const button='min-h-10 rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold disabled:opacity-40'
const statuses:QuestionReportStatus[]=['open','triaged','resolved','dismissed']
const labels:Record<QuestionReportStatus,string>={open:'Open',triaged:'Under review',resolved:'Resolved',dismissed:'Dismissed'}
export default function AdminQuestionReports(){
 const [status,setStatus]=useState<QuestionReportStatus>('open')
 const [reports,setReports]=useState<QuestionReport[]>([])
 const [notes,setNotes]=useState<Record<string,string>>({})
 const [loading,setLoading]=useState(true)
 const [busy,setBusy]=useState<string|null>(null)
 const [error,setError]=useState('')
 const [notice,setNotice]=useState('')
 const refresh=useCallback(async()=>{
  setLoading(true);setError('')
  try{setReports(await listQuestionReports(status))}
  catch{setReports([]);setError('Question reports could not be loaded. Confirm administrator access and retry.')}
  finally{setLoading(false)}
 },[status])
 useEffect(()=>{void refresh()},[refresh])
 async function decide(report:QuestionReport,action:'triage'|'resolve'|'dismiss'){
  const note=(notes[report.id]??'').trim()
  if(note.length<8){setError('Add at least eight characters explaining the moderation decision.');return}
  setBusy(report.id);setError('');setNotice('')
  try{
   await manageQuestionReport(report.id,action,note)
   setNotice(action==='triage'?'Report moved to review.':action==='resolve'?'Report marked resolved.':'Report dismissed.')
   await refresh()
  }catch{setError('The report decision could not be confirmed. Refresh before retrying.')}
  finally{setBusy(null)}
 }
 return <section aria-labelledby="admin-question-reports-heading" className="mt-6 rounded-3xl border border-white/10 bg-white/[.025] p-5 sm:p-7">
  <div className="flex flex-wrap items-start justify-between gap-4">
   <div><div className="flex items-center gap-2"><AlertTriangle className="text-amber-200" size={20} aria-hidden="true"/><h2 id="admin-question-reports-heading" className="text-xl font-black">Student question reports</h2></div>
    <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">Review reports tied to a student's own exam attempt and the exact question revision they saw. Reporting never changes publication automatically.</p></div>
   <button type="button" disabled={loading||busy!==null} onClick={()=>void refresh()} className={`${button} inline-flex items-center gap-2`}><RefreshCw size={15} aria-hidden="true"/>Refresh reports</button>
  </div>
  <label className="mt-4 block max-w-xs text-sm font-semibold text-white/70">Report status
   <select className="field mt-2" value={status} onChange={event=>setStatus(event.target.value as QuestionReportStatus)} disabled={loading||busy!==null}>
    {statuses.map(value=><option key={value} value={value}>{labels[value]}</option>)}
   </select>
  </label>
  {error&&<p role="alert" className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-100">{error}</p>}
  {notice&&<p role="status" className="mt-4 rounded-xl bg-purple-500/10 p-3 text-sm text-purple-100">{notice}</p>}
  {loading&&<p role="status" className="mt-4 flex items-center gap-2 text-sm text-white/60"><Loader2 size={16} className="animate-spin" aria-hidden="true"/>Loading reports…</p>}
  {!loading&&!reports.length&&<div className="mt-4 rounded-xl border border-dashed border-white/15 p-5"><p className="font-semibold">No {labels[status].toLowerCase()} reports</p><p className="mt-1 text-sm text-white/60">New student reports will appear here after submission.</p></div>}
  <ul className="mt-4 space-y-3">{reports.map(report=><li key={report.id} className="rounded-xl border border-white/10 p-4">
   <div className="flex flex-wrap items-center gap-2 text-xs text-white/55"><span className="rounded-lg border border-white/15 px-2 py-1">{report.reason.replaceAll('_',' ')}</span><span>Revision {report.question_version}</span><span>{new Date(report.created_at).toLocaleString()}</span></div>
   <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-white/85">{report.details}</p>
   <p className="mt-2 break-all text-xs text-white/45">Question {report.question_id} · Attempt {report.attempt_id} · Reporter {report.reporter_id}</p>
   <label className="mt-3 block text-xs font-semibold text-white/70">Moderation note
    <textarea rows={2} maxLength={1000} className="field mt-1" value={notes[report.id]??report.resolution_note??''} onChange={event=>setNotes(previous=>({...previous,[report.id]:event.target.value}))} disabled={busy!==null||report.status==='resolved'||report.status==='dismissed'} placeholder="Record what was checked and what action was taken."/>
   </label>
   {report.status==='open'&&<div className="mt-3 flex flex-wrap gap-2">
    <button type="button" className={button} disabled={busy!==null||(notes[report.id]??'').trim().length<8} onClick={()=>void decide(report,'triage')}>{busy===report.id?'Saving…':'Move to review'}</button>
    <button type="button" className={button} disabled={busy!==null||(notes[report.id]??'').trim().length<8} onClick={()=>void decide(report,'resolve')}>Resolve</button>
    <button type="button" className={button} disabled={busy!==null||(notes[report.id]??'').trim().length<8} onClick={()=>void decide(report,'dismiss')}>Dismiss</button>
   </div>}
   {report.status==='triaged'&&<div className="mt-3 flex flex-wrap gap-2">
    <button type="button" className={button} disabled={busy!==null||(notes[report.id]??'').trim().length<8} onClick={()=>void decide(report,'resolve')}>Resolve</button>
    <button type="button" className={button} disabled={busy!==null||(notes[report.id]??'').trim().length<8} onClick={()=>void decide(report,'dismiss')}>Dismiss</button>
   </div>}
   {report.resolution_note&&<p className="mt-3 whitespace-pre-wrap text-xs text-white/55">Latest moderation note: {report.resolution_note}</p>}
  </li>)}</ul>
 </section>
}
