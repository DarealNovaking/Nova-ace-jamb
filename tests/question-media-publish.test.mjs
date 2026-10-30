import test from 'node:test'
import assert from 'node:assert/strict'
import { createQuestionMediaPublishHandler } from '../supabase/functions/_shared/questionMediaPublish.ts'

const question='06000000-0000-4000-8000-000000000004'
const asset='06000000-0000-4000-8000-00000000000b'
const bytes=new Uint8Array([1,2,3,4])
const sha='9f64a747e1b97f131fabb6b447296c9b6f0201e79fb3c5356e6c77e89b6a806a'
const source='staging/v1/'+question+'/'+asset
const target='published/v1/'+question+'/5/'+asset
function make(overrides={}) {
 const objects=new Map([[source,{bytes:new Uint8Array(bytes),mime:'image/png'}]])
 const calls={write:0,confirm:0,publish:0}
 const deps={
  async authenticate(token){return token==='valid-token'?{id:'06000000-0000-4000-8000-000000000002'}:null},
  async prepare(){return {question_id:question,approved_version:4,publish_version:5,assets:[{id:asset,source_path:source,target_path:target,mime_type:'image/png',size_bytes:4,sha256:sha,alt_text:'A labelled geometry diagram'}]}},
  async confirm(){calls.confirm++;return{id:asset,question_id:question,question_version:5,storage_path:target,mime_type:'image/png',size_bytes:4,sha256:sha}},
  async publish(){calls.publish++;return{id:question,content_version:5,review_status:'published',active:true}},
  storage:{
   async read(path){const value=objects.get(path);return value?{bytes:new Uint8Array(value.bytes),mime:value.mime}:null},
   async putIfAbsent(path,content,mime){calls.write++;if(objects.has(path))throw Error('exists');objects.set(path,{bytes:new Uint8Array(content),mime})},
  },
  ...overrides,
 }
 return{handler:createQuestionMediaPublishHandler(deps),objects,calls}
}
const request=(body={question_id:question,question_version:4},token='valid-token')=>new Request('https://edge.invalid/publish',{method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify(body)})

test('copies and verifies bytes before confirming metadata and publishing',async()=>{
 const h=make(),response=await h.handler(request())
 assert.equal(response.status,200)
 assert.deepEqual(await response.json(),{id:question,status:'published',version:5})
 assert.equal(h.calls.write,1);assert.equal(h.calls.confirm,1);assert.equal(h.calls.publish,1)
 assert.deepEqual(h.objects.get(target).bytes,bytes)
})
test('authentication and exact request shape are required',async()=>{
 const h=make()
 assert.equal((await h.handler(request({question_id:question,question_version:4,asset_id:asset}))).status,400)
 assert.equal((await h.handler(request(undefined,'invalid-token'))).status,401)
 assert.equal(h.calls.write,0);assert.equal(h.calls.confirm,0);assert.equal(h.calls.publish,0)
})
test('wrong staging digest prevents metadata confirmation and publication',async()=>{
 const h=make({storage:{async read(path){return path===source?{bytes:new Uint8Array([9,9,9,9]),mime:'image/png'}:null},async putIfAbsent(){throw Error('must not write')}}})
 assert.equal((await h.handler(request())).status,409)
 assert.equal(h.calls.confirm,0);assert.equal(h.calls.publish,0)
})
test('a wrong final publication readback is not reported as success',async()=>{
 const h=make({async publish(){h.calls.publish++;return{id:question,content_version:4,review_status:'approved',active:false}}})
 assert.equal((await h.handler(request())).status,409)
})
