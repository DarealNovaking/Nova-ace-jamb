export type QuestionStatus = 'draft' | 'in_review' | 'approved' | 'published' | 'rejected'
export type QuestionAction = 'save' | 'submit' | 'approve' | 'reject' | 'publish' | 'withdraw'
export type QuestionRole = 'admin' | 'editor'
export type QuestionDraft = {
  subject_id: string; topic_id: string; subtopic_id: string | null
  stem: string; options: { key: string; text: string }[]; correct_option_key: string
  explanation: string; difficulty: 'easy' | 'medium' | 'hard'; exam: 'JAMB' | 'ACE practice'; exam_year: number | null
  provenance: { source_kind: 'original' | 'licensed' | 'permitted'; source_title: string; author_label: string; source_url: string | null; rights_evidence: string }
}
export type QuestionRow = Omit<QuestionDraft, 'provenance'> & {
  id: string; content_version: number; review_status: QuestionStatus; active: boolean; rights_status: string
  created_by: string; reviewed_by: string | null
  provenance: QuestionDraft['provenance'] & { last_content_editor: string }
}
export type QuestionQueue = { questions: QuestionRow[]; page: number; has_next: boolean; actor_role: QuestionRole }
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const statuses: QuestionStatus[] = ['draft','in_review','approved','published','rejected']
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
function text(v: unknown, limit: number): string {
  if (typeof v !== 'string' || !v.trim() || v.trim().length > limit) throw Error('Complete the required question fields within their limits.')
  return v.trim()
}
function id(v: unknown): string {
  if (typeof v !== 'string' || !uuid.test(v)) throw Error('Select an active subject and syllabus topic.')
  return v
}
export function validateQuestionDraft(value: unknown): QuestionDraft {
  const fields=['subject_id','topic_id','subtopic_id','stem','options','correct_option_key','explanation','difficulty','exam','exam_year','provenance']
  if(!object(value) || Object.keys(value).some(key=>!fields.includes(key))) throw Error('Unsupported question fields.')
  if(!Array.isArray(value.options) || value.options.length!==4) throw Error('Provide exactly four choices, A to D.')
  const options=value.options.map(option=> {
    if(!object(option)||Object.keys(option).some(key=>!['key','text'].includes(key))) throw Error('Invalid question option.')
    return {key:text(option.key,1),text:text(option.text,4000)}
  }).sort((a,b)=>a.key.localeCompare(b.key))
  if(options.map(x=>x.key).join('')!=='ABCD'||new Set(options.map(x=>x.text.toLowerCase().replace(/\s+/gu,' '))).size!==4 || !options.some(x=>x.key===value.correct_option_key)) throw Error('Choices must be distinct and include the correct answer.')
  const proof=value.provenance
  if(!object(proof)||Object.keys(proof).some(key=>!['source_kind','source_title','author_label','source_url','rights_evidence'].includes(key))||!['original','licensed','permitted'].includes(String(proof.source_kind))) throw Error('Complete the source and usage evidence.')
  const source_url=proof.source_url===null ? null : text(proof.source_url,2000)
  if(source_url!==null && !/^https:\/\/[a-zA-Z0-9.-]+(:[0-9]+)?(\/[^\s]*)?$/.test(source_url)) throw Error('Use a valid HTTPS source URL without credentials.')
  if(proof.source_kind!=='original'&&!source_url) throw Error('A source URL and permission evidence are required.')
  if(!['easy','medium','hard'].includes(String(value.difficulty))||!['JAMB','ACE practice'].includes(String(value.exam))) throw Error('Choose a valid difficulty and attribution.')
  const year=value.exam_year
  if(year!==null && (typeof year!=='number'||!Number.isInteger(year)||year<1978||year>new Date().getUTCFullYear())) throw Error('Use a valid past examination year.')
  if(proof.source_kind==='original'&&(value.exam!=='ACE practice'||year!==null)) throw Error('Original questions must be labelled ACE practice, without a past-exam year.')
  if(value.exam==='JAMB'&&year===null) throw Error('A past-examination question requires its verified year.')
  return {
    subject_id:id(value.subject_id),topic_id:id(value.topic_id),subtopic_id:value.subtopic_id===null?null:id(value.subtopic_id),
    stem:text(value.stem,20000),options,correct_option_key:String(value.correct_option_key),explanation:text(value.explanation,20000),
    difficulty:value.difficulty as QuestionDraft['difficulty'],exam:value.exam as QuestionDraft['exam'],exam_year:year as number|null,
    provenance:{source_kind:proof.source_kind as QuestionDraft['provenance']['source_kind'],source_title:text(proof.source_title,500),author_label:text(proof.author_label,200),source_url,rights_evidence:text(proof.rights_evidence,4000)},
  }
}
export function questionDraftFromRow(row: QuestionRow): QuestionDraft {
  const {last_content_editor: _editor,...provenance}=row.provenance
  return {subject_id:row.subject_id,topic_id:row.topic_id,subtopic_id:row.subtopic_id,stem:row.stem,options:row.options,correct_option_key:row.correct_option_key,explanation:row.explanation,difficulty:row.difficulty,exam:row.exam,exam_year:row.exam_year,provenance}
}
function parseQuestion(value: unknown): QuestionRow {
  if(!object(value)||!object(value.provenance)) throw Error('Question readback could not be confirmed.')
  id(value.id);id(value.created_by);id(value.provenance.last_content_editor)
  if(!Number.isInteger(value.content_version)||Number(value.content_version)<1||!statuses.includes(value.review_status as QuestionStatus)||typeof value.active!=='boolean'||!['unknown','owned','licensed','permitted','restricted','rejected'].includes(String(value.rights_status))||(value.reviewed_by!==null&&(typeof value.reviewed_by!=='string'||!uuid.test(value.reviewed_by)))) throw Error('Question readback could not be confirmed.')
  if(value.active!==(value.review_status==='published')) throw Error('Question publication readback is inconsistent.')
  if(['approved','published'].includes(String(value.review_status))&&(!value.reviewed_by||value.reviewed_by===value.created_by||value.reviewed_by===value.provenance.last_content_editor||!['owned','licensed','permitted'].includes(String(value.rights_status)))) throw Error('Question approval readback is inconsistent.')
  const row=value as QuestionRow
  validateQuestionDraft(questionDraftFromRow(row))
  return row
}
export function parseSavedQuestion(value: unknown, expectedId: string, previousVersion: number, action?: QuestionAction): QuestionRow {
  const row=parseQuestion(value)
  if(row.id!==expectedId||row.content_version!==previousVersion+1) throw Error('The saved revision could not be confirmed. Reload before retrying.')
  const states: Record<QuestionAction,QuestionStatus>={save:'draft',submit:'in_review',approve:'approved',reject:'rejected',publish:'published',withdraw:'approved'}
  if(action&&row.review_status!==states[action]) throw Error('The requested question state could not be confirmed.')
  return row
}
export function parseQuestionQueue(value: unknown, expectedPage: number): QuestionQueue {
  if(!object(value)||!Array.isArray(value.questions)||value.questions.length>30||value.page!==expectedPage||typeof value.has_next!=='boolean'||!['admin','editor'].includes(String(value.actor_role))) throw Error('Question records could not be confirmed.')
  return {questions:value.questions.map(parseQuestion),page:expectedPage,has_next:value.has_next,actor_role:value.actor_role as QuestionRole}
}
export function questionActions(row: QuestionRow, userId: string, role: QuestionRole): Exclude<QuestionAction, 'save'>[] {
  if(row.active) return role==='admin'?['withdraw']:[]
  if(['draft','rejected'].includes(row.review_status)) return row.created_by===userId||role==='admin'?['submit']:[]
  if(row.review_status==='in_review'&&role==='admin'&&row.created_by!==userId&&row.provenance.last_content_editor!==userId) return ['approve','reject']
  if(row.review_status==='approved'&&role==='admin') return ['publish']
  return []
}
