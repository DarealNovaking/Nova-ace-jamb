#!/usr/bin/env python3
"""Fixed baseline behavior on an empty isolated recovered database only."""
import argparse,hashlib,importlib.util,json,os,subprocess,time
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
ADMIN='02000000-0000-4000-8000-000000000001'
EDITOR='02000000-0000-4000-8000-000000000002'
STUDENT='02000000-0000-4000-8000-000000000003'
TARGET='396d1910-d458-5d5f-8484-380bc8c71919'
def lit(v):return "'"+json.dumps(v,ensure_ascii=False).replace("'","''")+"'::jsonb"
def plan():
 p=json.loads((ROOT/'docs/content-review/fcb-02-2026-baseline-proposal-2026-10-29.json').read_text())
 payload=json.loads((ROOT/'src/data/fcb02ReviewPayload.json').read_text())
 subjects=json.loads(payload['payload'])['subjects']
 # Source configuration is an independent historical fixture, not the proposed target.
 source={'id':p['source_config_id'],'season_id':'a3e9c810-bd81-48bd-84e0-9a987e061cc7','name':'2026 UTME official structure','duration_seconds':7200,'total_questions':180,'option_count':4,'composition':{'optional_subjects':{'count':3,'selection':'candidate_choice','question_count_each':40},'required_subjects':[{'subject_code':'ENG','question_count':60}]},'rules':{'option_labels':['A','B','C','D'],'duration_source':'2026 JAMB Training Manual','all_questions_required':True},'version':1,'active':False}
 fixture="""do $$begin if exists(select 1 from auth.users) or exists(select 1 from ace.subjects) or exists(select 1 from ace.exam_configs) then raise exception 'Empty disposable fixture required';end if;end$$;
 insert into auth.users(id,email,raw_user_meta_data) values
 ('%s','baseline-admin@example.invalid','{}'),('%s','baseline-editor@example.invalid','{}'),('%s','baseline-student@example.invalid','{}');
 update ace.roles set role='admin' where user_id='%s';update ace.roles set role='editor' where user_id='%s';
 select set_config('request.jwt.claim.sub','%s',true);
 """%(ADMIN,EDITOR,STUDENT,ADMIN,EDITOR,ADMIN)
 fixture+='insert into ace.subjects(id,code,name,active)select id,code,name,active from jsonb_populate_recordset(null::ace.subjects,'+lit(subjects)+');'
 fixture+="insert into ace.exam_seasons(id,code,name,exam_year,status)values('a3e9c810-bd81-48bd-84e0-9a987e061cc7','jamb-2026','JAMB UTME 2026',2026,'closed'),('23fc8eb7-2d2e-474f-b4db-c0a69f22cd62','jamb-2027','JAMB UTME 2027',2027,'draft');"
 cols=','.join(source)
 fixture+='insert into ace.exam_configs('+cols+')select '+cols+' from jsonb_populate_record(null::ace.exam_configs,'+lit(source)+');'
 rows=[{k:v for k,v in s.items()if k!='subject_code'}|{'exam_config_id':source['id'],'metadata':{'selection':'required'if s['required']else'candidate_choice','official_2026':True}}for s in p['subjects']]
 fixture+='insert into ace.exam_config_subjects select * from jsonb_populate_recordset(null::ace.exam_config_subjects,'+lit(rows)+');'
 ctx=lambda actor: "set local role authenticated;select set_config('request.jwt.claim.sub','"+actor+"',true);"
 call="select ace.prepare_2026_practice_config('create');"
 cases=[]
 def add(name,body,error=None,isolation='read committed'):cases.append({'name':name,'sql':'begin isolation level '+isolation+';'+fixture+body+'rollback;','error':error})
 # This behavioral assertion must fail for an inert RPC, not merely a missing symbol.
 add('atomic-draft-create-and-exact-replay',ctx(ADMIN)+call+call+"reset role;do $$begin if(select count(*)from ace.exam_configs)<>2 or(select count(*)from ace.exam_config_subjects where exam_config_id='"+TARGET+"')<>25 then raise exception 'Expected one complete practice draft';end if;if(select count(*)from ace.exam_configs where active)<>0 or exists(select 1 from ace.exam_seasons where status='active' or starts_at is not null or ends_at is not null)then raise exception 'Unexpected activation/dates';end if;if not exists(select 1 from ace.exam_configs where id='"+TARGET+"' and duration_seconds=7200 and total_questions=180 and option_count=4 and name='UTME practice — 2026 rules' and rules->>'official_2027_confirmed'='false')then raise exception 'Wrong baseline';end if;if(select count(*)from ace.audit_events where event_type='practice_baseline_created')<>1 then raise exception 'Duplicate/missing audit';end if;end$$;")
 for name,actor in [('student',STUDENT),('editor',EDITOR),('identity-free','')]:add(name+'-denied',ctx(actor)+call,'Authenticated administrator context required')
 add('anon-denied','set local role anon;'+call,'permission denied')
 add('check-does-not-write',ctx(ADMIN)+"select ace.prepare_2026_practice_config('check');reset role;do $$begin if(select count(*)from ace.exam_configs)<>1 or exists(select 1 from ace.audit_events where event_type='practice_baseline_created')then raise exception 'Check wrote data';end if;end$$;")
 add('invalid-action',ctx(ADMIN)+"select ace.prepare_2026_practice_config(null);",'Invalid baseline action')
 for name,sql in [('source-format',"update ace.exam_configs set duration_seconds=600 where id='"+source['id']+"';"),('target-season',"update ace.exam_seasons set status='active' where code='jamb-2027';"),('subject-code',"update ace.subjects set code='BAD' where code='ENG';")]:add(name+'-drift-refused',sql+ctx(ADMIN)+call,'drift')
 add('edited-created-draft-refused',ctx(ADMIN)+call+"reset role;update ace.exam_configs set name='Changed'where id='"+TARGET+"';"+ctx(ADMIN)+call,'drift')
 add('composition-drift-refused',ctx(ADMIN)+call+"update ace.exam_config_subjects set question_count=41 where exam_config_id='"+TARGET+"' and not required;"+call,'drift')
 add('child-insert-failure-rolls-back-root',"alter table ace.exam_config_subjects add constraint synthetic_reject_baseline check(metadata->>'source_year'is distinct from'2026')not valid;"+ctx(ADMIN)+"do $$begin begin perform ace.prepare_2026_practice_config('create');raise exception 'Expected child refusal';exception when check_violation then null;end;if exists(select 1 from ace.exam_configs where id='"+TARGET+"')then raise exception 'Partial root persisted';end if;end$$;")
 add('untrusted-definer-owner-denied',"alter function ace.prepare_2026_practice_config(text)owner to authenticated;"+ctx(ADMIN)+call,'Trusted executor owner required')
 add('source-composition-drift-refused',"update ace.exam_config_subjects set question_count=41 where not required;"+ctx(ADMIN)+call,'Historical composition drift')
 add('conflicting-target-config-refused',"insert into ace.exam_configs(id,season_id,name,duration_seconds,total_questions,option_count,version)values('03000000-0000-4000-8000-000000000099','23fc8eb7-2d2e-474f-b4db-c0a69f22cd62','Other draft',7200,180,4,2);"+ctx(ADMIN)+call,'Target configuration drift')
 add('historical-data-preserved',"select set_config('baseline.source_hash',(select md5(string_agg(x,','order by x))from(select to_jsonb(c)::text x from ace.exam_configs c union all select to_jsonb(s)::text from ace.exam_seasons s union all select to_jsonb(cs)::text from ace.exam_config_subjects cs)t),true);"+ctx(ADMIN)+call+"reset role;do $$begin if current_setting('baseline.source_hash')is distinct from(select md5(string_agg(x,','order by x))from(select to_jsonb(c)::text x from ace.exam_configs c where id<>'"+TARGET+"' union all select to_jsonb(s)::text from ace.exam_seasons s union all select to_jsonb(cs)::text from ace.exam_config_subjects cs where exam_config_id<>'"+TARGET+"')t)then raise exception 'Historical data changed';end if;end$$;")
 add('new-draft-student-invisible',ctx(ADMIN)+call+ctx(STUDENT)+"do $$begin if exists(select 1 from ace.exam_configs where id='"+TARGET+"')or exists(select 1 from ace.exam_config_subjects where exam_config_id='"+TARGET+"')then raise exception 'Draft leaked';end if;end$$;")
 for isolation in ['repeatable read','serializable']:
  add('unsupported-'+isolation.replace(' ','-')+'-refused',ctx(ADMIN)+call,'Read committed transaction required',isolation)
 return {'fixture':fixture,'cases':cases}
def races(p,args,env,run):
 spec=importlib.util.spec_from_file_location('practice_sessions',ROOT/'tests/sql/fcb_01_role_concurrency.py')
 sessions=importlib.util.module_from_spec(spec);spec.loader.exec_module(sessions)
 ctx=lambda actor:"set local role authenticated;select set_config('request.jwt.claim.sub','"+actor+"',true);"
 def must(sql):
  r=run(sql)
  if r.returncode:raise RuntimeError(r.stderr)
  return r.stdout.strip()
 def contend(name,first_sql,second_sql,error=None,want=None):
  first=sessions.Session(args,env,'practice_'+name+'_first');second=sessions.Session(args,env,'practice_'+name+'_second')
  try:
   first.send(first_sql+"\n\\echo FIRST_HELD\n");first.until('FIRST_HELD')
   second.send(second_sql+"commit;\n")
   deadline=time.monotonic()+5
   while time.monotonic()<deadline:
    if must("select wait_event_type from pg_stat_activity where pid="+str(second.backend_pid)+";")=='Lock':break
    time.sleep(.05)
   else:raise RuntimeError(name+' did not wait for the expected lock')
   first.send("commit;\n")
   if first.finish()!=0:raise RuntimeError(first.output[-1500:])
   code=second.finish()
   if error:
    if code==0 or error not in second.output:raise RuntimeError(name+': '+second.output[-1500:])
   elif code!=0 or(want and want not in second.output.splitlines()):raise RuntimeError(name+': '+second.output[-1500:])
   print('PASS native-contention-'+name,flush=True)
  finally:first.close();second.close()
 must('begin;'+p['fixture']+'commit;') # Dedicated disposable job; no shared fixture is overwritten.
 call=lambda action:"select ace.prepare_2026_practice_config('"+action+"')->>'state';"
 contend('source-composition','begin;'+ctx(EDITOR)+"update ace.exam_config_subjects set question_count=41 where not required;",'begin;'+ctx(ADMIN)+call('create'),'Historical composition drift')
 assert must("select count(*)from ace.exam_configs where id='"+TARGET+"';")=='0'
 must('begin;'+ctx(ADMIN)+"update ace.exam_config_subjects set question_count=40 where not required;commit;")
 contend('idempotent-create','begin;'+ctx(ADMIN)+call('create'),'begin;'+ctx(ADMIN)+call('create'),want='exists')
 assert must("select count(*)from ace.audit_events where event_type='practice_baseline_created';")=='1'
 assert must("select count(*)from ace.exam_config_subjects where exam_config_id='"+TARGET+"';")=='25'
 contend('target-composition','begin;'+ctx(EDITOR)+"update ace.exam_config_subjects set question_count=41 where exam_config_id='"+TARGET+"'and not required;",'begin;'+ctx(ADMIN)+call('check'),'Practice composition drift')
 must('begin;'+ctx(ADMIN)+"update ace.exam_config_subjects set question_count=40 where exam_config_id='"+TARGET+"'and not required;commit;")
 must("update ace.roles set role='admin'where user_id='"+EDITOR+"';")
 for demotion_first in [True,False]:
  demote="begin;update ace.roles set role='editor'where user_id='"+ADMIN+"';"
  check='begin;'+ctx(ADMIN)+call('check')
  contend('demotion-first'if demotion_first else'operation-first',demote if demotion_first else check,check if demotion_first else demote,'Authenticated administrator context required'if demotion_first else None)
  must("update ace.roles set role='admin'where user_id='"+ADMIN+"';")
 return 5
def main():
 a=argparse.ArgumentParser();a.add_argument('--emit',type=Path);a.add_argument('--installer',type=Path,default=ROOT/'supabase/proposals/fcb02_2026_practice_draft.sql');a.add_argument('--upgrade',type=Path);a.add_argument('--races',action='store_true');v=a.parse_args();p=plan()
 if v.emit:v.emit.write_text(json.dumps(p));return
 if os.environ.get('ACE_FCB02_DISPOSABLE_TEST')!='1' or not os.environ.get('PGDATABASE','').endswith('_test'):raise SystemExit('Explicit disposable *_test database required')
 spec=importlib.util.spec_from_file_location('bounded_fcb02_transport',ROOT/'tests/sql/fcb_02_draft_import.py')
 transport=importlib.util.module_from_spec(spec);spec.loader.exec_module(transport)
 args,env=transport.connection() # Reject destination/environment before any SQL.
 def run(sql):return subprocess.run(args,input=sql,text=True,capture_output=True,cwd=ROOT,env=env,timeout=40)
 preflight=run("do $$begin if (select array_agg(column_name::text order by ordinal_position)from information_schema.columns where table_schema='auth'and table_name='users')is distinct from array['id','email','raw_user_meta_data']::text[] or exists(select 1 from auth.users)or exists(select 1 from ace.subjects)or exists(select 1 from ace.exam_configs)then raise exception 'Empty recovered disposable database required';end if;end$$;")
 if preflight.returncode:raise SystemExit(preflight.stderr)
 r=run(v.installer.read_text()+(v.upgrade.read_text()if v.upgrade else ''))
 if r.returncode:raise SystemExit(r.stderr)
 expected=hashlib.sha256((ROOT/'supabase/proposals/fcb02_2026_practice_draft.sql').read_text().split('$baseline$')[1].encode()).hexdigest()
 actual=run("select encode(sha256(convert_to(prosrc,'UTF8')),'hex')from pg_proc where oid='ace.prepare_2026_practice_config(text)'::regprocedure;")
 if actual.returncode or actual.stdout.strip()!=expected:raise SystemExit('Installed function differs from reviewed canonical body')
 if v.upgrade:
  refused=run(v.upgrade.read_text())
  if refused.returncode==0 or 'Practice helper contract drift'not in refused.stderr:raise SystemExit('Upgrade failed to refuse unexpected installed source')
 for c in p['cases']:
  r=run(c['sql']);ok=(r.returncode!=0 and c['error']in r.stderr)if c['error']else r.returncode==0
  if not ok:raise SystemExit(c['name']+'\n'+r.stderr+'\n'+r.stdout[-800:])
  print('PASS',c['name'],flush=True)
 count=len(p['cases'])+(races(p,args,env,run)if v.races else 0)
 print('2026 practice draft: '+str(count)+' native SQL cases passed')
if __name__=='__main__':main()
