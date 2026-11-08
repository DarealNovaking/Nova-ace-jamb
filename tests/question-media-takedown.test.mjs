import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import ts from 'typescript'
const source=readFileSync(new URL('../supabase/functions/_shared/questionMediaTakedown.ts',import.meta.url),'utf8')
const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText
const {createQuestionMediaTakedownHandler}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'))
const actor='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const question='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const asset='cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const audit='dddddddd-dddd-4ddd-8ddd-dddddddddddd'
const token='valid-test-access-token-123456789'
function setup(overrides={}){
 const calls={auth:[],takedown:[]}
 const handler=createQuestionMediaTakedownHandler({
  async authenticate(value){calls.auth.push(value);return{id:actor}},
  async takedown(...args){
   calls.takedown.push(args)
   return{id:audit,decision:'rejected',status:'revoked'}
  },
  ...overrides,
 })
 const request=(body={question_id:question,asset_id:asset,reason:'Rights holder withdrew permission.'},options={})=>{
  const method=options.method??'POST'
  return new Request('https://edge.invalid/takedown',{
   method,
   headers:{
    ...(options.authorization===undefined?{authorization:'Bearer '+token}:{authorization:options.authorization}),
    'content-type':options.contentType??'application/json',
   },
   ...(method==='GET'?{}:{body:typeof body==='string'?body:JSON.stringify(body)}),
  })
 }
 return{handler,calls,request}
}
test('authenticated administrator takedown returns only question and asset identifiers',async()=>{
 const h=setup(),response=await h.handler(h.request({question_id:question,asset_id:asset,reason:'  Rights holder withdrew permission.  '}))
 assert.equal(response.status,200)
 assert.deepEqual(await response.json(),{question_id:question,asset_id:asset,status:'revoked'})
 assert.deepEqual(h.calls.auth,[token])
 assert.deepEqual(h.calls.takedown,[[actor,question,asset,'Rights holder withdrew permission.']])
 assert.equal(response.headers.get('cache-control'),'private, no-store, max-age=0')
 assert.equal(response.headers.get('x-content-type-options'),'nosniff')
})
test('method, bearer and content-type failures never call the database',async()=>{
 const h=setup()
 assert.equal((await h.handler(h.request(undefined,{method:'GET'}))).status,405)
 assert.equal((await h.handler(h.request(undefined,{authorization:'Basic '+token}))).status,401)
 assert.equal((await h.handler(h.request(undefined,{contentType:'text/plain'}))).status,415)
 assert.equal(h.calls.takedown.length,0)
})
test('malformed, oversized and extra-field requests are rejected before takedown',async()=>{
 const h=setup()
 assert.equal((await h.handler(h.request('{bad-json'))).status,400)
 assert.equal((await h.handler(h.request({question_id:question,asset_id:asset,reason:'Rights holder withdrew permission.',storage_path:'published/private'}))).status,400)
 const oversized=await h.handler(new Request('https://edge.invalid/takedown',{
  method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json','content-length':'5000'},
  body:JSON.stringify({question_id:question,asset_id:asset,reason:'x'.repeat(5000)}),
 }))
 assert.equal(oversized.status,413)
 assert.equal(h.calls.takedown.length,0)
})
test('invalid identifiers and short reasons never reach the database',async()=>{
 const h=setup()
 assert.equal((await h.handler(h.request({question_id:'not-a-uuid',asset_id:asset,reason:'Rights holder withdrew permission.'}))).status,400)
 assert.equal((await h.handler(h.request({question_id:question,asset_id:asset,reason:'short'}))).status,400)
 assert.equal(h.calls.takedown.length,0)
})
test('failed authentication never reaches the database',async()=>{
 const h=setup({async authenticate(){return null}})
 assert.equal((await h.handler(h.request())).status,401)
 assert.equal(h.calls.takedown.length,0)
})
test('unconfirmed or malformed database outcomes fail closed',async()=>{
 const malformed=setup({async takedown(){return{id:audit,decision:'approved',status:'published'}}})
 assert.equal((await malformed.handler(malformed.request())).status,409)
 const failure=setup({async takedown(){throw Error('database unavailable')}})
 assert.equal((await failure.handler(failure.request())).status,409)
})
