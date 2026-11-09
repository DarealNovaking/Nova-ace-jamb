/**
 * Server-only worker for abandoned private staging uploads.
 * Claims are issued by a least-privilege database RPC; object paths are
 * validated against database-owned question and asset IDs before deletion.
 */
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
type CleanupClaim={intent_id:string;question_id:string;storage_path:string;claim_token:string}
type Dependencies={
 secret:string
 claim(limit:number):Promise<unknown>
 remove(path:string):Promise<boolean>
 complete(intentId:string,claimToken:string):Promise<boolean>
}
function response(status:number,body:Record<string,unknown>){
 return Response.json(body,{status,headers:{
  'content-type':'application/json; charset=utf-8',
  'cache-control':'private, no-store, max-age=0',
  'x-content-type-options':'nosniff',
  'content-security-policy':"default-src 'none'; sandbox",
  'referrer-policy':'no-referrer',
 }})
}
function equalSecret(a:string,b:string):boolean{
 const left=new TextEncoder().encode(a),right=new TextEncoder().encode(b)
 let diff=left.length^right.length
 const length=Math.max(left.length,right.length)
 for(let i=0;i<length;i++)diff|=(left[i%Math.max(1,left.length)]??0)^(right[i%Math.max(1,right.length)]??0)
 return diff===0
}
function validClaim(value:unknown):value is CleanupClaim{
 if(!value||typeof value!=='object'||Array.isArray(value))return false
 const item=value as Record<string,unknown>
 return Object.keys(item).length===4&&
  typeof item.intent_id==='string'&&UUID.test(item.intent_id)&&
  typeof item.question_id==='string'&&UUID.test(item.question_id)&&
  typeof item.claim_token==='string'&&UUID.test(item.claim_token)&&
  item.storage_path===`staging/v1/${item.question_id}/${item.intent_id}`
}
export function createQuestionMediaCleanupHandler(deps:Dependencies){
 return async(request:Request):Promise<Response>=>{
  if(request.method!=='POST')return response(405,{error:'Method not allowed'})
  if(deps.secret.length<32)return response(503,{error:'Cleanup worker unavailable'})
  const auth=request.headers.get('authorization')||''
  if(!/^Bearer [^\s]{32,512}$/.test(auth)||!equalSecret(auth.slice(7),deps.secret))
   return response(401,{error:'Authentication required'})
  const length=request.headers.get('content-length')
  if((length!==null&&(!/^\d+$/.test(length)||Number(length)!==0))||request.body!==null)
   return response(400,{error:'Empty request required'})
  try{
   const raw=await deps.claim(20)
   if(!Array.isArray(raw)||raw.length>20||!raw.every(validClaim))
    return response(503,{error:'Cleanup worker unavailable'})
   let removed=0,completed=0
   for(const item of raw){
    const ok=await deps.remove(item.storage_path)
    if(!ok)return response(503,{error:'Cleanup will retry after its lease expires',removed,completed})
    removed++
    if(!await deps.complete(item.intent_id,item.claim_token))
     return response(409,{error:'Cleanup completion requires reconciliation',removed,completed})
    completed++
   }
   return response(200,{claimed:raw.length,removed,completed})
  }catch{
   return response(503,{error:'Cleanup worker unavailable'})
  }
 }
}
