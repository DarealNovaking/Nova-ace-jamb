/**
 * FCB-03 SOURCE-ONLY private reviewer preview endpoint. Not deployed.
 * Requires the separately reviewed private bucket and ace_media_executor.
 */
import { createClient } from 'npm:@supabase/supabase-js@2.57.0'
import postgres from 'npm:postgres@3.4.7'
import { createQuestionMediaPreviewHandler } from '../_shared/questionMediaPreview.ts'
import type { QuestionMediaPreviewGrant } from '../_shared/questionMediaPreview.ts'
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
 return (await db.begin(async transaction=>{
  const role=await transaction.unsafe('select current_user::text as name')
  if(role.length!==1||role[0].name!=='ace_media_executor')throw Error('Unexpected media database identity')
  await transaction.unsafe("select set_config('request.jwt.claim.sub',$1,true)",[actorId])
  return query(transaction)
 })) as unknown as T
}
const handle=ready?createQuestionMediaPreviewHandler({
 async authenticate(token){const {data,error}=await auth!.auth.getUser(token);if(error||!data.user||!UUID.test(data.user.id))return null;return{id:data.user.id}},
 async authorize(actorId,questionId,version,assetId){
  const result=await databaseAsActor(actorId,async tx=>{
   const rows=await tx.unsafe('select ace.authorize_question_media_preview($1::uuid,$2::integer,$3::uuid) as value',[questionId,version,assetId])
   return rows[0]?.value??null
  })
  if(!result)return null
  if(result.id!==assetId||result.question_id!==questionId||result.question_version!==version||
   typeof result.storage_path!=='string'||typeof result.mime_type!=='string'||
   !Number.isSafeInteger(result.size_bytes)||typeof result.sha256!=='string')throw Error('Invalid preview grant')
  return result as QuestionMediaPreviewGrant
 },
 storage:{async read(path){const {data,error}=await storage!.storage.from('ace-question-media-private').download(path);if(error||!data||data.size<1||data.size>2*1024*1024)return null;return{bytes:new Uint8Array(await data.arrayBuffer()),mime:data.type}}},
}):null
function error(status:number):Response{return Response.json({error:'Private image unavailable'},{status,headers:{'cache-control':'private, no-store','x-content-type-options':'nosniff'}})}
function cors(allowed:string,response:Response){const headers=new Headers(response.headers);headers.set('access-control-allow-origin',allowed);headers.set('access-control-allow-methods','GET, OPTIONS');headers.set('access-control-allow-headers','authorization, apikey, x-client-info');headers.set('access-control-max-age','600');headers.set('vary','Origin');headers.set('cache-control','private, no-store, max-age=0');return new Response(response.body,{status:response.status,headers})}
Deno.serve(async request=>{
 const supplied=request.headers.get('origin')
 if(supplied&&supplied!==origin)return error(403)
 if(!ready||!handle)return error(503)
 if(request.method==='OPTIONS'){const response=new Response(null,{status:204,headers:{'cache-control':'no-store'}});return supplied?cors(supplied,response):response}
 const response=await handle(request)
 return supplied?cors(supplied,response):response
})
