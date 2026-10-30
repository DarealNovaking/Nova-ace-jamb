import test from 'node:test'
import assert from 'node:assert/strict'
import { createQuestionMediaPreviewHandler } from '../supabase/functions/_shared/questionMediaPreview.ts'

const question='06000000-0000-4000-8000-000000000004'
const asset='06000000-0000-4000-8000-00000000000b'
const actor='06000000-0000-4000-8000-000000000001'
const bytes=new Uint8Array([1,2,3,4])
const sha='9f64a747e1b97f131fabb6b447296c9b6f0201e79fb3c5356e6c77e89b6a806a'
function harness(overrides={}) {
 let authCount=0,grantCount=0,readCount=0
 const deps={
  async authenticate(token){authCount++;return token==='valid-token'?{id:actor}:null},
  async authorize(a,q,v,id){grantCount++;return a===actor&&q===question&&v===2&&id===asset?{
   id,question_id:q,question_version:v,storage_path:'staging/v1/'+q+'/'+id,
   mime_type:'image/png',size_bytes:bytes.length,sha256:sha,
  }:null},
  storage:{async read(path){readCount++;return path==='staging/v1/'+question+'/'+asset?{bytes,mime:'image/png'}:null}},
  ...overrides,
 }
 return{handler:createQuestionMediaPreviewHandler(deps),counts:()=>({authCount,grantCount,readCount})}
}
const url='https://edge.invalid/question-media-preview?question_id='+question+'&question_version=2&asset_id='+asset
const request=(token='valid-token',u=url,headers={})=>new Request(u,{headers:{authorization:'Bearer '+token,...headers}})

test('private reviewer preview returns integrity-verified bytes with no-store headers',async()=>{
 const h=harness(),response=await h.handler(request())
 assert.equal(response.status,200)
 assert.equal(response.headers.get('cache-control'),'private, no-store, max-age=0')
 assert.equal(response.headers.get('x-content-type-options'),'nosniff')
 assert.equal(response.headers.get('content-type'),'image/png')
 assert.deepEqual(new Uint8Array(await response.arrayBuffer()),bytes)
})
test('anonymous and unauthorized previews never read private storage',async()=>{
 const h=harness()
 assert.equal((await h.handler(request('invalid-token'))).status,401)
 assert.equal((await h.handler(request('valid-token',url.replace('question_version=2','question_version=3')))).status,404)
 assert.deepEqual(h.counts(),{authCount:2,grantCount:1,readCount:0})
})
test('rejects malformed, duplicate, unknown and ranged requests',async()=>{
 const h=harness()
 assert.equal((await h.handler(request('valid-token',url+'&extra=1'))).status,400)
 assert.equal((await h.handler(request('valid-token',url+'&asset_id='+asset))).status,400)
 assert.equal((await h.handler(new Request(url,{method:'POST',headers:{authorization:'Bearer valid-token'}}))).status,405)
 assert.equal((await h.handler(request('valid-token',url,{range:'bytes=0-1'}))).status,416)
 assert.equal(h.counts().readCount,0)
})
test('rejects mismatched grants and corrupted private bytes',async()=>{
 const wrongGrant=harness({async authorize(a,q,v,id){return{
  id,question_id:q,question_version:v,storage_path:'staging/v1/'+q+'/other',
  mime_type:'image/png',size_bytes:4,sha256:sha,
 }}})
 assert.equal((await wrongGrant.handler(request())).status,404)
 const badBytes=harness({storage:{async read(){return{bytes:new Uint8Array([9,9,9,9]),mime:'image/png'}}}})
 assert.equal((await badBytes.handler(request())).status,404)
})
