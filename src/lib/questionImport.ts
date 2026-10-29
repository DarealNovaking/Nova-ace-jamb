import { parseSavedQuestion, validateQuestionDraft, type QuestionDraft } from './questionWorkflow'

export const QUESTION_IMPORT_MAX_BYTES = 1024 * 1024
export const QUESTION_IMPORT_MAX_ROWS = 100
export const QUESTION_IMPORT_COLUMNS = ['question','option_a','option_b','option_c','option_d','correct_option','explanation','difficulty','attribution','exam_year','source_kind','source_title','author','source_url','rights_evidence'] as const
export type ImportTaxonomy = Pick<QuestionDraft,'subject_id'|'topic_id'|'subtopic_id'>
export type QuestionImportRow = { record: number; id: string; draft: QuestionDraft | null; error: string | null }
export type QuestionImportOutcome = QuestionImportRow & { state: 'pending' | 'saved' | 'uncertain' }

function csvRecords(text: string): string[][] {
  const records: string[][] = []
  let record: string[] = [], cell = '', quoted = false, closed = false
  const endCell = () => { record.push(cell); cell='';closed=false }
  const endRecord = () => {
    endCell()
    if(record.some(value=>value.trim()))records.push(record)
    record=[]
    if(records.length>QUESTION_IMPORT_MAX_ROWS+1)throw Error('CSV uploads support at most 100 question rows.')
  }
  for(let i=0;i<text.length;i++) {
    const ch=text[i]
    if(quoted) {
      if(ch==='"') {
        if(text[i+1]==='"'){cell+='"';i++}else{quoted=false;closed=true}
      }else cell+=ch
    } else if(ch===',')endCell()
    else if(ch==='\r'||ch==='\n'){endRecord();if(ch==='\r'&&text[i+1]==='\n')i++}
    else if(closed)throw Error('Invalid CSV: unexpected text after a closing quote.')
    else if(ch==='"'){
      if(cell)throw Error('Invalid CSV: quotes must enclose the entire cell.')
      quoted=true
    }else cell+=ch
    if(record.length>QUESTION_IMPORT_COLUMNS.length)throw Error('CSV contains too many columns.')
  }
  if(quoted)throw Error('Invalid CSV: a quoted cell is not closed.')
  endRecord()
  return records
}

export function parseQuestionImport(text: string, taxonomy: ImportTaxonomy): QuestionImportRow[] {
  if(text.length>QUESTION_IMPORT_MAX_BYTES||new TextEncoder().encode(text).length>QUESTION_IMPORT_MAX_BYTES)throw Error('CSV file must be no larger than 1 MiB.')
  const [header,...records]=csvRecords(text.replace(/^\uFEFF/,''))
  const names=header?.map(value=>value.trim())??[]
  if(names.length!==QUESTION_IMPORT_COLUMNS.length||new Set(names).size!==names.length||QUESTION_IMPORT_COLUMNS.some(name=>!names.includes(name)))throw Error('CSV headers must match the downloaded template exactly.')
  if(!records.length)throw Error('CSV contains no question rows. Fill the template before uploading.')
  const seen=new Set<string>()
  return records.map((values,index)=>{
    if(values.length!==names.length)throw Error(`CSV record ${index+2} has the wrong number of columns.`)
    const row=Object.fromEntries(names.map((name,i)=>[name,values[i].trim()]))
    const id=crypto.randomUUID()
    try {
      if(row.exam_year&&!/^\d{4}$/.test(row.exam_year))throw Error('Use a four-digit verified examination year or leave it blank.')
      const draft=validateQuestionDraft({...taxonomy,stem:row.question,options:['A','B','C','D'].map(key=>({key,text:row[`option_${key.toLowerCase()}`]})),correct_option_key:row.correct_option,explanation:row.explanation,difficulty:row.difficulty,exam:row.attribution,exam_year:row.exam_year?Number(row.exam_year):null,provenance:{source_kind:row.source_kind,source_title:row.source_title,author_label:row.author,source_url:row.source_url||null,rights_evidence:row.rights_evidence}})
      const normalized=draft.stem.toLowerCase().replace(/\s+/gu,' ')
      if(seen.has(normalized))throw Error('Duplicate question text within this CSV. Keep one copy.')
      seen.add(normalized)
      return {record:index+2,id,draft,error:null}
    }catch(error){return {record:index+2,id,draft:null,error:error instanceof Error?error.message:'Complete every required field.'}}
  })
}

export async function runQuestionImport(
  rows: QuestionImportRow[],
  save: (row: QuestionImportRow & {draft: QuestionDraft}) => Promise<unknown>,
  isActive: () => boolean,
  onProgress: (outcomes: QuestionImportOutcome[]) => void,
): Promise<QuestionImportOutcome[]> {
  if(!rows.length||rows.length>QUESTION_IMPORT_MAX_ROWS||rows.some(row=>row.error||!row.draft)||new Set(rows.map(row=>row.id)).size!==rows.length)throw Error('Resolve every CSV error before saving.')
  for(const row of rows)validateQuestionDraft(row.draft)
  const outcomes:QuestionImportOutcome[]=rows.map(row=>({...row,state:'pending'}))
  for(let i=0;i<rows.length;i++) {
    if(!isActive())break
    const row=rows[i] as QuestionImportRow & {draft: QuestionDraft}
    try {
      parseSavedQuestion(await save(row),row.id,0,'save')
      outcomes[i]={...outcomes[i],state:'saved'}
    }catch{outcomes[i]={...outcomes[i],state:'uncertain'}}
    if(isActive())onProgress(outcomes.map(outcome=>({...outcome})))
    if(outcomes[i].state==='uncertain')break
  }
  return outcomes
}
