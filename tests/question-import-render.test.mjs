import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'
const require=createRequire(import.meta.url)
const data=code=>'data:text/javascript;base64,'+Buffer.from(code).toString('base64')
const compile=path=>ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText
// Server rendering runs the real queue and React hooks. Network effects and editor
// children cannot run here, so only those boundaries/icons are substituted.
const modules={
  react:pathToFileURL(require.resolve('react')).href,
  'react/jsx-runtime':pathToFileURL(require.resolve('react/jsx-runtime')).href,
  'lucide-react':data('export const FileQuestion=()=>null;export const Loader2=()=>null;export const RefreshCw=()=>null;'),
  '../lib/authService':data('export const getCurrentUser=async()=>null;'),
  '../lib/questionWorkflowService':data('export const listQuestionReview=async()=>null;export const mutateQuestion=async()=>null;'),
  '../lib/questionWorkflow':data(compile('../src/lib/questionWorkflow.ts')),
  './AdminQuestionEditor':data('export default function Editor(){return null;}'),
  './AdminQuestionImport':data('export default function Import(){return null;}'),
}
const code=compile('../src/components/AdminQuestionReviewQueue.tsx').replace(/from (["'])([^"']+)\1/g,(_,q,name)=>'from '+JSON.stringify(modules[name]??name)).replace(/import\((["'])\.\/AdminQuestionImport\1\)/g,'import('+JSON.stringify(modules['./AdminQuestionImport'])+')')
const {default:Queue}=await import(data(code))
test('question workspace exposes a clearly named import entry while access loads',()=>{
  const html=renderToStaticMarkup(createElement(Queue))
  assert.match(html,/>Import questions<\/button>/)
  assert.match(html,/Loading question review records/)
})
