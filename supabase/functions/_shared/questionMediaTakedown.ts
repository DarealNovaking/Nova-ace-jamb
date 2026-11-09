/**
 * FCB-03 authenticated, audited media-rights takedown.
 * The client supplies identifiers and a reason only; SQL resolves and revokes
 * the exact currently published asset. No object path or Storage URL is exposed.
 */
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
type Actor={id:string}
type TakedownResult={id:string;decision:'rejected';status:'revoked'}
type Dependencies={
 authenticate(token:string):Promise<Actor|null>
 takedown(actorId:string,questionId:string,assetId:string,reason:string):Promise<unknown>
}
function fail(status:number,message:string):Response{
 return Response.json({error:message},{status,headers:{
  'content-type':'application/json; charset=utf-8',
  'cache-control':'private, no-store, max-age=0',
  'pragma':'no-cache',
  'x-content-type-options':'nosniff',
  'content-security-policy':"default-src 'none'; sandbox",
  'referrer-policy':'no-referrer',
 }})
}
async function readBounded(request:Request):Promise<Uint8Array|null>{
 const claimed=request.headers.get('content-length')
 if(claimed!==null&&(!/^\d+$/.test(claimed)||Number(claimed)>4096))return null
 if(!request.body)return null
 const reader=request.body.getReader(),parts:Uint8Array[]=[];let size=0
 try{
  while(true){
   const {done,value}=await reader.read()
   if(done)break
   if(!(value instanceof Uint8Array))return null
   size+=value.length
   if(size>4096){await reader.cancel();return null}
   parts.push(value)
  }
 }finally{reader.releaseLock()}
 const bytes=new Uint8Array(size);let offset=0
 for(const part of parts){bytes.set(part,offset);offset+=part.length}
 return bytes
}
function exactKeys(value:Record<string,unknown>,keys:string[]){
 return Object.keys(value).length===keys.length&&Object.keys(value).every(key=>keys.includes(key))
}
function validResult(value:unknown):value is TakedownResult{
 if(!value||typeof value!=='object'||Array.isArray(value))return false
 const item=value as Record<string,unknown>
 return Object.keys(item).length===3&&typeof item.id==='string'&&UUID.test(item.id)&&
  item.decision==='rejected'&&item.status==='revoked'
}
export function createQuestionMediaTakedownHandler(deps:Dependencies){
 return async(request:Request):Promise<Response>=>{
  if(request.method!=='POST')return fail(405,'Method not allowed')
  const authorization=request.headers.get('authorization')||''
  if(!/^Bearer [^\s]{10,8192}$/.test(authorization))return fail(401,'Authentication required')
  let actor:Actor|null
  try{actor=await deps.authenticate(authorization.slice(7))}catch{return fail(401,'Authentication required')}
  if(!actor||!UUID.test(actor.id))return fail(401,'Authentication required')
  const contentType=request.headers.get('content-type')||''
  if(!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(contentType))
   return fail(415,'JSON request required')
  const bytes=await readBounded(request)
  if(!bytes)return fail(413,'Invalid request size')
  let body:unknown
  try{body=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes))}catch{return fail(400,'Invalid takedown request')}
  if(!body||typeof body!=='object'||Array.isArray(body)||
   !exactKeys(body as Record<string,unknown>,['question_id','asset_id','reason']))
   return fail(400,'Invalid takedown request')
  const data=body as Record<string,unknown>
  if(typeof data.question_id!=='string'||!UUID.test(data.question_id)||
   typeof data.asset_id!=='string'||!UUID.test(data.asset_id)||
   typeof data.reason!=='string'||data.reason.trim().length<8||data.reason.trim().length>2000)
   return fail(400,'Invalid takedown request')
  try{
   const result=await deps.takedown(actor.id,data.question_id,data.asset_id,data.reason.trim())
   if(!validResult(result))return fail(409,'Media takedown could not be confirmed')
   return Response.json({
    question_id:data.question_id.toLowerCase(),
    asset_id:data.asset_id.toLowerCase(),
    status:'revoked',
   },{status:200,headers:{
    'content-type':'application/json; charset=utf-8',
    'cache-control':'private, no-store, max-age=0',
    'pragma':'no-cache',
    'x-content-type-options':'nosniff',
    'content-security-policy':"default-src 'none'; sandbox",
    'referrer-policy':'no-referrer',
   }})
  }catch{return fail(409,'Media takedown could not be confirmed')}
 }
}
