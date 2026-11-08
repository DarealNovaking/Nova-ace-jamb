/**
 * FCB-03 SOURCE-ONLY scheduled cleanup worker.
 * It is inert until a private bucket, dedicated DB executor and scheduler
 * secret are separately provisioned. Never expose this route to browser users.
 */
import { createClient } from 'npm:@supabase/supabase-js@2.57.0'
import postgres from 'npm:postgres@3.4.7'
import { createQuestionMediaCleanupHandler } from '../_shared/questionMediaCleanup.ts'
const url=Deno.env.get('SUPABASE_URL')
const serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const databaseUrl=Deno.env.get('ACE_MEDIA_DATABASE_URL')
const bucket=Deno.env.get('ACE_PRIVATE_MEDIA_BUCKET')
const secret=Deno.env.get('ACE_MEDIA_CLEANUP_TOKEN')
const ready=Boolean(url&&serviceKey&&databaseUrl&&bucket==='ace-question-media-private'&&secret&&secret.length>=32)
const storage=ready?createClient(url!,serviceKey!,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}):null
const db=ready?postgres(databaseUrl!,{max:1,prepare:false,ssl:'require',idle_timeout:10,connect_timeout:5}):null
async function databaseAsExecutor<T>(query:(transaction:any)=>Promise<T>):Promise<T>{
 if(!db)throw Error('Cleanup database unavailable')
 return(await db.begin(async tx=>{
  const identity=await tx.unsafe('select session_user::text as session_name')
  if(identity.length!==1||identity[0].session_name!=='ace_media_executor')
   throw Error('Unexpected cleanup database identity')
  return query(tx)
 })) as unknown as T
}
const handle=ready?createQuestionMediaCleanupHandler({
 secret:secret!,
 async claim(limit){
  return databaseAsExecutor(async tx=>{
   const rows=await tx.unsafe('select * from ace.claim_expired_question_media_cleanup($1::integer)',[limit])
   return rows
  })
 },
 async remove(path){
  const {error}=await storage!.storage.from('ace-question-media-private').remove([path])
  return !error
 },
 async complete(intentId,claimToken){
  return databaseAsExecutor(async tx=>{
   const rows=await tx.unsafe('select ace.complete_question_media_cleanup($1::uuid,$2::uuid) as completed',[intentId,claimToken])
   return rows.length===1&&rows[0].completed===true
  })
 },
}):null
Deno.serve(async request=>{
 if(!ready||!handle)return Response.json({error:'Cleanup worker unavailable'},{status:503,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}})
 return handle(request)
})
