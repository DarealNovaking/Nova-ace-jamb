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
const modules={react:pathToFileURL(require.resolve('react')).href,'react/jsx-runtime':pathToFileURL(require.resolve('react/jsx-runtime')).href,'../lib/questionWorkflowService':data('export const listQuestionHistory=async()=>null;export const restoreQuestion=async()=>null;')}
const code=ts.transpileModule(readFileSync(new URL('../src/components/AdminQuestionHistory.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText.replace(/from (["'])([^"']+)\1/g,(_,q,name)=>'from '+JSON.stringify(modules[name]??name))
const {default:History}=await import(data(code))
test('history opens with an accessible loading state and a close/refresh control',()=>{
 const html=renderToStaticMarkup(createElement(History,{initial:{id:'03000000-0000-4000-8000-000000000001',content_version:3,active:false,created_by:'03000000-0000-4000-8000-000000000001'},userId:'03000000-0000-4000-8000-000000000001',role:'admin',onClose(){},onRestored(){},onUncertain(){}}))
 assert.match(html,/Question version history/);assert.match(html,/Loading version history/);assert.match(html,/Close history and refresh questions/)
})
