/**
 * FCB-03 authenticated private reviewer preview. The browser supplies only
 * question/version/asset IDs; SQL authorizes the exact draft image reference.
 * Storage paths and integrity metadata never come from the client.
 */
import type { SafeImageMime } from './questionMedia.ts'
export type QuestionMediaPreviewGrant = {
 id:string;question_id:string;question_version:number;storage_path:string;
 mime_type:SafeImageMime;size_bytes:number;sha256:string
}
type Actor={id:string}
type Dependencies={
 authenticate(token:string):Promise<Actor|null>
 authorize(actorId:string,questionId:string,version:number,assetId:string):Promise<QuestionMediaPreviewGrant|null>
 storage:{read(path:string):Promise<{bytes:Uint8Array;mime:string}|null>}
}
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const MAX_BYTES=2*1024*1024
const MIME=new Set<SafeImageMime>(['image/png','image/jpeg','image/webp'])
function fail(status:number):Response{return Response.json({error:status===401?'Authentication required':'Private image unavailable'},{status,headers:{
 'cache-control':'private, no-store, max-age=0','pragma':'no-cache','x-content-type-options':'nosniff',
 'content-security-policy':"default-src 'none'; sandbox",'referrer-policy':'no-referrer','cross-origin-resource-policy':'cross-origin',
}})}
function parseIds(request:Request){
 const url=new URL(request.url),keys=[...url.searchParams.keys()]
 if(keys.length!==3||new Set(keys).size!==3||keys.some(k=>!['question_id','question_version','asset_id'].includes(k)))return null
 const questionId=url.searchParams.get('question_id')||'',assetId=url.searchParams.get('asset_id')||'',raw=url.searchParams.get('question_version')||''
 if(!UUID.test(questionId)||!UUID.test(assetId)||!/^[1-9]\d{0,8}$/.test(raw))return null
 return{questionId,assetId,version:Number(raw)}
}
async function digest(bytes:Uint8Array){const copy=new Uint8Array(bytes);const hash=await crypto.subtle.digest('SHA-256',copy);return Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('')}
function validGrant(g:QuestionMediaPreviewGrant,q:string,v:number,a:string){
 return !!g&&g.id===a&&g.question_id===q&&g.question_version===v&&g.storage_path==='staging/v1/'+q+'/'+a&&
 MIME.has(g.mime_type)&&Number.isSafeInteger(g.size_bytes)&&g.size_bytes>0&&g.size_bytes<=MAX_BYTES&&
 typeof g.sha256==='string'&&/^[0-9a-f]{64}$/.test(g.sha256)
}
function extension(mime:SafeImageMime){return mime==='image/png'?'png':mime==='image/jpeg'?'jpg':'webp'}
export function createQuestionMediaPreviewHandler(deps:Dependencies){
 return async(request:Request):Promise<Response>=>{
  if(request.method!=='GET')return fail(405)
  if(request.headers.has('range'))return fail(416)
  const auth=request.headers.get('authorization')||''
  if(!/^Bearer [^\s]{10,8192}$/.test(auth))return fail(401)
  let actor:Actor|null
  try{actor=await deps.authenticate(auth.slice(7))}catch{return fail(401)}
  if(!actor||!UUID.test(actor.id))return fail(401)
  const ids=parseIds(request);if(!ids)return fail(400)
  try{
   const grant=await deps.authorize(actor.id,ids.questionId,ids.version,ids.assetId)
   if(!grant||!validGrant(grant,ids.questionId,ids.version,ids.assetId))return fail(404)
   const object=await deps.storage.read(grant.storage_path)
   if(!object||!(object.bytes instanceof Uint8Array)||object.bytes.length!==grant.size_bytes||
    object.bytes.length>MAX_BYTES||object.mime!==grant.mime_type||await digest(object.bytes)!==grant.sha256)return fail(404)
   return new Response(new Uint8Array(object.bytes),{status:200,headers:{
    'content-type':grant.mime_type,'content-length':String(object.bytes.length),
    'content-disposition':'inline; filename="question-preview.'+extension(grant.mime_type)+'"',
    'cache-control':'private, no-store, max-age=0','pragma':'no-cache','x-content-type-options':'nosniff',
    'content-security-policy':"default-src 'none'; sandbox",'referrer-policy':'no-referrer','cross-origin-resource-policy':'cross-origin',
   }})
  }catch{return fail(404)}
 }
}
