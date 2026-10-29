import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { FileQuestion, Loader2, RefreshCw } from 'lucide-react'
import { getCurrentUser } from '../lib/authService'
import { listQuestionReview, mutateQuestion } from '../lib/questionWorkflowService'
import { questionActions, type QuestionAction, type QuestionQueue, type QuestionRow, type QuestionStatus } from '../lib/questionWorkflow'
import AdminQuestionEditor from './AdminQuestionEditor'
const AdminQuestionImport = lazy(() => import('./AdminQuestionImport'))
const AdminQuestionHistory = lazy(() => import('./AdminQuestionHistory'))

const button='min-h-11 rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold disabled:opacity-40'
const labels: Record<Exclude<QuestionAction,'save'>,string>={submit:'Submit for review',approve:'Approve question',reject:'Reject question',publish:'Publish question',withdraw:'Withdraw question'}
const messages: Record<Exclude<QuestionAction,'save'>,string>={submit:'Question submitted for independent review.',approve:'Question approved. It remains private until published.',reject:'Question rejected. It remains private.',publish:'Question published.',withdraw:'Question withdrawn. Its history is preserved.'}
export default function AdminQuestionReviewQueue() {
  const [queue,setQueue]=useState<QuestionQueue|null>(null)
  const [userId,setUserId]=useState('')
  const [status,setStatus]=useState<QuestionStatus|null>(null)
  const [page,setPage]=useState(0)
  const [loading,setLoading]=useState(true)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [notice,setNotice]=useState('')
  const [mustReload,setMustReload]=useState(false)
  const [editor,setEditor]=useState<QuestionRow|null|undefined>(undefined)
  const [importing,setImporting]=useState(false)
  const [history,setHistory]=useState<QuestionRow|null>(null)
  const [notes,setNotes]=useState<Record<string,string>>({})
  const sequence=useRef(0)
  async function refresh() {
    const run=++sequence.current;setLoading(true);setError('')
    try {
      const [data,user]=await Promise.all([listQuestionReview(status,page),getCurrentUser()])
      if(!user)throw Error('Authentication required')
      if(run===sequence.current){setQueue(data);setUserId(user.id);setMustReload(false)}
    }catch{if(run===sequence.current){setQueue(null);setError('Question review records could not be loaded. Check your access and try again.')}}
    finally{if(run===sequence.current)setLoading(false)}
  }
  useEffect(()=>{void refresh();return()=>{sequence.current+=1}},[page,status])
  async function transition(row:QuestionRow,action:Exclude<QuestionAction,'save'>) {
    setBusy(true);setError('');setNotice('')
    try {
      await mutateQuestion(action,row.id,row.content_version,['reject','withdraw'].includes(action)?{reason:notes[row.id]?.trim()??''}:{})
      setNotice(messages[action]);await refresh()
    }catch{setMustReload(true);setError('The change could not be confirmed. Reload question records before retrying. No publication is assumed.')}
    finally{setBusy(false)}
  }
  function saved() {setEditor(undefined);setNotice('Private draft saved. Submit it for independent review when ready.');void refresh()}
  const disabled=loading||busy||mustReload||editor!==undefined||importing||history!==null
  return <section aria-labelledby="admin-review-questions-heading" className="mt-6 rounded-3xl border border-white/10 bg-white/[.025] p-5 sm:p-7">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2"><FileQuestion className="text-purple-200" size={21} aria-hidden="true"/><h2 id="admin-review-questions-heading" className="text-xl font-black">Question publication review</h2></div><p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">Author private text questions against the approved syllabus. A different administrator reviews each question before publication. Choices, answers, explanations and source evidence remain restricted to the editorial team.</p></div>
      <div className="flex flex-wrap gap-2"><button type="button" disabled={loading||busy||editor!==undefined||importing||history!==null} onClick={()=>void refresh()} className={`${button} inline-flex items-center gap-2`}><RefreshCw size={16} aria-hidden="true"/>Refresh questions</button><button type="button" disabled={disabled||!queue} className={button} onClick={()=>{setNotice('');setImporting(true)}}>Import questions</button><button type="button" disabled={disabled||!queue} className={`${button} bg-purple-300 text-[#120b1c]`} onClick={()=>{setNotice('');setEditor(null)}}>New question</button></div>
    </div>
    {error&&<div role="alert" className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">{error}{!mustReload&&<button type="button" className="ml-3 underline" onClick={()=>void refresh()}>Retry question review</button>}</div>}
    {notice&&<p role="status" className="mt-4 rounded-xl bg-purple-500/10 p-4 text-sm text-purple-100">{notice}</p>}
    {loading&&<p role="status" className="mt-5 flex items-center gap-2 text-sm text-white/60"><Loader2 size={17} className="animate-spin" aria-hidden="true"/>Loading question review records…</p>}
    {editor!==undefined&&<AdminQuestionEditor key={editor?.id??'new'} initial={editor} onSaved={saved} onCancel={()=>setEditor(undefined)} onUncertain={()=>setMustReload(true)}/>}
    {importing&&<Suspense fallback={<p role="status" className="mt-5 text-sm">Loading question import…</p>}><AdminQuestionImport onClose={()=>{setImporting(false);void refresh()}}/></Suspense>}
    {history&&queue&&<Suspense fallback={<p role="status" className="mt-5 text-sm">Loading question history…</p>}><AdminQuestionHistory key={history.id} initial={history} userId={userId} role={queue.actor_role} onClose={()=>{setHistory(null);void refresh()}} onUncertain={()=>setMustReload(true)} onRestored={()=>{setHistory(null);setNotice('Historical content restored as a new private draft. Independent review is required.');void refresh()}}/></Suspense>}
    {!loading&&queue&&<>
      <label className="mt-5 block max-w-xs text-sm font-semibold text-white/70">Filter review status<select disabled={disabled} className="field mt-2" value={status??'all'} onChange={e=>{setPage(0);setStatus(e.target.value==='all'?null:e.target.value as QuestionStatus)}}><option value="all">All statuses</option>{['draft','in_review','approved','published','rejected'].map(s=><option key={s} value={s}>{s.replaceAll('_',' ')}</option>)}</select></label>
      <p className="mt-3 text-xs text-white/50">{queue.questions.length} records on page {page+1} shown. Status filtering applies to the full question bank.</p>
      {!queue.questions.length&&<div className="mt-5 rounded-xl border border-dashed border-white/15 p-5"><p className="font-semibold">{status?'No questions match this review status':page===0?'No question records found':'No more question records on this page'}</p><p className="mt-2 text-sm leading-6 text-white/60">Create a rights-documented private question, or choose another review status.</p></div>}
      <ul className="mt-4 space-y-4">{queue.questions.map(row=><li key={row.id} className="min-w-0 rounded-xl border border-white/10 p-4">
        <div className="flex flex-wrap gap-2 text-xs font-semibold text-white/60"><span className="rounded-lg border border-white/15 px-2 py-1">{row.review_status.replaceAll('_',' ')}</span><span>Revision {row.content_version} · {row.active?'Published':'Private'}</span></div>
        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-white/80">{row.stem.slice(0,360)}{row.stem.length>360?'…':''}</p>
        {row.stem.length>360&&<details className="mt-3"><summary className="cursor-pointer text-sm font-semibold text-purple-200">Read full question text</summary><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6">{row.stem}</p></details>}
        <details className="mt-3 rounded-lg border border-white/10 p-3"><summary className="cursor-pointer text-sm font-semibold text-purple-200">Review answer, explanation and source</summary><ul className="mt-3 space-y-2 text-sm">{row.options.map(option=><li key={option.key} className="whitespace-pre-wrap break-words">{option.key}. {option.text}</li>)}</ul><p className="mt-3 text-sm font-bold">Correct answer: {row.correct_option_key}</p><p className="mt-2 whitespace-pre-wrap break-words text-sm text-white/70">{row.explanation}</p><p className="mt-3 break-words text-sm">{row.exam}{row.exam_year?` · ${row.exam_year}`:''} · {row.provenance.source_title} · {row.provenance.author_label}</p><p className="mt-2 whitespace-pre-wrap break-words text-sm text-white/70">{row.provenance.rights_evidence}</p>{row.provenance.source_url&&<p className="mt-2 break-all text-sm text-white/60">{row.provenance.source_url}</p>}</details>
        <p className="mt-2 break-all text-xs text-white/45">Question ID: {row.id}</p>
        {row.review_status==='in_review'&&(row.created_by===userId||row.provenance.last_content_editor===userId)&&<p className="mt-3 text-sm text-amber-100">A different administrator must review this question.</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" disabled={disabled} className={button} onClick={()=>{setNotice('');setHistory(row)}}>Version history</button>
          {!row.active&&(row.created_by===userId||queue.actor_role==='admin')&&<button type="button" disabled={disabled} className={button} onClick={()=>{setNotice('');setEditor(row)}}>Edit private question</button>}
          {questionActions(row,userId,queue.actor_role).map(action=><button key={action} type="button" disabled={disabled||(['reject','withdraw'].includes(action)&&!notes[row.id]?.trim())} className={button} onClick={()=>void transition(row,action)}>{labels[action]}</button>)}
        </div>
        {questionActions(row,userId,queue.actor_role).some(a=>a==='reject'||a==='withdraw')&&<label className="mt-3 block text-sm font-semibold text-white/70">Review note for question {row.id}<textarea rows={2} disabled={disabled} maxLength={2000} className="field mt-2" value={notes[row.id]??''} onChange={e=>setNotes(n=>({...n,[row.id]:e.target.value}))}/></label>}
      </li>)}</ul>
      {(page>0||queue.has_next)&&<nav aria-label="Question review pages" className="mt-5 flex flex-wrap items-center gap-3"><button type="button" className={button} disabled={disabled||page===0} onClick={()=>setPage(x=>x-1)}>Previous questions</button><span className="text-sm text-white/60">Page {page+1}</span><button type="button" className={button} disabled={disabled||!queue.has_next} onClick={()=>setPage(x=>x+1)}>Next questions</button></nav>}
    </>}
  </section>
}
