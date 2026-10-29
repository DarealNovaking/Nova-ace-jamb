import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'
const require=createRequire(import.meta.url)
const modules=Object.fromEntries(['react','react/jsx-runtime','lucide-react'].map(name=>[name,pathToFileURL(require.resolve(name)).href]))
const code=ts.transpileModule(readFileSync(new URL('../src/components/DashboardShell.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText.replace(/from (["'])([^"']+)\1/g,(_,q,name)=>'from '+JSON.stringify(modules[name]??name))
const {default:Shell}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'))
const render=props=>renderToStaticMarkup(createElement(Shell,{children:createElement('main',null,'Protected content'),...props}))
test('student shell has named navigation and active home destination',()=>{
 const html=render({area:'student',activeId:'home',displayName:'Test Student',onStudentNavigate(){}})
 assert.match(html,/aria-label="Preparation tools"/);assert.match(html,/aria-current="page"/);assert.match(html,/Account &amp; settings/);assert.match(html,/Learn Approved syllabus topics/);assert.doesNotMatch(html,/href="\/admin/)
})
test('admin shell links the three workspaces and identifies current route',()=>{
 const html=render({area:'admin',activeId:'questions'})
 for(const path of ['/admin','/admin-academic','/admin-questions'])assert.ok(html.includes(`href="${path}"`))
 assert.match(html,/aria-label="Administration navigation"/);assert.match(html,/Administration/);assert.match(html,/aria-current="page"/)
})
test('editor navigation omits the privileged admin overview',()=>{
 const html=render({area:'editor',activeId:'academic'})
 assert.ok(html.includes('href="/admin-academic"'));assert.ok(html.includes('href="/admin-questions"'));assert.ok(!html.includes('href="/admin"'));assert.match(html,/Content editor/)
})
test('identity is safely escaped and navigation never includes a signout mutation',()=>{
 const html=render({area:'student',activeId:'learn',displayName:'<script>alert(1)</script>',onStudentNavigate(){}})
 assert.ok(!html.includes('<script>'));assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/Sign out/)
})
test('skip link precedes the workspace navigation in keyboard order',()=>{
 const html=render({area:'student',activeId:'home',onStudentNavigate(){}})
 assert.ok(html.indexOf('Skip to dashboard content')>=0)
 assert.ok(html.indexOf('Skip to dashboard content')<html.indexOf('ACE JAMB home'))
})
