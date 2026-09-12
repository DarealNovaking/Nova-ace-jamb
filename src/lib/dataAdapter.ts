import { ace, supabase } from './supabase'

export const auth = {
  getUser: async () => { const { data, error } = await supabase.auth.getUser(); if (error) throw error; return data.user },
  signOut: async () => { const { error } = await supabase.auth.signOut(); if (error) throw error },
}

const subject = (x:any) => ({ id:x.id, name:x.name, code:x.code, description:x.description ?? '', sortOrder:x.sort_order ?? 99, active:x.active ?? true })
const topic = (x:any) => ({ id:x.id, subjectId:x.subject_id, name:x.name, description:x.description ?? '', sortOrder:x.sort_order ?? 99, active:x.active ?? true })
const question = (x:any) => ({ id:x.id, subjectId:x.subject_id, topicId:x.topic_id, text:x.question_text ?? x.text ?? '', options:x.options ?? [], correctOption:x.correct_option ?? 0, explanation:x.explanation ?? '', difficulty:x.difficulty ?? 'medium', year:x.year ?? '', exam:x.exam ?? 'JAMB', mediaPath:x.media_path ?? '', active:x.active ?? true })

export async function loadBootstrap(){
  const [s,t,q,m]=await Promise.all([ace.from('subjects').select('*').order('sort_order'),ace.from('topics').select('*').order('sort_order'),ace.from('questions').select('*').limit(500),ace.from('materials').select('*').limit(500)])
  const err=[s,t,q,m].find(x=>x.error)?.error; if(err) throw err
  return {subjects:(s.data??[]).map(subject),topics:(t.data??[]).map(topic),questions:(q.data??[]).map(question),materials:m.data??[]}
}

export async function getProfile(){
  const user=await auth.getUser(); if(!user) throw new Error('Authentication required')
  const {data,error}=await ace.from('profiles').select('*').eq('id',user.id).maybeSingle(); if(error) throw error
  return data ? {...data,name:data.display_name ?? data.name ?? 'Student',email:user.email ?? ''} : {name:'Student',email:user.email ?? ''}
}

export async function updateProfile(name:string){
  const user=await auth.getUser(); if(!user) throw new Error('Authentication required')
  const value=name.trim(); if(!value) throw new Error('Name is required')
  const {data,error}=await ace.from('profiles').update({display_name:value}).eq('id',user.id).select('*').single(); if(error) throw error
  return {...data,name:value}
}
