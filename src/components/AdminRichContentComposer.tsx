import { useEffect, useRef, useState } from 'react'
import { createRichContent, type RichBlock, type RichDocument } from '../lib/richContent'
import { uploadQuestionMedia } from '../lib/questionMediaClient'
import AdminRichContentPreview from './AdminRichContentPreview'

type Props = {
  value: RichDocument | null
  onChange: (value: RichDocument | null) => void
  questionId: string
  questionVersion: number
  canUpload: boolean
  disabled?: boolean
}
const button = 'min-h-10 rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold disabled:opacity-40'
const placeholderAsset = '00000000-0000-4000-8000-000000000001'

export default function AdminRichContentComposer({
  value, onChange, questionId, questionVersion, canUpload, disabled = false,
}: Props) {
  const [mode, setMode] = useState<'paragraph' | 'equation' | 'table' | 'image'>('paragraph')
  const [paragraph, setParagraph] = useState('')
  const [expression, setExpression] = useState('')
  const [spoken, setSpoken] = useState('')
  const [tableCaption, setTableCaption] = useState('')
  const [tableInput, setTableInput] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [alt, setAlt] = useState('')
  const [caption, setCaption] = useState('')
  const [rightsEvidence, setRightsEvidence] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [localSources, setLocalSources] = useState<Record<string, string>>({})
  const sourcesRef = useRef<Record<string, string>>({})
  const blocks = value?.blocks ?? []

  useEffect(() => () => {
    for (const source of Object.values(sourcesRef.current)) URL.revokeObjectURL(source)
    sourcesRef.current = {}
  }, [])

  function commit(next: RichBlock[]) {
    try {
      onChange(next.length ? createRichContent(next) : null)
      setError('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'This content exceeds the supported limits.')
    }
  }

  function addTextBlock() {
    commit([...blocks, { type: 'paragraph', text: paragraph }])
    if (paragraph.trim()) setParagraph('')
  }
  function addEquationBlock() {
    commit([...blocks, { type: 'equation', expression, spoken }])
    if (expression.trim() && spoken.trim()) { setExpression(''); setSpoken('') }
  }
  function addTableBlock() {
    try {
      const rows = tableInput.split(/\r?\n/u).filter(line => line.trim() !== '')
        .map(line => line.split('\t').map(cell => cell.trim()))
      if (rows.length < 2) throw new Error('Add a header row and at least one data row, separating columns with Tab.')
      commit([...blocks, { type: 'table', caption: tableCaption, headers: rows[0], rows: rows.slice(1) }])
      if (tableCaption.trim() && rows.length >= 2) { setTableCaption(''); setTableInput('') }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Check the table rows.')
    }
  }
  async function addImageBlock() {
    setError(''); setNotice('')
    if (!canUpload || !questionId || questionVersion < 1) {
      setError('Save this question as a private draft first. Then reopen it to attach a diagram.')
      return
    }
    if (!file) { setError('Choose a PNG, JPEG or WebP image first.'); return }
    // Validate document limits and text before uploading so invalid content does
    // not create an unnecessary private staging object.
    try {
      createRichContent([...blocks, {
        type: 'image', asset_id: placeholderAsset, alt, caption,
      }])
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Check the diagram description and content limits.')
      return
    }
    setUploading(true)
    try {
      const assetId = await uploadQuestionMedia(questionId, questionVersion, file, alt, rightsEvidence)
      const next = createRichContent([...blocks, {
        type: 'image', asset_id: assetId, alt: alt.trim(), caption: caption.trim(),
      }])
      const source = URL.createObjectURL(file)
      sourcesRef.current[assetId] = source
      setLocalSources({ ...sourcesRef.current })
      onChange(next)
      setFile(null)
      setAlt('')
      setCaption('')
      setRightsEvidence('')
      setNotice('Image verified and stored privately. Save the question to attach this image to its next revision.')
      setError('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The image could not be verified or saved privately.')
    } finally {
      setUploading(false)
    }
  }
  function removeBlock(index: number) {
    const block = blocks[index]
    if (block?.type === 'image') {
      const source = sourcesRef.current[block.asset_id]
      if (source) {
        URL.revokeObjectURL(source)
        delete sourcesRef.current[block.asset_id]
        setLocalSources({ ...sourcesRef.current })
      }
    }
    commit(blocks.filter((_, itemIndex) => itemIndex !== index))
  }

  return <section aria-labelledby="rich-content-heading" className="mt-5 rounded-2xl border border-white/10 bg-black/10 p-4 sm:p-5">
    <div>
      <h4 id="rich-content-heading" className="text-base font-bold">Supplementary learning content</h4>
      <p className="mt-1 text-sm leading-6 text-white/60">Add formulas, labelled diagrams or small tables beneath the question stem. The main question and answer choices stay separate. Images are private and must pass independent rights review before publication.</p>
    </div>
    <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Choose rich content block">
      {(['paragraph', 'equation', 'table', 'image'] as const).map(kind =>
        <button key={kind} type="button" disabled={disabled || uploading} aria-pressed={mode === kind}
          className={button + (mode === kind ? ' border-purple-300/60 bg-purple-400/15' : '')}
          onClick={() => { setMode(kind); setError(''); setNotice('') }}>
          {kind === 'paragraph' ? 'Text block' : kind === 'equation' ? 'Equation' : kind === 'table' ? 'Table' : 'Diagram'}
        </button>
      )}
    </div>

    {mode === 'paragraph' && <div className="mt-4 space-y-3">
      <label className="block text-sm font-semibold">Additional text<textarea value={paragraph} onChange={e => setParagraph(e.target.value)} maxLength={6000} rows={3} className="field mt-2" disabled={disabled || uploading} placeholder="Add a definition, instruction or supporting note."/></label>
      <button type="button" disabled={disabled || uploading || !paragraph.trim()} className={button} onClick={addTextBlock}>Add text block</button>
    </div>}
    {mode === 'equation' && <div className="mt-4 space-y-3">
      <label className="block text-sm font-semibold">Equation or formula<textarea value={expression} onChange={e => setExpression(e.target.value)} maxLength={1000} rows={2} className="field mt-2" disabled={disabled || uploading} placeholder="e.g. A = l × w"/></label>
      <label className="block text-sm font-semibold">Accessible spoken description<input value={spoken} onChange={e => setSpoken(e.target.value)} maxLength={400} className="field mt-2" disabled={disabled || uploading} placeholder="Explain the formula in words"/></label>
      <button type="button" disabled={disabled || uploading || !expression.trim() || !spoken.trim()} className={button} onClick={addEquationBlock}>Add equation</button>
    </div>}
    {mode === 'table' && <div className="mt-4 space-y-3">
      <label className="block text-sm font-semibold">Table caption<input value={tableCaption} onChange={e => setTableCaption(e.target.value)} maxLength={240} className="field mt-2" disabled={disabled || uploading} placeholder="e.g. Values from the experiment"/></label>
      <label className="block text-sm font-semibold">Table data<textarea value={tableInput} onChange={e => setTableInput(e.target.value)} maxLength={12000} rows={5} className="field mt-2 font-mono text-sm" disabled={disabled || uploading} placeholder={'Length\tWidth\n3 m\t2 m\n4 m\t5 m'}/></label>
      <p className="text-xs leading-5 text-white/50">Use the first line for column headings and one line per row. Separate columns with the Tab key.</p>
      <button type="button" disabled={disabled || uploading || !tableCaption.trim() || !tableInput.trim()} className={button} onClick={addTableBlock}>Add table</button>
    </div>}
    {mode === 'image' && <div className="mt-4 space-y-3">
      {!canUpload && <p role="note" className="rounded-lg border border-amber-300/20 bg-amber-200/5 p-3 text-sm text-amber-100">Save this as a private draft first. Reopen the saved draft to upload a diagram.</p>}
      <label className="block text-sm font-semibold">Diagram file<input type="file" accept="image/png,image/jpeg,image/webp" disabled={disabled || uploading || !canUpload} onChange={e => setFile(e.target.files?.[0] ?? null)} className="field mt-2"/></label>
      <label className="block text-sm font-semibold">Image description (required)<textarea value={alt} onChange={e => setAlt(e.target.value)} maxLength={500} minLength={8} rows={2} className="field mt-2" disabled={disabled || uploading || !canUpload} placeholder="Describe the useful information shown in the diagram."/></label>
      <label className="block text-sm font-semibold">Caption (optional)<input value={caption} onChange={e => setCaption(e.target.value)} maxLength={240} className="field mt-2" disabled={disabled || uploading || !canUpload}/></label>
      <label className="block text-sm font-semibold">Image ownership / permission evidence<textarea value={rightsEvidence} onChange={e => setRightsEvidence(e.target.value)} maxLength={4000} minLength={8} rows={3} className="field mt-2" disabled={disabled || uploading || !canUpload} placeholder="State who created the image or what permission covers its use."/></label>
      <p className="text-xs leading-5 text-white/50">Accepted formats: PNG, JPEG and WebP. Maximum 2 MiB. The server decodes and re-encodes the image; a file extension alone is never trusted.</p>
      <button type="button" disabled={disabled || uploading || !canUpload || !file || alt.trim().length < 8 || rightsEvidence.trim().length < 8}
        className={button} onClick={() => void addImageBlock()}>{uploading ? 'Verifying private image…' : 'Upload and attach diagram'}</button>
    </div>}

    {error && <p role="alert" className="mt-4 text-sm text-red-200">{error}</p>}
    {notice && <p role="status" className="mt-4 text-sm text-emerald-200">{notice}</p>}
    <div className="mt-5">
      <h5 className="text-sm font-bold">Added content ({blocks.length}/24)</h5>
      {!blocks.length
        ? <p className="mt-2 text-sm text-white/45">No supplementary content yet. Text-only questions continue to work as before.</p>
        : <ol className="mt-3 space-y-3">{blocks.map((block, index) => <li key={block.type + '-' + index} className="rounded-xl border border-white/10 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-purple-200">{block.type}</span>
            <button type="button" disabled={disabled || uploading} className={button} onClick={() => removeBlock(index)}>Remove block</button>
          </div>
          <div className="mt-2">
            {block.type === 'paragraph' && <p className="whitespace-pre-wrap break-words text-sm">{block.text}</p>}
            {block.type === 'equation' && <div><p className="font-mono text-sm">{block.expression}</p><p className="mt-1 text-xs text-white/50">{block.spoken}</p></div>}
            {block.type === 'table' && <p className="text-sm">{block.caption} · {block.headers.length} columns × {block.rows.length} rows</p>}
            {block.type === 'image' && <p className="break-words text-sm">{block.alt}{block.caption ? ' · ' + block.caption : ''}<span className="mt-1 block break-all text-xs text-white/40">Private asset ID: {block.asset_id}</span></p>}
          </div>
        </li>)}</ol>}
    </div>
    {value && <div className="mt-5 rounded-xl border border-white/10 p-3">
      <h5 className="text-sm font-bold">Safe content preview</h5>
      <div className="mt-2"><AdminRichContentPreview questionId={questionId} questionVersion={questionVersion} value={value} localImageSources={localSources}/></div>
    </div>}
  </section>
}
