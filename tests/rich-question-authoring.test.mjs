import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import ts from 'typescript'

const workflowSource = readFileSync(new URL('../src/lib/questionWorkflow.ts', import.meta.url), 'utf8')
const compile = code => ts.transpileModule(code, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText
const requireNative = createRequire(import.meta.url)
const load = (code, dependencies = {}) => {
  const module = { exports: {} }
  new Function('require', 'module', 'exports', code)(
    name => dependencies[name] ?? requireNative(name), module, module.exports,
  )
  return module.exports
}
const richSource = readFileSync(new URL('../src/lib/richContent.ts', import.meta.url), 'utf8')
const richContent = load(compile(richSource))
const workflow = load(compile(workflowSource), { './richContent': richContent })
const questionId = '03000000-0000-4000-8000-000000000001'
const draft = () => ({
  subject_id: questionId, topic_id: questionId, subtopic_id: null,
  stem: 'What is 3 + 4?', options: [
    { key: 'A', text: '5' }, { key: 'B', text: '6' }, { key: 'C', text: '7' }, { key: 'D', text: '8' },
  ], correct_option_key: 'C', explanation: 'Adding four to three gives seven.',
  difficulty: 'easy', exam: 'ACE practice', exam_year: null,
  provenance: { source_kind: 'original', source_title: 'ACE original', author_label: 'ACE team', source_url: null, rights_evidence: 'Original exercise.' },
})
const rich = () => ({
  version: 1,
  blocks: [
    { type: 'paragraph', text: 'Use this formula.' },
    { type: 'equation', expression: 'A = l × w', spoken: 'Area equals length multiplied by width' },
  ],
  fallback_text: 'Use this formula.\n\nA = l × w — Area equals length multiplied by width',
})

test('text-only question payloads stay backward compatible', () => {
  const validated = workflow.validateQuestionDraft(draft())
  assert.equal(Object.hasOwn(validated, 'rich_content'), false)
})
test('validated question drafts accept a strict rich document', () => {
  const validated = workflow.validateQuestionDraft({ ...draft(), rich_content: rich() })
  assert.equal(validated.rich_content.blocks.length, 2)
  assert.equal(validated.rich_content.fallback_text, rich().fallback_text)
})
test('invalid rich documents and unknown rich-content fields are rejected', () => {
  assert.throws(() => workflow.validateQuestionDraft({ ...draft(), rich_content: { ...rich(), html: '<script>' } }))
  assert.throws(() => workflow.validateQuestionDraft({ ...draft(), rich_content: { ...rich(), fallback_text: 'unrelated' } }))
  assert.throws(() => workflow.validateQuestionDraft({ ...draft(), rich_content: null, unsafe: true }))
})
test('authoring UI exposes bounded block types and requires saved draft for uploads', () => {
  const composer = readFileSync(new URL('../src/components/AdminRichContentComposer.tsx', import.meta.url), 'utf8')
  assert.match(composer, /Text block/)
  assert.match(composer, /Equation/)
  assert.match(composer, /Table/)
  assert.match(composer, /Diagram/)
  assert.match(composer, /Save this as a private draft first/)
  assert.match(composer, /uploadQuestionMedia/)
  const client = readFileSync(new URL('../src/lib/questionMediaClient.ts', import.meta.url), 'utf8')
  assert.match(client, /question-media-upload/)
  assert.doesNotMatch(composer, /dangerouslySetInnerHTML/)
})
test('rich media publication remains blocked until a promoted private object exists', () => {
  const queue = readFileSync(new URL('../src/components/AdminQuestionReviewQueue.tsx', import.meta.url), 'utf8')
  const sql = readFileSync(new URL('../supabase/proposals/fcb03_rich_question_workflow.sql', import.meta.url), 'utf8')
  assert.match(queue, /action==='publish'.*block\.type==='image'/)
  assert.match(sql, /Published media promotion required/)
  assert.match(sql, /question_media_reviews/)
})
