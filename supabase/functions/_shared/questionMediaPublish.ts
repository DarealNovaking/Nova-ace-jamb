/**
 * FCB-03 two-phase private image promotion. The caller sends only a question
 * ID and approved revision. Paths and asset lists come from the trusted SQL
 * preflight; the handler verifies both staging and destination bytes before
 * confirming immutable metadata and asking SQL to publish the question.
 */
import type { SafeImageMime } from './questionMedia.ts'
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const MAX_BYTES=2*1024*1024
const MIME=new Set<SafeImageMime>(['image/png','image/jpeg','image/webp'])
type Actor={id:string}
export type PromotionAsset={id:string;source_path:string;target_path:string;mime_type:SafeImageMime;size_bytes:number;sha256:string;alt_text:string}
export type PromotionPlan={question_id:string;approved_version:number;publish_version:number;assets:PromotionAsset[]}
type Published={id:string;content_version:number;review_status:string;active:boolean}
type Dependencies={
 authenticate(token:string):Promise<Actor|null>
 prepare(actorId:string,questionId:string,approvedVersion:number):Promise<PromotionPlan|null>
 confirm(actorId:string,questionId:string,approvedVersion:number,assetId:string):Promise<unknown>
 publish(actorId:string,questionId:string,approvedVersion:number):Promise<Published|null>
 storage:{
  read(path:string):Promise<{bytes:Uint8Array;mime:string}|null>
  putIfAbsent(path:string,bytes:Uint8Array,mime:SafeImageMime):Promise<void>
 }
}
function fail(status:number,message:string):Response{return Response.json({error:message},{status,headers:{
 'content-type':'application/json; charset=utf-8','cache-control':'private, no-store, max-age=0',
 'x-content-type-options':'nosniff','content-security-policy':"default-src 'none'; sandbox",'referrer-policy':'no-referrer',
}})}
async function readBounded(request:Request):Promise<Uint8Array|null>{
 const claimed=request.headers.get('content-length')
 if(claimed!==null&&(!/^\d+$/.test(claimed)||Number(claimed)>4096))return null
 if(!request.body)return null
 const reader=request.body.getReader(),parts:Uint8Array[]=[];let size=0
 try{while(true){const {done,value}=await reader.read();if(done)break;if(!(value instanceof Uint8Array))return null;size+=value.length;if(size>4096){await reader.cancel();return null}parts.push(value)}}finally{reader.releaseLock()}
 const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length}return bytes
}
async function digest(bytes:Uint8Array){const copy=new Uint8Array(bytes);const hash=await crypto.subtle.digest('SHA-256',copy);return Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('')}
function exactKeys(value:Record<string,unknown>,keys:string[]){return Object.keys(value).length===keys.length&&Object.keys(value).every(key=>keys.includes(key))}
function safePlan(plan:PromotionPlan,q:string,v:number):boolean{
 if(!plan||plan.question_id!==q||plan.approved_version!==v||plan.publish_version!==v+1||
  !Array.isArray(plan.assets)||plan.assets.length<1||plan.assets.length>4)return false
 const ids=new Set<string>()
 for(const item of plan.assets){
  if(!item||!exactKeys(item as unknown as Record<string,unknown>,['id','source_path','target_path','mime_type','size_bytes','sha256','alt_text'])||
   !UUID.test(item.id)||ids.has(item.id)||!MIME.has(item.mime_type)||!Number.isSafeInteger(item.size_bytes)||
   item.size_bytes<1||item.size_bytes>MAX_BYTES||!/^[0-9a-f]{64}$/.test(item.sha256)||
   typeof item.alt_text!=='string'||item.alt_text.trim().length<8||item.alt_text.length>500||
   item.source_path!=='staging/v1/'+q+'/'+item.id||
   item.target_path!=='published/v1/'+q+'/'+(v+1)+'/'+item.id)return false
  ids.add(item.id)
 }
 return true
}
function validObject(object:{bytes:Uint8Array;mime:string}|null,asset:PromotionAsset){
 return !!object&&object.bytes instanceof Uint8Array&&object.bytes.length===asset.size_bytes&&
 object.bytes.length<=MAX_BYTES&&object.mime===asset.mime_type
}
export function createQuestionMediaPublishHandler(deps:Dependencies){
 return async(request:Request):Promise<Response>=>{
  if(request.method!=='POST')return fail(405,'Method not allowed')
  const auth=request.headers.get('authorization')||''
  if(!/^Bearer [^\s]{10,8192}$/.test(auth))return fail(401,'Authentication required')
  let actor:Actor|null
  try{actor=await deps.authenticate(auth.slice(7))}catch{return fail(401,'Authentication required')}
  if(!actor||!UUID.test(actor.id))return fail(401,'Authentication required')
  const type=request.headers.get('content-type')||''
  if(!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(type))return fail(415,'JSON request required')
  const raw=await readBounded(request)
  if(!raw)return fail(413,'Invalid request size')
  let body:unknown
  try{body=JSON.parse(new TextDecoder().decode(raw))}catch{return fail(400,'Invalid publication request')}
  if(!body||typeof body!=='object'||Array.isArray(body)||
   !exactKeys(body as Record<string,unknown>,['question_id','question_version'])||
   typeof (body as Record<string,unknown>).question_id!=='string'||
   !UUID.test((body as Record<string,unknown>).question_id as string)||
   !Number.isSafeInteger((body as Record<string,unknown>).question_version)||
   ((body as Record<string,unknown>).question_version as number)<1||
   ((body as Record<string,unknown>).question_version as number)>2147483646)return fail(400,'Invalid publication request')
  const questionId=(body as Record<string,unknown>).question_id as string
  const version=(body as Record<string,unknown>).question_version as number
  try{
   const plan=await deps.prepare(actor.id,questionId,version)
   if(!safePlan(plan as PromotionPlan,questionId,version))return fail(409,'Private image publication is not ready')
   for(const asset of plan!.assets){
    const source=await deps.storage.read(asset.source_path)
    if(!validObject(source,asset)||await digest(source!.bytes)!==asset.sha256)return fail(409,'Private image publication is not ready')
    let target=await deps.storage.read(asset.target_path)
    if(!target){
     try{await deps.storage.putIfAbsent(asset.target_path,new Uint8Array(source!.bytes),asset.mime_type)}catch{/* A concurrent idempotent writer may have created the immutable path. */}
     target=await deps.storage.read(asset.target_path)
    }
    if(!validObject(target,asset)||await digest(target!.bytes)!==asset.sha256)return fail(409,'Private image publication is not ready')
    const confirmed=await deps.confirm(actor.id,questionId,version,asset.id)
    if(!confirmed||typeof confirmed!=='object'||Array.isArray(confirmed)||
     (confirmed as Record<string,unknown>).id!==asset.id||
     (confirmed as Record<string,unknown>).question_id!==questionId||
     (confirmed as Record<string,unknown>).question_version!==version+1||
     (confirmed as Record<string,unknown>).storage_path!==asset.target_path||
     (confirmed as Record<string,unknown>).mime_type!==asset.mime_type||
     (confirmed as Record<string,unknown>).size_bytes!==asset.size_bytes||
     (confirmed as Record<string,unknown>).sha256!==asset.sha256)return fail(409,'Private image publication is not ready')
   }
   const published=await deps.publish(actor.id,questionId,version)
   if(!published||published.id!==questionId||published.content_version!==version+1||
    published.review_status!=='published'||published.active!==true)return fail(409,'Question publication could not be confirmed')
   return Response.json({id:questionId,status:'published',version:published.content_version},{status:200,headers:{
    'content-type':'application/json; charset=utf-8','cache-control':'private, no-store, max-age=0',
    'x-content-type-options':'nosniff','content-security-policy':"default-src 'none'; sandbox",
   }})
  }catch{return fail(409,'Private image publication is not ready')}
 }
}
