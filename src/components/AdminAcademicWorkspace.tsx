import { useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, CheckCircle2, CircleAlert, FilePlus2, Loader2, Plus, RefreshCw, ShieldCheck } from 'lucide-react'
import { ace } from '../lib/supabase'
import { listSeasons, type ExamSeason, type SyllabusVersion, type SyllabusTopic, type SyllabusSubtopic } from '../lib/seasonService'

type Subject = { id: string; code: string; name: string }
type VersionRow = SyllabusVersion & { season?: ExamSeason; subject?: Subject }

const inputClass = 'mt-1 w-full rounded-xl border border-white/10 bg-[#100c19] px-3 py-3 text-sm text-white outline-none focus:border-purple-300/60'
const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-xl bg-purple-300 px-4 py-3 text-sm font-bold text-[#120b1c] transition hover:bg-purple-200 disabled:cursor-not-allowed disabled:opacity-40'
const secondaryClass = 'inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/5 disabled:opacity-40'

export default function AdminAcademicWorkspace({ canApprove = false }: { canApprove?: boolean }) {
  const [seasons, setSeasons] = useState<ExamSeason[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [versions, setVersions] = useState<VersionRow[]>([])
  const [selectedVersionId, setSelectedVersionId] = useState('')
  const [topics, setTopics] = useState<SyllabusTopic[]>([])
  const [subtopics, setSubtopics] = useState<SyllabusSubtopic[]>([])
  const [selectedTopicId, setSelectedTopicId] = useState('')
  const [seasonId, setSeasonId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [sourceTitle, setSourceTitle] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [versionTitle, setVersionTitle] = useState('')
  const [topicName, setTopicName] = useState('')
  const [topicDescription, setTopicDescription] = useState('')
  const [subtopicName, setSubtopicName] = useState('')
  const [subtopicDescription, setSubtopicDescription] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [treeLoading, setTreeLoading] = useState(false)
  const [loadedTreeVersionId, setLoadedTreeVersionId] = useState('')
  const treeRun = useRef(0)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const selectedVersion = versions.find((item) => item.id === selectedVersionId) ?? null
  const selectedTopic = topics.find((item) => item.id === selectedTopicId) ?? null
  const selectedSubject = subjects.find((item) => item.id === selectedVersion?.subject_id) ?? null
  const isDraft = selectedVersion?.status === 'draft'
  const canEditDraft = isDraft && (canApprove || selectedVersion?.rights_status === 'pending')
  const treeReady = !treeLoading && selectedVersionId !== '' && loadedTreeVersionId === selectedVersionId

  const versionOptions = useMemo(() => versions.map((version) => {
    const subject = subjects.find((item) => item.id === version.subject_id)
    const season = seasons.find((item) => item.id === version.season_id)
    return { ...version, label: `${season?.name ?? 'Season'} · ${subject?.name ?? 'Subject'} · v${version.version} · ${version.status} · rights ${version.rights_status}` }
  }), [versions, subjects, seasons])

  async function loadWorkspace(preferredVersionId?: string) {
    setLoading(true)
    setLoadFailed(false)
    setError('')
    try {
      const [seasonRows, subjectResult, versionResult] = await Promise.all([
        listSeasons(),
        ace.from('subjects').select('id,code,name').eq('active', true).order('sort_order'),
        ace.from('syllabus_versions').select('*').order('updated_at', { ascending: false }),
      ])
      if (subjectResult.error) throw subjectResult.error
      if (versionResult.error) throw versionResult.error
      const nextSeasons = seasonRows
      const nextSubjects = (subjectResult.data ?? []) as Subject[]
      const nextVersions = (versionResult.data ?? []) as VersionRow[]
      setSeasons(nextSeasons)
      setSubjects(nextSubjects)
      setVersions(nextVersions)
      setSeasonId((current) => current || nextSeasons.find((item) => item.status === 'draft')?.id || nextSeasons[0]?.id || '')
      setSubjectId((current) => current || nextSubjects[0]?.id || '')
      const wanted = preferredVersionId ?? selectedVersionId
      const nextSelected = nextVersions.some((item) => item.id === wanted) ? wanted : nextVersions[0]?.id ?? ''
      setSelectedVersionId(nextSelected)
      if (nextSelected) await loadTree(nextSelected)
      else {
        treeRun.current += 1
        setTreeLoading(false)
        setLoadedTreeVersionId('')
        setTopics([])
        setSubtopics([])
        setSelectedTopicId('')
      }
      return true
    } catch {
      setLoadFailed(true)
      setError('Academic structure could not be loaded. Check your access and retry before editing.')
      return false
    } finally {
      setLoading(false)
    }
  }

  async function loadTree(versionId: string) {
    const run = ++treeRun.current
    setTreeLoading(true)
    setLoadedTreeVersionId('')
    // Never show a previous version's records while a new version is selected.
    setTopics([])
    setSubtopics([])
    setSelectedTopicId('')
    try {
      const [{ data: topicRows, error: topicError }, { data: subtopicRows, error: subtopicError }] = await Promise.all([
      ace.from('topics').select('id,subject_id,syllabus_version_id,name,description,sort_order,active').eq('syllabus_version_id', versionId).order('sort_order'),
      ace.from('subtopics').select('id,topic_id,syllabus_version_id,name,description,sort_order,active').eq('syllabus_version_id', versionId).order('sort_order'),
    ])
      if (run !== treeRun.current) return
      if (topicError) throw topicError
      if (subtopicError) throw subtopicError
      const nextTopics = (topicRows ?? []) as SyllabusTopic[]
      setTopics(nextTopics)
      setSubtopics((subtopicRows ?? []) as SyllabusSubtopic[])
      setSelectedTopicId((current) => nextTopics.some((item) => item.id === current) ? current : nextTopics[0]?.id ?? '')
      setLoadedTreeVersionId(versionId)
    } finally {
      if (run === treeRun.current) setTreeLoading(false)
    }
  }

  useEffect(() => { void loadWorkspace() }, [])

  async function runAction(action: () => Promise<void>, successMessage: string) {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await action()
      setNotice(successMessage)
    } catch (caught) {
      setError(caught instanceof Error && caught.message === 'ACADEMIC_RELOAD_FAILED'
        ? 'Your change may have saved, but the latest academic data could not be reloaded. Retry before further editing.'
        : 'The operation could not be completed. Check your access and retry.')
    } finally {
      setBusy(false)
    }
  }

  async function createVersion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const source = sourceUrl.trim()
    if (!seasonId || !subjectId) return setError('Choose a season and subject first.')
    if (!sourceTitle.trim()) return setError('Enter the source title for provenance.')
    try {
      const parsed = new URL(source)
      if (parsed.protocol !== 'https:') return setError('Use an HTTPS source URL.')
    } catch {
      return setError('Enter a valid HTTPS source URL.')
    }
    const season = seasons.find((item) => item.id === seasonId)
    const subject = subjects.find((item) => item.id === subjectId)
    if (!season || !subject) return setError('The selected season or subject is unavailable.')
    const title = versionTitle.trim() || `${season.name} · ${subject.name} syllabus`
    await runAction(async () => {
      const { data: latest, error: latestError } = await ace.from('syllabus_versions').select('version').eq('season_id', seasonId).eq('subject_id', subjectId).order('version', { ascending: false }).limit(1)
      if (latestError) throw latestError
      const version = ((latest ?? [])[0]?.version ?? 0) + 1
      const { data, error: insertError } = await ace.from('syllabus_versions').insert({
        season_id: seasonId,
        subject_id: subjectId,
        version,
        title,
        source_title: sourceTitle.trim(),
        source_url: source,
        rights_status: 'pending',
        status: 'draft',
        provenance: { source_title: sourceTitle.trim(), source_url: source, entered_via: 'admin-academic', recorded_at: new Date().toISOString() },
      }).select('id').single()
      if (insertError) throw insertError
      if (!(await loadWorkspace(data.id))) throw new Error('ACADEMIC_RELOAD_FAILED')
      setSourceTitle('')
      setSourceUrl('')
      setVersionTitle('')
    }, 'Draft syllabus version created. Rights remain pending until reviewed.')
  }

  async function addTopic(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedVersion || !canEditDraft) return setError('Select an editable draft syllabus version before editing topics.')
    if (!treeReady || busy) return setError('Wait for this syllabus version to finish loading before editing.')
    if (!topicName.trim()) return setError('Enter a topic name.')
    await runAction(async () => {
      const { error: insertError } = await ace.from('topics').insert({
        subject_id: selectedVersion.subject_id,
        syllabus_version_id: selectedVersion.id,
        name: topicName.trim(),
        description: topicDescription.trim() || null,
        sort_order: (Math.max(0, ...topics.map((item) => item.sort_order)) + 10),
        active: false,
      })
      if (insertError) throw insertError
      setTopicName('')
      setTopicDescription('')
      await loadTree(selectedVersion.id)
    }, 'Topic saved as inactive draft content.')
  }

  async function addSubtopic(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedVersion || !canEditDraft || !selectedTopic) return setError('Select a topic in an editable draft syllabus version first.')
    if (!treeReady || busy) return setError('Wait for this syllabus version to finish loading before editing.')
    if (!subtopicName.trim()) return setError('Enter a subtopic name.')
    await runAction(async () => {
      const siblingRows = subtopics.filter((item) => item.topic_id === selectedTopic.id)
      const { error: insertError } = await ace.from('subtopics').insert({
        topic_id: selectedTopic.id,
        syllabus_version_id: selectedVersion.id,
        name: subtopicName.trim(),
        description: subtopicDescription.trim() || null,
        sort_order: Math.max(0, ...siblingRows.map((item) => item.sort_order)) + 10,
        active: false,
      })
      if (insertError) throw insertError
      setSubtopicName('')
      setSubtopicDescription('')
      await loadTree(selectedVersion.id)
    }, 'Subtopic saved as inactive draft content.')
  }

  async function toggleActive(kind: 'topic' | 'subtopic', id: string, active: boolean) {
    if (!selectedVersion || !canEditDraft || !treeReady || busy) return
    await runAction(async () => {
      const table = kind === 'topic' ? 'topics' : 'subtopics'
      const { error: updateError } = await ace.from(table).update({ active }).eq('id', id).eq('syllabus_version_id', selectedVersion.id)
      if (updateError) throw updateError
      await loadTree(selectedVersion.id)
    }, `${kind === 'topic' ? 'Topic' : 'Subtopic'} marked ${active ? 'active for review' : 'inactive'}.`)
  }

  async function updateRights(rightsStatus: SyllabusVersion['rights_status']) {
    if (!canApprove || !selectedVersion || selectedVersion.status !== 'draft' || !treeReady || busy) return
    if (rightsStatus === 'approved' && (!selectedVersion.source_title || !selectedVersion.source_url)) {
      setError('A source title and source URL are required before rights can be approved.')
      return
    }
    const confirmed = rightsStatus === 'approved'
      ? window.confirm('Confirm that the source and rights/licensing status have been reviewed and approved?')
      : true
    if (!confirmed) return
    await runAction(async () => {
      const { error: updateError } = await ace.from('syllabus_versions').update({
        rights_status: rightsStatus,
        updated_at: new Date().toISOString(),
        provenance: { ...selectedVersion.provenance, rights_reviewed_at: new Date().toISOString(), rights_review_status: rightsStatus },
      }).eq('id', selectedVersion.id).eq('status', 'draft')
      if (updateError) throw updateError
      if (!(await loadWorkspace(selectedVersion.id))) throw new Error('ACADEMIC_RELOAD_FAILED')
    }, `Rights status updated to ${rightsStatus}.`)
  }

  async function activateVersion() {
    if (!canApprove || !selectedVersion || selectedVersion.status !== 'draft' || !treeReady || busy) return
    if (selectedVersion.rights_status !== 'approved') return setError('Rights must be approved before activation.')
    if (!topics.some((item) => item.active)) return setError('At least one active topic is required before activation.')
    if (!window.confirm('Activate this syllabus version? It will become visible to students and older versions for the same season/subject will be archived.')) return
    await runAction(async () => {
      const { error: activateError } = await ace.rpc('activate_syllabus_version', { p_syllabus_version_id: selectedVersion.id })
      if (activateError) throw activateError
      if (!(await loadWorkspace(selectedVersion.id))) throw new Error('ACADEMIC_RELOAD_FAILED')
    }, 'Syllabus version activated through the server-side validation function.')
  }

  if (loading) return <div role="status" aria-live="polite" aria-atomic="true" aria-busy="true" className="grid min-h-[50vh] place-items-center text-white"><Loader2 className="animate-spin" aria-hidden="true" /><span className="sr-only">Loading academic workspace…</span></div>
  if (loadFailed) return <section role="alert" className="rounded-2xl border border-red-400/20 bg-red-500/10 p-6 text-red-100"><p>{error || 'Academic data is unavailable.'} Any recent edits must be confirmed by reloading before you make more changes.</p><button type="button" className="mt-4 min-h-11 rounded-xl border border-white/25 px-4 py-2 font-semibold" onClick={() => void loadWorkspace()}>Retry loading academic structure</button></section>

  return (
    <div className="space-y-6">
      {error && <div role="alert" className="flex gap-3 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100"><CircleAlert className="shrink-0" size={18}/><p>{error}</p></div>}
      {notice && <div role="status" className="flex gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100"><CheckCircle2 className="shrink-0" size={18}/><p>{notice}</p></div>}

      <section className="rounded-3xl border border-white/10 bg-white/[.035] p-5 sm:p-7">
        <div className="flex items-start gap-3"><FilePlus2 className="mt-1 text-purple-200"/><div><h2 className="text-xl font-black">Create a draft syllabus version</h2><p className="mt-1 text-sm leading-6 text-white/50">Every version starts as a draft with rights pending. Record the source before adding content; nothing is published automatically.</p></div></div>
        <form onSubmit={createVersion} className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="text-sm text-white/70">Exam season<select className={inputClass} value={seasonId} onChange={(e) => setSeasonId(e.target.value)} required><option value="">Choose season</option>{seasons.map((season) => <option key={season.id} value={season.id}>{season.name} · {season.status}</option>)}</select></label>
          <label className="text-sm text-white/70">Subject<select className={inputClass} value={subjectId} onChange={(e) => setSubjectId(e.target.value)} required><option value="">Choose subject</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name} ({subject.code})</option>)}</select></label>
          <label className="text-sm text-white/70">Version title<input className={inputClass} value={versionTitle} onChange={(e) => setVersionTitle(e.target.value)} maxLength={160} placeholder="Defaults to season + subject syllabus"/></label>
          <label className="text-sm text-white/70">Source title<input className={inputClass} value={sourceTitle} onChange={(e) => setSourceTitle(e.target.value)} maxLength={200} required placeholder="Official document or source name"/></label>
          <label className="text-sm text-white/70 md:col-span-2">HTTPS source URL<input className={inputClass} type="url" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} required placeholder="https://…"/></label>
          <div className="md:col-span-2"><button type="submit" className={buttonClass} disabled={busy}><Plus size={16}/> Create draft version</button></div>
        </form>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[.035] p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><h2 className="text-xl font-black">Syllabus review</h2><p className="mt-1 text-sm text-white/50">Review provenance, rights, topics and activation status.</p></div>
          <button type="button" className={secondaryClass} onClick={() => void loadWorkspace()} disabled={busy}><RefreshCw size={15}/> Refresh</button>
        </div>
        <label className="mt-4 block max-w-3xl text-sm text-white/70">Syllabus version<select className={inputClass} value={selectedVersionId} disabled={busy} onChange={async (e) => { const id = e.target.value; setSelectedVersionId(id); setError(''); setNotice(''); if (id) { try { await loadTree(id) } catch { setError('Unable to load this syllabus version. Retry or refresh the workspace.') } } else { treeRun.current += 1; setTreeLoading(false); setLoadedTreeVersionId(''); setTopics([]); setSubtopics([]); setSelectedTopicId('') } }}><option value="">No versions created</option>{versionOptions.map((version) => <option key={version.id} value={version.id}>{version.label}</option>)}</select></label>

        {selectedVersion && treeLoading && <p role="status" className="mt-4 text-sm text-white/55">Loading selected syllabus topics…</p>}
        {selectedVersion && !treeLoading && !treeReady && <p role="alert" className="mt-4 text-sm text-amber-100">This version's topics are not available. Refresh before editing.</p>}
        {selectedVersion && <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div><p className="font-bold">{selectedVersion.title}</p><p className="mt-1 text-xs text-white/45">{selectedSubject?.name ?? 'Subject'} · version {selectedVersion.version} · {seasons.find((s) => s.id === selectedVersion.season_id)?.name ?? 'Season'}</p><p className="mt-2 break-all text-xs text-purple-200/80">{selectedVersion.source_title || 'No source title'}{selectedVersion.source_url ? ` · ${selectedVersion.source_url}` : ''}</p></div>
            <div className="flex flex-wrap gap-2"><span className="rounded-full border border-white/10 px-3 py-1 text-xs">{selectedVersion.status}</span><span className="rounded-full border border-white/10 px-3 py-1 text-xs">Rights: {selectedVersion.rights_status}</span></div>
          </div>
          {canApprove && selectedVersion.status === 'draft' && <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="text-sm text-white/70">Rights review<select className={inputClass} disabled={busy || !treeReady} value={selectedVersion.rights_status} onChange={(e) => void updateRights(e.target.value as SyllabusVersion['rights_status'])}><option value="pending">Pending</option><option value="approved">Approved</option><option value="restricted">Restricted</option><option value="rejected">Rejected</option></select></label>
            <button type="button" className={buttonClass} disabled={busy || !treeReady || selectedVersion.rights_status !== 'approved' || !topics.some((item) => item.active)} onClick={() => void activateVersion()}><ShieldCheck size={16}/> Activate version</button>
          </div>}
          {selectedVersion.status === 'active' && <p className="mt-4 text-sm text-emerald-200">This version is active and its approved content may be visible to students.</p>}
        </div>}

        {selectedVersion && isDraft && !canEditDraft && <p className="mt-4 text-sm text-white/55">This draft has undergone rights review. Only an administrator can edit reviewed content; editors can author pending drafts.</p>}
        {selectedVersion && canEditDraft && <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 p-4">
            <h3 className="font-bold">Topics</h3>
            <form onSubmit={addTopic} className="mt-3 space-y-3">
              <label className="block text-sm text-white/70">Topic name<input className={inputClass} value={topicName} onChange={(e) => setTopicName(e.target.value)} maxLength={200} required/></label>
              <label className="block text-sm text-white/70">Description (optional)<textarea className={inputClass} value={topicDescription} onChange={(e) => setTopicDescription(e.target.value)} rows={2} maxLength={2000}/></label>
              <button type="submit" className={buttonClass} disabled={busy || !treeReady}><Plus size={15}/> Add inactive topic</button>
            </form>
            <ul className="mt-4 space-y-2">{topics.map((topic) => <li key={topic.id} className="flex items-start justify-between gap-3 rounded-xl bg-white/[.035] p-3"><button type="button" onClick={() => setSelectedTopicId(topic.id)} className="min-w-0 text-left"><span className="block font-semibold">{topic.name}</span><span className="text-xs text-white/45">{topic.active ? 'Active for review' : 'Inactive draft'} · order {topic.sort_order}</span></button><button type="button" className={secondaryClass} onClick={() => void toggleActive('topic', topic.id, !topic.active)} disabled={busy || !treeReady}>{topic.active ? 'Deactivate' : 'Mark active'}</button></li>)}</ul>
            {!topics.length && <p className="mt-3 text-sm text-white/45">No topics yet. Add verified source-backed syllabus topics.</p>}
          </div>
          <div className="rounded-2xl border border-white/10 p-4">
            <h3 className="font-bold">Subtopics</h3>
            <p className="mt-1 text-sm text-white/45">{selectedTopic ? `Under: ${selectedTopic.name}` : 'Select a topic to add subtopics.'}</p>
            <form onSubmit={addSubtopic} className="mt-3 space-y-3">
              <label className="block text-sm text-white/70">Parent topic<select className={inputClass} value={selectedTopicId} onChange={(e) => setSelectedTopicId(e.target.value)} required><option value="">Choose topic</option>{topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}</select></label>
              <label className="block text-sm text-white/70">Subtopic name<input className={inputClass} value={subtopicName} onChange={(e) => setSubtopicName(e.target.value)} maxLength={200} required/></label>
              <label className="block text-sm text-white/70">Description (optional)<textarea className={inputClass} value={subtopicDescription} onChange={(e) => setSubtopicDescription(e.target.value)} rows={2} maxLength={2000}/></label>
              <button type="submit" className={buttonClass} disabled={busy || !treeReady || !selectedTopic}><Plus size={15}/> Add inactive subtopic</button>
            </form>
            <ul className="mt-4 space-y-2">{subtopics.filter((item) => item.topic_id === selectedTopicId).map((item) => <li key={item.id} className="flex items-start justify-between gap-3 rounded-xl bg-white/[.035] p-3"><div><p className="font-semibold">{item.name}</p><p className="text-xs text-white/45">{item.active ? 'Active for review' : 'Inactive draft'} · order {item.sort_order}</p></div><button type="button" className={secondaryClass} onClick={() => void toggleActive('subtopic', item.id, !item.active)} disabled={busy || !treeReady}>{item.active ? 'Deactivate' : 'Mark active'}</button></li>)}</ul>
            {!subtopics.some((item) => item.topic_id === selectedTopicId) && <p className="mt-3 text-sm text-white/45">No subtopics for this topic yet.</p>}
          </div>
        </div>}
        {!versions.length && <div className="mt-5 rounded-2xl border border-dashed border-white/15 p-6 text-center"><BookOpen className="mx-auto text-white/35"/><p className="mt-3 font-semibold">No syllabus versions found</p><p className="mt-1 text-sm text-white/45">Create a draft above using a verified source. This workspace does not invent syllabus content.</p></div>}
      </section>
      <p className="text-xs leading-5 text-white/35">All authoring actions are subject to Supabase row-level security. New topics and subtopics start inactive. Activation uses the existing server-side RPC and requires approved rights plus at least one active topic.</p>
    </div>
  )
}
