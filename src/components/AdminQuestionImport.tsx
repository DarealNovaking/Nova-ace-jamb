import { useEffect, useRef, useState } from 'react'
import { ace } from '../lib/supabase'
import { getActiveExamBlueprint, getSyllabusTree, listActiveSyllabusVersions, type SyllabusVersion, type SyllabusTopic, type SyllabusSubtopic } from '../lib/seasonService'
import { QUESTION_IMPORT_COLUMNS, QUESTION_IMPORT_MAX_BYTES, parseQuestionImport, runQuestionImport, type QuestionImportRow, type QuestionImportOutcome } from '../lib/questionImport'
import { mutateQuestion } from '../lib/questionWorkflowService'

type Props = { onClose: () => void }
const button='min-h-11 rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold disabled:opacity-40'
const template='data:text/csv;charset=utf-8,'+encodeURIComponent(QUESTION_IMPORT_COLUMNS.join(',')+'\r\n')

export default function AdminQuestionImport({onClose}: Props) {
  const [subjects,setSubjects]=useState<{id:string;name:string}[]>([])
  const [versions,setVersions]=useState<SyllabusVersion[]>([])
  const [topics,setTopics]=useState<SyllabusTopic[]>([])
  const [subtopics,setSubtopics]=useState<SyllabusSubtopic[]>([])
  const [subject,setSubject]=useState('')
  const [topic,setTopic]=useState('')
  const [subtopic,setSubtopic]=useState('')
  const [file,setFile]=useState<File|null>(null)
  const [rows,setRows]=useState<QuestionImportRow[]>([])
  const [outcomes,setOutcomes]=useState<QuestionImportOutcome[]>([])
  const [loading,setLoading]=useState(true)
  const [loadingTree,setLoadingTree]=useState(false)
  const [reading,setReading]=useState(false)
  const [saving,setSaving]=useState(false)
  const [started,setStarted]=useState(false)
  const [confirmed,setConfirmed]=useState(false)
  const [error,setError]=useState('')
  const [catalogError,setCatalogError]=useState('')
  const [reload,setReload]=useState(0)
  const generation=useRef(0)
  const mounted=useRef(false)
  const savingLock=useRef(false)

  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;generation.current++}},[])
  useEffect(()=>{
    let active=true;setLoading(true);setCatalogError('')
    void (async()=>{
      try {
        const [blueprint,result]=await Promise.all([getActiveExamBlueprint(),ace.from('subjects').select('id,name').eq('active',true).order('name')])
        if(result.error||!blueprint?.season?.id)throw Error('Syllabus unavailable')
        const choices=await listActiveSyllabusVersions(blueprint.season.id)
        if(active){setSubjects(result.data??[]);setVersions(choices.filter(row=>row.status==='active'&&row.rights_status==='approved'))}
      }catch{if(active){setSubjects([]);setVersions([]);setCatalogError('Approved syllabus choices could not be loaded. Retry before importing.')}}
      finally{if(active)setLoading(false)}
    })()
    return()=>{active=false}
  },[reload])
  useEffect(()=>{
    let active=true;setTopics([]);setSubtopics([])
    const version=versions.find(row=>row.subject_id===subject)
    if(!version){setLoadingTree(false);return()=>{active=false}}
    setLoadingTree(true);setCatalogError('')
    void getSyllabusTree(version.id).then(tree=>{if(active){setTopics(tree.topics.filter(row=>row.active&&row.subject_id===subject));setSubtopics(tree.subtopics.filter(row=>row.active))}}).catch(()=>{if(active)setCatalogError('Syllabus topics could not be loaded. Retry before importing.')}).finally(()=>{if(active)setLoadingTree(false)})
    return()=>{active=false}
  },[subject,versions,reload])

  function invalidate() {
    generation.current++;setRows([]);setOutcomes([]);setConfirmed(false);setError('');setReading(false)
  }
  async function preview() {
    invalidate()
    const run=generation.current
    setReading(true)
    try {
      if(!file||!file.name.toLowerCase().endsWith('.csv'))throw Error('Choose a UTF-8 .csv question file.')
      if(file.size>QUESTION_IMPORT_MAX_BYTES)throw Error('CSV file must be no larger than 1 MiB.')
      if(!versions.some(row=>row.subject_id===subject)||!topics.some(row=>row.id===topic&&row.subject_id===subject)||subtopic&&!subtopics.some(row=>row.id===subtopic&&row.topic_id===topic))throw Error('Choose an active approved subject, topic and matching subtopic.')
      let text:string
      try {text=new TextDecoder('utf-8',{fatal:true}).decode(await file.arrayBuffer())}
      catch{throw Error('The file could not be read as UTF-8. Export it as CSV UTF-8 and try again.')}
      const parsed=parseQuestionImport(text,{subject_id:subject,topic_id:topic,subtopic_id:subtopic||null})
      if(mounted.current&&run===generation.current)setRows(parsed)
    }catch(error){if(mounted.current&&run===generation.current)setError(error instanceof Error?error.message:'CSV could not be read.')}
    finally{if(mounted.current&&run===generation.current)setReading(false)}
  }
  async function save() {
    if(savingLock.current||started||!confirmed||!rows.length||rows.some(row=>row.error))return
    savingLock.current=true;setStarted(true);setSaving(true);setError('');setOutcomes(rows.map(row=>({...row,state:'pending'})))
    const run=generation.current
    const active=()=>mounted.current&&run===generation.current
    try {
      const result=await runQuestionImport(rows,row=>mutateQuestion('save',row.id,0,row.draft),active,setOutcomes)
      if(active()){
        setOutcomes(result)
        if(result.some(row=>row.state==='uncertain'))setError('Import stopped because a save could not be confirmed. Check the question list before retrying; an unconfirmed row may already have saved. Earlier confirmed drafts are retained.')
      }
    }catch{if(active())setError('Import could not continue. Close the import and check the question list before retrying.')}
    finally{if(active())setSaving(false)}
  }
  const locked=started||saving
  const unavailable=loading||loadingTree||!!catalogError
  const invalid=rows.filter(row=>row.error).length
  const counts={saved:outcomes.filter(row=>row.state==='saved').length,uncertain:outcomes.filter(row=>row.state==='uncertain').length,pending:outcomes.filter(row=>row.state==='pending').length}
  const receipt='data:text/csv;charset=utf-8,'+encodeURIComponent(['record,question_id,result',...outcomes.map(row=>`${row.record},${row.id},${row.state}`)].join('\r\n')+'\r\n')

  return <section aria-labelledby="question-import-heading" className="mt-6 min-w-0 rounded-2xl border border-purple-300/20 bg-purple-500/5 p-4 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 id="question-import-heading" className="text-lg font-bold">Bulk question import</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">Upload up to 100 questions for one syllabus topic. Preview first, then save private drafts. Each draft still needs independent review before publication.</p></div><a href={template} download="ace-question-template.csv" className={`${button} inline-flex items-center`}>Download CSV template</a></div>
    <details className="mt-4 text-sm text-white/70"><summary className="cursor-pointer font-semibold text-purple-200">CSV format and source requirements</summary><p className="mt-3 leading-6">Export the template as CSV UTF-8 (maximum 1 MiB). Keep all 15 column headers. Use four distinct options and correct_option A, B, C or D; difficulty easy, medium or hard; attribution ACE practice or JAMB; source_kind original, licensed or permitted. Original exercises use ACE practice and a blank exam_year. Verified JAMB questions require their past year. Include source_title, author and rights_evidence; licensed or permitted sources also require an HTTPS source_url. Plain text and Unicode notation are supported. PDF, Word and image extraction are not included.</p><p className="mt-2 leading-6">Every row is saved separately. If a save fails, earlier confirmed drafts remain private and the rest of the batch stops. Check the list before retrying. Signing out or leaving stops further rows; a save already sent may finish.</p></details>
    {(loading||loadingTree)&&<p role="status" className="mt-4 text-sm text-white/60">Loading approved import syllabus…</p>}
    {catalogError&&<div role="alert" className="mt-4 text-sm text-red-200">{catalogError}<button type="button" disabled={locked} className={`${button} ml-3`} onClick={()=>{invalidate();setReload(value=>value+1)}}>Retry import syllabus</button></div>}
    {!loading&&!versions.length&&!catalogError&&<p className="mt-4 text-sm text-amber-100">Publish an approved syllabus before importing questions.</p>}
    {error&&<p role="alert" className="mt-4 whitespace-pre-wrap break-words text-sm text-red-200">{error}</p>}
    <fieldset disabled={locked||loading} className="mt-5 grid min-w-0 gap-4 sm:grid-cols-2">
      <label className="text-sm font-semibold">Import subject<select className="field mt-2" value={subject} onChange={event=>{invalidate();setSubject(event.target.value);setTopic('');setSubtopic('')}}><option value="">Choose subject</option>{subjects.filter(row=>versions.some(version=>version.subject_id===row.id)).map(row=><option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
      <label className="text-sm font-semibold">Import syllabus topic<select disabled={loadingTree} className="field mt-2" value={topic} onChange={event=>{invalidate();setTopic(event.target.value);setSubtopic('')}}><option value="">Choose topic</option>{topics.map(row=><option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
      <label className="text-sm font-semibold">Import subtopic (optional)<select disabled={loadingTree} className="field mt-2" value={subtopic} onChange={event=>{invalidate();setSubtopic(event.target.value)}}><option value="">Whole topic</option>{subtopics.filter(row=>row.topic_id===topic).map(row=><option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
      <label className="min-w-0 text-sm font-semibold">Question CSV file<input type="file" accept=".csv,text/csv" className="field mt-2 max-w-full text-xs file:mr-2 file:rounded-lg file:border-0 file:px-2 file:py-2" onChange={event=>{invalidate();setFile(event.target.files?.[0]??null)}}/></label>
    </fieldset>
    <div className="mt-4 flex flex-wrap gap-3"><button type="button" disabled={locked||reading||unavailable||!file||!topic} className={button} onClick={()=>void preview()}>{reading?'Reading CSV…':'Preview CSV'}</button><button type="button" disabled={saving} className={button} onClick={onClose}>Close import and refresh questions</button></div>
    {rows.length>0&&<div className="mt-5 min-w-0">
      {invalid?<p role="alert" className="rounded-xl bg-red-500/10 p-3 text-sm text-red-100">{invalid} invalid records. Fix every error and upload the corrected CSV; no rows can be saved yet.</p>:<p role="status" className="text-sm text-purple-100">{rows.length} valid {rows.length===1?'question':'questions'} ready for private-draft import.</p>}
      {started&&<p role="status" className="mt-3 text-sm font-semibold">{counts.saved} confirmed saved · {counts.uncertain} unconfirmed · {counts.pending} not attempted</p>}
      {saving&&<p role="status" className="mt-2 text-sm text-white/70">Saving private drafts… Keep this page open.</p>}
      <ol className="mt-4 space-y-3">{rows.map((row,index)=><li key={row.id} className="min-w-0 rounded-xl border border-white/10 p-3">
        <p className="text-xs font-bold text-white/60">CSV record {row.record}{outcomes[index]?` · ${outcomes[index].state}`:''}</p>
        {row.error?<p role="alert" className="mt-2 break-words text-sm text-red-200">{row.error}</p>:row.draft&&<><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{row.draft.stem}</p><details className="mt-2 text-sm"><summary className="cursor-pointer font-semibold text-purple-200">Preview choices, answer and source</summary><ul className="mt-3 space-y-2">{row.draft.options.map(option=><li key={option.key} className="whitespace-pre-wrap break-words">{option.key}. {option.text}</li>)}</ul><p className="mt-3 font-semibold">Correct answer: {row.draft.correct_option_key}</p><p className="mt-2 whitespace-pre-wrap break-words">{row.draft.explanation}</p><p className="mt-3 break-words text-white/70">{row.draft.difficulty} · {row.draft.exam}{row.draft.exam_year?` · ${row.draft.exam_year}`:''} · {row.draft.provenance.source_kind} · {row.draft.provenance.source_title} · {row.draft.provenance.author_label}</p><p className="mt-2 whitespace-pre-wrap break-words text-white/70">{row.draft.provenance.rights_evidence}</p>{row.draft.provenance.source_url&&<p className="mt-2 break-all text-white/60">{row.draft.provenance.source_url}</p>}</details></>}
        {started&&<p className="mt-3 break-all text-xs text-white/50">Question ID: {row.id}</p>}
      </li>)}</ol>
      <label className="mt-5 flex items-start gap-3 text-sm leading-6"><input type="checkbox" className="mt-1 h-5 w-5 shrink-0" checked={confirmed} disabled={locked||invalid>0} onChange={event=>setConfirmed(event.target.checked)}/>I have supplied usage-rights evidence for every question. These are private drafts requiring independent review.</label>
      <div className="mt-4 flex flex-wrap gap-3"><button type="button" disabled={locked||invalid>0||!confirmed||unavailable} className={`${button} bg-purple-300 text-[#120b1c]`} onClick={()=>void save()}>Save {rows.length} private drafts</button>{outcomes.length>0&&<a href={receipt} download="ace-question-import-receipt.csv" className={`${button} inline-flex items-center`}>Download import receipt</a>}</div>
    </div>}
  </section>
}
