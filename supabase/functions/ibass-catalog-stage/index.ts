// Recovered from the active Supabase deployment on 2026-10-18.
// Deployed function: ibass-catalog-stage, version 4, verify_jwt=true.
// This is a source-control recovery, not a claim that the implementation has passed review.
// Review and test before any future deployment.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";
import { parseIbassUtmeRule } from "./parser.js";
const PROGRAM_SOURCE="16388e42-7bed-4541-89ff-8ffb0e648425";
const RULE_SOURCE="9959f7d6-0071-4ab3-880c-a79f3c81e561";
const CORS={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(x:any,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{...CORS,"content-type":"application/json"}});
const norm=(s:string)=>s.normalize("NFKC").toUpperCase().replace(/\b(FCT|STATE|NIGERIA)\b/g,"").replace(/[^A-Z0-9]+/g," ").replace(/\s+/g," ").trim();
const get=async(u:string,headers:any={})=>{const r=await fetch(u,{headers});if(!r.ok)throw new Error("HTTP "+r.status+" from "+u);return r};
const postJson=async(u:string,payload:any)=>{const r=await fetch(u,{method:"POST",headers:{"accept":"application/json","content-type":"application/json"},body:JSON.stringify(payload)});const data=await r.json().catch(()=>null);if(!r.ok||data?.status!==true)throw new Error("IBASS requirements request failed (HTTP "+r.status+")");return data};
const IBASS_API="https://ibass-api.jamb.gov.ng/api";
const MAX_PROGRAMMES_PER_REQUEST=150;
const REQUIREMENTS_REQUEST={mode_of_entry:"UTME",olevel_credit:["English Language","Mathematics","Biology","Chemistry","Physics"],olevel_passes:[],alevel_credit:[],alevel_passes:[],utme_subjects:["English Language","Biology","Chemistry","Physics"]};
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:CORS});
 if(req.method!=="POST")return json({error:"Method not allowed"},405);
 const auth=req.headers.get("authorization");if(!auth?.startsWith("Bearer "))return json({error:"Authentication required"},401);
 const url=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");if(!url||!key)return json({error:"Server configuration unavailable"},500);
 const client=createClient(url,key,{global:{headers:{Authorization:auth}}});
 const {data:userData,error:userError}=await client.auth.getUser();if(userError||!userData.user)return json({error:"Invalid authentication"},401);
 const {data:allowed,error:permError}=await client.schema("ace").rpc("can_manage_catalog");if(permError)return json({error:"Unable to verify permissions",detail:permError.message},500);if(allowed!==true)return json({error:"Admin/editor access required"},403);
 let body:any;try{body=await req.json()}catch{return json({error:"Invalid JSON"},400)}
 const ids: string[]=Array.from(new Set<string>((body.institution_ids||[]).map((id:any)=>String(id))));if(ids.length<1||ids.length>25)return json({error:"institution_ids must contain 1-25 database IDs"},400);if(!body.season_id)return json({error:"season_id is required"},400);
 const {data:db,error:dbError}=await client.schema("ace").rpc("get_catalog_institutions");if(dbError)return json({error:"Unable to load institutions",detail:dbError.message},500);
 const selected=(db||[]).filter((x:any)=>ids.includes(x.id));if(selected.length!==ids.length)return json({error:"Unknown database institution ID",missing:ids.filter((id:string)=>!(db||[]).some((x:any)=>x.id===id))},404);
 const catalogue=await (await get("https://eligibility.jamb.gov.ng/institution_data.json?v=1",{accept:"application/json"})).json();
 const ib:any[]=[];
 const visit=(node:any,schoolType:string|null=null,category:string|null=null)=>{
  if(Array.isArray(node)){for(const item of node)visit(item,schoolType,category);return;}
  if(!node||typeof node!=="object")return;
  if(node.type==="school_type")schoolType=String(node.id||"");
  if(node.type==="institution_category")category=String(node.id||"");
  if(node.type==="institution"&&node.id&&node.name)ib.push({id:String(node.id),name:String(node.name),school_type_id:schoolType,category_id:String(node.category||category||"")});
  if(node.children)visit(node.children,schoolType,category);
 };
 visit(catalogue);
 const unique=[...new Map(ib.map(x=>[x.id,x])).values()];
 const mapped:any[]=[],unresolved:any[]=[];
 const institutionName=(name:string,state?:string|null)=>{const normalized=norm(name);const suffix=state?.trim()?norm(state):"";return suffix&&normalized.endsWith(" "+suffix)?normalized.slice(0,-suffix.length-1).trim():normalized;};
 for(const inst of selected){
  const target=institutionName(inst.name,inst.state);
  const matches=unique.filter(x=>institutionName(x.name,inst.state)===target);
  if(matches.length!==1){unresolved.push({institution_id:inst.id,name:inst.name,reason:matches.length?"ambiguous IBASS match after state normalization":"no normalized IBASS match"});continue;}
  if(!matches[0].school_type_id||!matches[0].category_id){unresolved.push({institution_id:inst.id,name:inst.name,reason:"IBASS institution is missing its official institution-type/category identifiers"});continue;}
  mapped.push({...inst,ibass_id:matches[0].id,ibass_name:matches[0].name,ibass_type_id:matches[0].school_type_id,ibass_category_id:matches[0].category_id});
 }
 const programmeJobs:any[]=[];
 for(const inst of mapped){
  try{
   const response=await (await get(IBASS_API+"/ibass/eligibility-checker/"+encodeURIComponent(inst.ibass_id),{accept:"application/json"})).json();
   if(response?.status!==true||!Array.isArray(response.data))throw new Error("Unexpected official programme-list response shape");
   for(const p of response.data){
    const pid=String(p?.id||"").trim(),name=String(p?.title||p?.name||"").trim();
    if(!pid||!name){unresolved.push({institution_id:inst.id,name:inst.name,reason:"IBASS programme-list entry is missing an ID or title"});continue;}
    programmeJobs.push({institution:inst,programme_id:pid,name});
   }
  }catch(e){unresolved.push({institution_id:inst.id,name:inst.name,reason:"Unable to fetch official IBASS programme list: "+String(e)});}
 }
 if(programmeJobs.length>MAX_PROGRAMMES_PER_REQUEST)return json({error:"Selected institutions contain too many programmes for one safe staging request.",institutions_requested:ids.length,institutions_mapped:mapped.length,programmes_discovered:programmeJobs.length,maximum_programmes_per_request:MAX_PROGRAMMES_PER_REQUEST,action:"Select fewer institutions and retry; no rows were staged.",unresolved},413);
 if(programmeJobs.length===0)return json({error:"No official IBASS programmes could be discovered; nothing was staged.",institutions_requested:ids.length,institutions_mapped:mapped.length,programmes_discovered:0,unresolved},422);
 const outcomes:any[]=new Array(programmeJobs.length);
 let cursor=0;
 const worker=async()=>{
  while(true){
   const index=cursor++;if(index>=programmeJobs.length)return;
   const job=programmeJobs[index],inst=job.institution,pid=job.programme_id,name=job.name;
   const externalKey="ibass:"+inst.ibass_id+":program:"+pid;
   const brochure="https://ibass.jamb.gov.ng/brochure-courses?id="+encodeURIComponent(inst.ibass_id)+"&school="+encodeURIComponent(inst.ibass_name);
   const program={entity_type:"program",external_key:externalKey,payload:{name,institution_external_key:inst.id,award_level:"degree",source_url:brochure,provenance:{authority:"JAMB/IBASS",ibass_institution_id:inst.ibass_id,ibass_programme_id:pid}}};
   try{
    const response=await postJson(IBASS_API+"/ibass/eligibility-checker/submit",{...REQUIREMENTS_REQUEST,institution:Number(inst.ibass_id),select_programme:Number(pid),institution_category:Number(inst.ibass_category_id),institution_type:Number(inst.ibass_type_id)});
    if(String(response?.institution_details?.itemid)!==String(inst.ibass_id)||String(response?.programme_details?.itemid)!==pid){
     outcomes[index]={program,unresolved:{institution_id:inst.id,programme_id:pid,programme_title:name,reason:"IBASS requirements response did not match the requested institution and programme"}};
     continue;
    }
    const config=response.programme_utme_subject_data;
    if(!config){outcomes[index]={program,unresolved:{institution_id:inst.id,programme_id:pid,programme_title:name,reason:"Official IBASS response contains no UTME subject configuration"}};continue;}
    const parsed=parseIbassUtmeRule(config);
    if(!parsed.ok){outcomes[index]={program,unresolved:{institution_id:inst.id,programme_id:pid,programme_title:name,reason:parsed.reason,utme_subject_requirements:config.title||null}};continue;}
    outcomes[index]={program,rule:{entity_type:"program_utme_rule",external_key:externalKey+":utme:v1",payload:{program_external_key:externalKey,required_subject_codes:parsed.requiredSubjectCodes,alternative_groups:parsed.alternativeGroups,minimum_optional_subjects:parsed.minimumOptionalSubjects,notes:config.title||null,source_url:brochure,provenance:{authority:"JAMB/IBASS",ibass_institution_id:inst.ibass_id,ibass_programme_id:pid,requirements_endpoint:IBASS_API+"/ibass/eligibility-checker/submit",raw_utme_subject_title:config.title||null,raw_required_subjects:config.required_subjects||null,raw_optional_subjects:config.optional_subjects||null,raw_optional_subjects_by_group2:config.optional_subjects_by_group2||null,source_subject_count:config.subject_count??null}}}};
   }catch(e){outcomes[index]={program,unresolved:{institution_id:inst.id,programme_id:pid,programme_title:name,reason:"Official IBASS requirements request failed: "+String(e)}};}
  }
 };
 await Promise.all(Array.from({length:Math.min(4,programmeJobs.length)},()=>worker()));
 const programs:any[]=[],rules:any[]=[];
 for(const result of outcomes){if(!result)continue;programs.push(result.program);if(result.rule)rules.push(result.rule);if(result.unresolved)unresolved.push(result.unresolved);}
 if(programs.length>0&&rules.length===0)return json({error:"No UTME requirement rows could be parsed; nothing was staged.",institutions_requested:ids.length,institutions_mapped:mapped.length,programmes_discovered:programs.length,utme_rules_safe_to_stage:0,unresolved},422);
 const post=async(type:string,source:string,rows:any[])=>{if(!rows.length)return null;const r=await fetch(url+"/functions/v1/catalog-import",{method:"POST",headers:{authorization:auth,"content-type":"application/json"},body:JSON.stringify({source_id:source,season_id:body.season_id,dataset_type:type,rows,metadata:{authority:"JAMB/IBASS",staged_by:userData.user.id}})});const p=await r.json().catch(()=>({error:"invalid response"}));if(!r.ok)throw new Error(String(p.error||"catalog-import failed"));return p};
 try{const programImport=await post("programs",PROGRAM_SOURCE,programs);const ruleImport=await post("utme_rules",RULE_SOURCE,rules);return json({institutions_requested:ids.length,institutions_mapped:mapped.length,institutions_unresolved:unresolved.length,programmes_discovered:programs.length,utme_rules_safe_to_stage:rules.length,unresolved,program_import:programImport,utme_rule_import:ruleImport},201)}catch(e){return json({error:"IBASS staging failed",detail:String(e),institutions_mapped:mapped.length,programmes_discovered:programs.length,utme_rules_safe_to_stage:rules.length,unresolved},500)}
});