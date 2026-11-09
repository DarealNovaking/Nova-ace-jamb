import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import ts from 'typescript'
const source=readFileSync(new URL('../supabase/functions/_shared/questionMediaCleanup.ts',import.meta.url),'utf8')
const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText
const {createQuestionMediaCleanupHandler}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'))
const secret='a'.repeat(48)
const question='07000000-0000-4000-8000-000000000004'
const asset='07000000-0000-4000-8000-00000000000b'
const token='07000000-0000-4000-8000-00000000000c'
const claim={intent_id:asset,question_id:question,claim_token:token,storage_path:`staging/v1/${question}/${asset}`}
function setup(overrides={}){
 const calls={claim:0,remove:[],complete:[]}
 const handler=createQuestionMediaCleanupHandler({
  secret,
  async claim(limit){calls.claim++;assert.equal(limit,20);return[claim]},
  async remove(path){calls.remove.push(path);return true},
  async complete(id,claimToken){calls.complete.push([id,claimToken]);return true},
  ...overrides,
 })
 const request=(auth='Bearer '+secret,method='POST',body=null)=>new Request('https://edge.invalid/cleanup',{
  method,headers:{authorization:auth,...(body===null?{}:{'content-type':'application/json'})},body,
 })
 return{handler,calls,request}
}
test('valid scheduler request deletes only a server-owned staging path and completes its claim',async()=>{
 const h=setup(),response=await h.handler(h.request())
 assert.equal(response.status,200)
 assert.deepEqual(await response.json(),{claimed:1,removed:1,completed:1})
 assert.deepEqual(h.calls.remove,[claim.storage_path])
 assert.deepEqual(h.calls.complete,[[asset,token]])
})
test('invalid secret and non-POST requests do not claim or delete objects',async()=>{
 const h=setup()
 assert.equal((await h.handler(h.request('Bearer '+'b'.repeat(48)))).status,401)
 assert.equal((await h.handler(h.request('Bearer '+secret,'GET'))).status,405)
 assert.equal(h.calls.claim,0)
 assert.equal(h.calls.remove.length,0)
})
test('client-supplied body is rejected before database access',async()=>{
 const h=setup()
 assert.equal((await h.handler(h.request('Bearer '+secret,'POST','{}'))).status,400)
 assert.equal(h.calls.claim,0)
})
test('malformed or non-staging claims never reach Storage',async()=>{
 const h=setup({async claim(){return[{...claim,storage_path:'published/v1/'+question+'/5/'+asset}]}})
 assert.equal((await h.handler(h.request())).status,503)
 assert.equal(h.calls.remove.length,0)
})
test('storage deletion failure leaves the database claim for lease-based retry',async()=>{
 const h=setup({async remove(){return false}})
 assert.equal((await h.handler(h.request())).status,503)
 assert.equal(h.calls.complete.length,0)
})
test('database completion failure is not reported as successful cleanup',async()=>{
 const h=setup({async complete(){return false}})
 assert.equal((await h.handler(h.request())).status,409)
 assert.equal(h.calls.remove.length,1)
})
test('oversized claim batches fail closed',async()=>{
 const h=setup({async claim(){return Array.from({length:21},()=>claim)}})
 assert.equal((await h.handler(h.request())).status,503)
 assert.equal(h.calls.remove.length,0)
})
