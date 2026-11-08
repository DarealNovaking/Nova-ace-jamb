/**
 * FCB-03 SOURCE-ONLY audited image-rights takedown endpoint.
 * No Storage deletion is attempted: this immediately revokes future student
 * delivery through the database authorization record.
 */
import { createClient } from 'npm:@supabase/supabase-js@2.57.0'
import postgres from 'npm:postgres@3.4.7'
import { createQuestionMediaTakedownHandler } from '../_shared/questionMediaTakedown.ts'
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const url=Deno.env.get('SUPABASE_URL'),anonKey=Deno.env.get('SUPABASE_ANON_KEY')
const databaseUrl=Deno.env.get('ACE_MEDIA_DATABASE_URL')
const origin=Deno.env.get('ACE_MEDIA_ORIGIN')
const ready=Boolean(url&&anonKey&&databaseUrl&&origin&&/^https:\/\/[^/]+$/.test(origin))
const auth=ready?createClient(url!,anonKey!,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}):null
const db=ready?postgres(databaseUrl!,{max:1,prepare:false,ssl:'require',idle_timeout:10,connect_timeout:5}):null
async function databaseAsActor<T>(actorId:string,query:(transaction:any)=>Promise<T>):Promise<T>{
 if(!UUID.test(actorId)||!db)throw Error('Private media database unavailable')
 return(await db.begin(async tx=>{
  const identity=await tx.unsafe('select session_user::text as name')
  if(identity.length!==1||identity[0].name!=='ace_media_executor')
   throw Error('Unexpected media database identity')
  await tx.unsafe("select set_config('request.jwt.claim.sub',$1,true)",[actorId])
  return query(tx)
 })) as unknown as T
}
const handle=ready?createQuestionMediaTakedownHandler({
 async authenticate(token){
  const {data,error}=await auth!.auth.getUser(token)
  if(error||!data.user||!UUID.test(data.user.id))return null
  return{id:data.user.id}
 },
 async takedown(actorId,questionId,assetId,reason){
  return databaseAsActor(actorId,async tx=>{
   const rows=await tx.unsafe(
    'select ace.takedown_question_media($1::uuid,$2::uuid,$3::text) as value',
    [questionId,assetId,reason],
   )
   return rows[0]?.value??null
  })
 },
}):null
function unavailable(status:number):Response{
 return Response.json({error:'Media takedown unavailable'},{status,headers:{
  'cache-control':'private, no-store, max-age=0','x-content-type-options':'nosniff',
 }})
}
function cors(allowed:string,response:Response){
 const headers=new Headers(response.headers)
 headers.set('access-control-allow-origin',allowed)
 headers.set('access-control-allow-methods','POST, OPTIONS')
 headers.set('access-control-allow-headers','authorization, content-type, apikey, x-client-info')
 headers.set('access-control-max-age','600')
 headers.set('vary','Origin')
 headers.set('cache-control','private, no-store, max-age=0')
 return new Response(response.body,{status:response.status,headers})
}
Deno.serve(async request=>{
 const supplied=request.headers.get('origin')
 if(supplied&&supplied!==origin)return unavailable(403)
 if(!ready||!handle)return unavailable(503)
 if(request.method==='OPTIONS'){
  const response=new Response(null,{status:204,headers:{'cache-control':'no-store'}})
  return supplied?cors(supplied,response):response
 }
 const response=await handle(request)
 return supplied?cors(supplied,response):response
})
