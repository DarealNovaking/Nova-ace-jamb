/**
 * FCB-03 SOURCE-ONLY immutable media promotion and publication endpoint.
 * Not deployed. Uses only the narrow ace_media_executor DB login and private
 * bucket; no client-supplied paths, asset lists or storage URLs are accepted.
 */
import { createClient } from 'npm:@supabase/supabase-js@2.57.0'
import postgres from 'npm:postgres@3.4.7'
import { createQuestionMediaPublishHandler, type PromotionPlan } from '../_shared/questionMediaPublish.ts'
import type { SafeImageMime } from '../_shared/questionMedia.ts'
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const url=Deno.env.get('SUPABASE_URL'),anonKey=Deno.env.get('SUPABASE_ANON_KEY')
const serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),databaseUrl=Deno.env.get('ACE_MEDIA_DATABASE_URL')
const origin=Deno.env.get('ACE_MEDIA_ORIGIN'),bucket=Deno.env.get('ACE_PRIVATE_MEDIA_BUCKET')
const ready=Boolean(url&&anonKey&&serviceKey&&databaseUrl&&origin&&/^https:\/\/[^/]+$/.test(origin)&&bucket==='ace-question-media-private')
const auth=ready?createClient(url!,anonKey!,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}):null
const storage=ready?createClient(url!,serviceKey!,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}):null
const db=ready?postgres(databaseUrl!,{max:1,prepare:false,ssl:'require',idle_timeout:10,connect_timeout:5}):null
async function databaseAsActor<T>(actorId:string,query:(transaction:any)=>Promise<T>):Promise<T>{
 if(!UUID.test(actorId)||!db)throw Error('Private media database unavailable')
 return(await db.begin(async tx=>{
  const role=await tx.unsafe('select current_user::text as name')
  if(role.length!==1||role[0].name!=='ace_media_executor')throw Error('Unexpected media database identity')
  await tx.unsafe("select set_config('request.jwt.claim.sub',$1,true)",[actorId])
  return query(tx)
 })) as unknown as T
}
const handle=ready?createQuestionMediaPublishHandler({
 async authenticate(token){const {data,error}=await auth!.auth.getUser(token);if(error||!data.user||!UUID.test(data.user.id))return null;return{id:data.user.id}},
 async prepare(actorId,questionId,version){
  const result=await databaseAsActor(actorId,async tx=>{
   const rows=await tx.unsafe('select ace.prepare_question_media_publication($1::uuid,$2::integer) as value',[questionId,version])
   return rows[0]?.value??null
  })
  return result as PromotionPlan|null
 },
 async confirm(actorId,questionId,version,assetId){
  return await databaseAsActor(actorId,async tx=>{
   const rows=await tx.unsafe('select ace.confirm_question_media_promotion($1::uuid,$2::integer,$3::uuid) as value',[questionId,version,assetId])
   return rows[0]?.value??null
  })
 },
 async publish(actorId,questionId,version){
  const result=await databaseAsActor(actorId,async tx=>{
   const rows=await tx.unsafe("select ace.manage_question('publish',$1::uuid,$2::integer,'{}'::jsonb) as value",[questionId,version])
   return rows[0]?.value??null
  })
  return result
 },
 storage:{
  async read(path){const {data,error}=await storage!.storage.from('ace-question-media-private').download(path);if(error||!data||data.size<1||data.size>2*1024*1024)return null;return{bytes:new Uint8Array(await data.arrayBuffer()),mime:data.type}},
  async putIfAbsent(path,bytes,mime:SafeImageMime){const {error}=await storage!.storage.from('ace-question-media-private').upload(path,bytes,{contentType:mime,upsert:false,cacheControl:'0'});if(error)throw Error('Immutable private object write failed')}
 },
}):null
function error(status:number):Response{return Response.json({error:'Private image publication unavailable'},{status,headers:{'cache-control':'private, no-store','x-content-type-options':'nosniff'}})}
function cors(allowed:string,response:Response){const headers=new Headers(response.headers);headers.set('access-control-allow-origin',allowed);headers.set('access-control-allow-methods','POST, OPTIONS');headers.set('access-control-allow-headers','authorization, content-type, apikey, x-client-info');headers.set('access-control-max-age','600');headers.set('vary','Origin');headers.set('cache-control','private, no-store, max-age=0');return new Response(response.body,{status:response.status,headers})}
Deno.serve(async request=>{
 const supplied=request.headers.get('origin')
 if(supplied&&supplied!==origin)return error(403)
 if(!ready||!handle)return error(503)
 if(request.method==='OPTIONS'){const response=new Response(null,{status:204,headers:{'cache-control':'no-store'}});return supplied?cors(supplied,response):response}
 const response=await handle(request)
 return supplied?cors(supplied,response):response
})
