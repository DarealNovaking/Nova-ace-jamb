import { useEffect, useState, type FormEvent } from 'react'
import { ace } from '../lib/supabase'
import { getActiveExamBlueprint, getSyllabusTree, listActiveSyllabusVersions, type SyllabusVersion, type SyllabusTopic, type SyllabusSubtopic } from '../lib/seasonService'
import { questionDraftFromRow, validateQuestionDraft, type QuestionDraft, type QuestionRow } from '../lib/questionWorkflow'
import { mutateQuestion } from '../lib/questionWorkflowService'
import type { RichDocument } from '../lib/richContent'
import AdminRichContentComposer from './AdminRichContentComposer'

type Props = { initial: QuestionRow | null; onSaved: (row: QuestionRow) => void; onCancel: () => void; onUncertain: () => void }
const emptyDraft = (): QuestionDraft => ({subject_id:'',topic_id:'',subtopic_id:null,stem:'',options:['A','B','C','D'].map(key=>({key,text:''})),correct_option_key:'A',explanation:'',difficulty:'medium',exam:'ACE practice',exam_year:null,provenance:{source_kind:'original',source_title:'',author_label:'',source_url:null,rights_evidence:''}})
const button='min-h-11 rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold disabled:opacity-40'

export default function AdminQuestionEditor({initial,onSaved,onCancel,onUncertain}: Props) {
  const [draft,setDraft]=useState<QuestionDraft>(()=>initial?questionDraftFromRow(initial):emptyDraft())
  const [richContent,setRichContent]=useState<RichDocument|null>(()=>initial?.rich_content??null)
  const [questionId]=useState(()=>initial?.id??crypto.randomUUID())
  const [subjects,setSubjects]=useState<{id:string;name:string}[]>([])
  const [versions,setVersions]=useState<SyllabusVersion[]>([])
  const [topics,setTopics]=useState<SyllabusTopic[]>([])
  const [subtopics,setSubtopics]=useState<SyllabusSubtopic[]>([])
  const [loading,setLoading]=useState(true)
  const [loadingTree,setLoadingTree]=useState(false)
  const [saving,setSaving]=useState(false)
  const [uncertain,setUncertain]=useState(false)
  const [error,setError]=useState('')
  const [treeError,setTreeError]=useState('')
  const [reload,setReload]=useState(0)
  useEffect(()=>{
    let active=true;setLoading(true);setError('')
    void (async()=>{
      try {
        const [blueprint,result]=await Promise.all([getActiveExamBlueprint(),ace.from('subjects').select('id,name').eq('active',true).order('name')])
        if(result.error)throw result.error
        if(!blueprint?.season?.id)throw Error('No active preparation season')
        const rows=await listActiveSyllabusVersions(blueprint.season.id)
        if(active){setSubjects(result.data??[]);setVersions(rows.filter(row=>row.rights_status==='approved'))}
      }catch{if(active){setSubjects([]);setVersions([]);setError('Approved syllabus choices could not be loaded. Retry before authoring.')}}
      finally{if(active)setLoading(false)}
    })()
    return()=>{active=false}
  },[reload])
  useEffect(()=>{
    let active=true;setTopics([]);setSubtopics([]);setTreeError('')
    const version=versions.find(row=>row.subject_id===draft.subject_id)
    if(!version){setLoadingTree(false);return()=>{active=false}}
    setLoadingTree(true)
    void getSyllabusTree(version.id).then(tree=>{if(active){setTopics(tree.topics);setSubtopics(tree.subtopics)}}).catch(()=>{if(active)setTreeError('Syllabus topics could not be loaded. Retry before saving.')}).finally(()=>{if(active)setLoadingTree(false)})
    return()=>{active=false}
  },[draft.subject_id,versions,reload])
  function change<K extends keyof QuestionDraft>(key: K,value: QuestionDraft[K]){setDraft(current=>({...current,[key]:value}))}
  async function save(event:FormEvent) {
    event.preventDefault();setError('')
    let data:QuestionDraft
    try {
      data=validateQuestionDraft(draft)
      if(!topics.some(t=>t.id===data.topic_id&&t.subject_id===data.subject_id))throw Error('Select an active approved syllabus topic.')
      if(data.subtopic_id&&!subtopics.some(s=>s.id===data.subtopic_id&&s.topic_id===data.topic_id))throw Error('Select a subtopic belonging to this topic.')
    }catch(e){setError(e instanceof Error?e.message:'Complete the question fields.');return}
    setSaving(true)
    try {
      const payload: QuestionDraft = initial?.rich_content !== undefined || richContent !== null
        ? { ...data, rich_content: richContent } : data
      onSaved(await mutateQuestion('save',questionId,initial?.content_version??0,payload))
    }
    catch {setUncertain(true);onUncertain();setError('The save could not be confirmed. Close the editor and reload question records before retrying. Your text is retained here.')}
    finally{setSaving(false)}
  }
  const unavailable=loading||loadingTree||saving||uncertain||!!treeError
  return <form aria-label="Question editor" onSubmit={event=>void save(event)} className="mt-6 rounded-2xl border border-purple-300/20 bg-purple-500/5 p-4 sm:p-6">
    <h3 className="text-lg font-bold">{initial?'Edit private question':'New private question'}</h3>
    <p className="mt-2 text-sm leading-6 text-white/60">Save the question privately, then submit it. A different administrator checks the answer, explanation and usage rights before publication. Use plain text or Unicode mathematical notation.</p>
    {(loading||loadingTree)&&<p role="status" className="mt-4 text-sm text-white/60">Loading approved syllabus…</p>}
    {error&&<p role="alert" className="mt-4 text-sm text-red-200">{error}</p>}
    {treeError&&<p role="alert" className="mt-4 text-sm text-red-200">{treeError}</p>}
    {!loading&&!versions.length&&!error&&<p className="mt-4 text-sm text-amber-100">Publish an approved syllabus before creating questions.</p>}
    {(!saving&&!uncertain)&&(error||treeError)&&<button type="button" className={`${button} mt-3`} onClick={()=>setReload(x=>x+1)}>Reload syllabus choices</button>}
    <fieldset disabled={loading||saving||uncertain} className="mt-5 grid min-w-0 gap-4 sm:grid-cols-2">
      <label className="text-sm font-semibold">Subject<select required className="field mt-2" value={draft.subject_id} onChange={e=>setDraft(d=>({...d,subject_id:e.target.value,topic_id:'',subtopic_id:null}))}><option value="">Choose subject</option>{subjects.filter(s=>versions.some(v=>v.subject_id===s.id)).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
      <label className="text-sm font-semibold">Syllabus topic<select required disabled={loadingTree} className="field mt-2" value={draft.topic_id} onChange={e=>setDraft(d=>({...d,topic_id:e.target.value,subtopic_id:null}))}><option value="">Choose topic</option>{topics.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
      <label className="text-sm font-semibold">Subtopic (optional)<select disabled={loadingTree} className="field mt-2" value={draft.subtopic_id??''} onChange={e=>change('subtopic_id',e.target.value||null)}><option value="">Whole topic</option>{subtopics.filter(s=>s.topic_id===draft.topic_id).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
      <label className="text-sm font-semibold">Difficulty<select className="field mt-2" value={draft.difficulty} onChange={e=>change('difficulty',e.target.value as QuestionDraft['difficulty'])}>{['easy','medium','hard'].map(d=><option key={d} value={d}>{d}</option>)}</select></label>
      <label className="text-sm font-semibold sm:col-span-2">Question text<textarea required maxLength={20000} rows={4} className="field mt-2" value={draft.stem} onChange={e=>change('stem',e.target.value)}/></label>
      {draft.options.map((option,index)=><label key={option.key} className="text-sm font-semibold">Option {option.key}<textarea required maxLength={4000} rows={2} className="field mt-2" value={option.text} onChange={e=>change('options',draft.options.map((o,i)=>i===index?{...o,text:e.target.value}:o))}/></label>)}
      <label className="text-sm font-semibold">Correct option<select className="field mt-2" value={draft.correct_option_key} onChange={e=>change('correct_option_key',e.target.value)}>{['A','B','C','D'].map(k=><option key={k} value={k}>{k}</option>)}</select></label>
      <label className="text-sm font-semibold sm:col-span-2">Explanation<textarea required maxLength={20000} rows={4} className="field mt-2" value={draft.explanation} onChange={e=>change('explanation',e.target.value)}/></label>
      <label className="text-sm font-semibold">Source permission<select className="field mt-2" value={draft.provenance.source_kind} onChange={e=>setDraft(d=>({...d,exam:'ACE practice',exam_year:null,provenance:{...d.provenance,source_kind:e.target.value as QuestionDraft['provenance']['source_kind']}}))}><option value="original">Original ACE exercise</option><option value="licensed">Licensed source</option><option value="permitted">Permission received</option></select></label>
      <label className="text-sm font-semibold">Question attribution<select disabled={draft.provenance.source_kind==='original'} className="field mt-2" value={draft.exam} onChange={e=>change('exam',e.target.value as QuestionDraft['exam'])}><option value="ACE practice">ACE practice</option><option value="JAMB">Verified JAMB past question</option></select></label>
      {draft.exam==='JAMB'&&<label className="text-sm font-semibold">Verified examination year<input required type="number" min={1978} max={new Date().getUTCFullYear()} className="field mt-2" value={draft.exam_year??''} onChange={e=>change('exam_year',e.target.value?Number(e.target.value):null)}/></label>}
      <label className="text-sm font-semibold">Source title<input required maxLength={500} className="field mt-2" value={draft.provenance.source_title} onChange={e=>change('provenance',{...draft.provenance,source_title:e.target.value})}/></label>
      <label className="text-sm font-semibold">Author or rights holder<input required maxLength={200} className="field mt-2" value={draft.provenance.author_label} onChange={e=>change('provenance',{...draft.provenance,author_label:e.target.value})}/></label>
      <label className="text-sm font-semibold sm:col-span-2">Source URL {draft.provenance.source_kind==='original'?'(optional)':''}<input type="url" required={draft.provenance.source_kind!=='original'} maxLength={2000} className="field mt-2" value={draft.provenance.source_url??''} onChange={e=>change('provenance',{...draft.provenance,source_url:e.target.value||null})}/></label>
      <label className="text-sm font-semibold sm:col-span-2">Usage-rights evidence<textarea required maxLength={4000} rows={3} className="field mt-2" value={draft.provenance.rights_evidence} onChange={e=>change('provenance',{...draft.provenance,rights_evidence:e.target.value})}/></label>
    </fieldset>
    <AdminRichContentComposer
      value={richContent}
      onChange={setRichContent}
      questionId={questionId}
      questionVersion={initial?.content_version??0}
      canUpload={!!initial && !initial.active && ['draft','rejected'].includes(initial.review_status)}
      disabled={loading||saving||uncertain}
    />
    <p className="mt-4 break-all text-xs text-white/45">Question ID: {questionId}</p>
    <div className="mt-5 flex flex-wrap gap-3"><button disabled={unavailable||!versions.length} type="submit" className={`${button} bg-purple-300 text-[#120b1c]`}>{saving?'Saving private draft…':'Save private draft'}</button><button type="button" disabled={saving} className={button} onClick={onCancel}>Close editor</button></div>
  </form>
}
