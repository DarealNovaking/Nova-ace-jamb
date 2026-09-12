import { ace, supabase } from './lib/supabase'

const mapSubject=(x:any)=>({id:x.id,name:x.name,code:x.code,description:x.description??'',sortOrder:x.sort_order??99,active:x.active??true})
const mapTopic=(x:any)=>({id:x.id,subjectId:x.subject_id,name:x.name,description:x.description??'',sortOrder:x.sort_order??99,active:x.active??true})
const mapQuestion=(x:any)=>({id:x.id,subjectId:x.subject_id,topicId:x.topic_id,text:x.question_text??x.text??'',options:x.options??[],correctOption:x.correct_option??0,explanation:x.explanation??'',difficulty:x.difficulty??'medium',year:x.year??'',exam:x.exam??'JAMB',mediaPath:x.media_path??'',active:x.active??true})

export const auth={
 getUser:async()=>{const {data,error}=await supabase.auth.getUser();if(error)throw error;return data.user},
 signIn:async()=>{const email=window.prompt('Email for ACE JAMB sign-in')?.trim();if(!email)throw new Error('Email is required');const {data,error}=await supabase.auth.signInWithOtp({email});if(error)throw error;return {user:data.user}},
 signOut:async()=>{const {error}=await supabase.auth.signOut();if(error)throw error}
}

export const api={
 get:async(path:string)=>{
  if(path==='/api/admin/bootstrap'){const [s,t,q,m]=await Promise.all([ace.from('subjects').select('*').order('sort_order'),ace.from('topics').select('*').order('sort_order'),ace.from('questions').select('*').limit(500),ace.from('materials').select('*').limit(500)]);const e=[s,t,q,m].find(x=>x.error)?.error;if(e)throw e;return {data:{subjects:(s.data??[]).map(mapSubject),topics:(t.data??[]).map(mapTopic),questions:(q.data??[]).map(mapQuestion),materials:m.data??[]}}}
  if(path==='/api/profile'){const user=await auth.getUser();if(!user)throw new Error('Authentication required');const {data,error}=await ace.from('profiles').select('*').eq('id',user.id).maybeSingle();if(error)throw error;return {data:{...(data??{}),name:data?.display_name??data?.name??'Student',email:user.email??''}}}
  throw new Error('Unsupported GET route')
 },
 put:async(path:string,body:any)=>{if(path!=='/api/profile')throw new Error('Unsupported PUT route');const user=await auth.getUser();if(!user)throw new Error('Authentication required');const name=String(body?.name??'').trim();if(!name)throw new Error('Name is required');const {data,error}=await ace.from('profiles').update({display_name:name}).eq('id',user.id).select('*').single();if(error)throw error;return {data:{...data,name}}},
 post:async(path:string,body:any)=>{if(path==='/api/admin/subjects'){const {data,error}=await ace.from('subjects').insert({name:String(body.name).trim(),code:String(body.code).trim().toUpperCase(),description:body.description??'',sort_order:body.sortOrder??99,active:body.active??true}).select('id').single();if(error)throw error;return {data}}if(path==='/api/admin/topics'){const {data,error}=await ace.from('topics').insert({subject_id:body.subjectId,name:String(body.name).trim(),description:body.description??'',sort_order:body.sortOrder??99,active:body.active??true}).select('id').single();if(error)throw error;return {data}}if(path==='/api/admin/questions'){const {data,error}=await ace.from('questions').insert({subject_id:body.subjectId,topic_id:body.topicId,question_text:String(body.text).trim(),options:body.options,correct_option:body.correctOption,explanation:body.explanation??'',difficulty:body.difficulty??'medium',year:body.year??'',exam:body.exam??'JAMB',media_path:body.mediaPath??'',active:body.active??true}).select('id').single();if(error)throw error;return {data}}throw new Error('Unsupported POST route')},
 delete:async(path:string)=>{const match=path.match(/^\/api\/admin\/questions\/([^/]+)$/);if(!match)throw new Error('Unsupported DELETE route');const {error}=await ace.from('questions').delete().eq('id',match[1]);if(error)throw error;return {data:{deleted:true}}}
}
