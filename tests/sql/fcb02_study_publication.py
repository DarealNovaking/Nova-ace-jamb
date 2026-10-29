"""Fixed study publication checks. SQL identities only in an empty disposable fixture."""
import argparse
import importlib.util
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def module(name,path):
 spec=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m

def plan():
 practice=module('practice',ROOT/'tests/sql/fcb02_2026_practice.py')
 original=json.loads(json.loads((ROOT/'src/data/fcb02ReviewPayload.json').read_text())['payload'])
 children={r['id']:dict(r)for r in original['subtopics']}
 for op in json.loads((ROOT/'docs/content-review/fcb-02-editorial-corrections-2026-10-28.json').read_text())['operations']:
  if op['operation']=='rename_subtopic':children[op['expected_row']['id']].update(op['changes'])
  else:
   row=dict(op['row']);row['id']={'Derivatives':'b8cc0f71-4227-4e61-9bd7-fec50ab3130f','Conditional sentences':'2f6c5f55-2982-4efd-acd5-ff753402f262'}[row['name']];children[row['id']]=row
 fixture=practice.plan()['fixture']+"select ace.prepare_2026_practice_config('create');"
 for table,rows in [('syllabus_versions',original['versions']),('topics',original['topics']),('subtopics',list(children.values()))]:
  cols=','.join(rows[0]);fixture+='insert into ace.'+table+'('+cols+')select '+cols+' from jsonb_populate_recordset(null::ace.'+table+','+practice.lit(rows)+');'
 package=json.loads((ROOT/'src/data/fcb02StudyPublication.json').read_text())
 lit=lambda s:"'"+s.replace("'","''")+"'"
 call=lambda action: "select ace.manage_fcb02_study_index("+lit(action)+','+lit(package['digest'])+','+lit(package['payload'])+');'
 ctx=lambda actor:"set local role authenticated;select set_config('request.jwt.claim.sub',"+lit(actor)+",true);"
 cases=[]
 def add(name,body,error=None,isolation='read committed'):
  cases.append({'name':name,'sql':'begin isolation level '+isolation+';'+fixture+body+'rollback;','error':error})
 published="reset role;do $$begin if(select count(*)from ace.syllabus_versions where status='active'and rights_status='approved')<>25 or(select count(*)from ace.topics where active)<>108 or(select count(*)from ace.subtopics where active)<>1167 then raise exception 'Expected complete published study index';end if;if(select count(*)from ace.exam_configs where active)<>1 or(select count(*)from ace.exam_seasons where status='active')<>1 then raise exception 'Expected active baseline';end if;end$$;"
 add('atomic-publication-and-idempotent-replay',ctx(practice.ADMIN)+call('publish')+call('publish')+published+"do $$begin if(select count(*)from ace.audit_events where event_type='ace_study_index_published')<>1 then raise exception 'Duplicate publication';end if;end$$;")
 add('check-does-not-publish',ctx(practice.ADMIN)+call('check')+"reset role;do $$begin if(select count(*)from ace.syllabus_versions)<>25 or exists(select 1 from ace.exam_seasons where status='active')then raise exception 'Check wrote';end if;end$$;")
 for name,actor in [('student',practice.STUDENT),('editor',practice.EDITOR),('identity-free','')]:add(name+'-denied',ctx(actor)+call('publish'),'Authenticated administrator context required')
 add('anon-denied','set local role anon;'+call('publish'),'permission denied')
 add('withdraw-and-restore',ctx(practice.ADMIN)+call('publish')+call('withdraw')+call('withdraw')+"reset role;do $$begin if exists(select 1 from ace.topics where active)or exists(select 1 from ace.subtopics where active)or exists(select 1 from ace.exam_seasons where status='active')or exists(select 1 from ace.exam_configs where active)then raise exception 'Withdrawal failed';end if;end$$;"+ctx(practice.ADMIN)+call('publish')+published)
 add('private-source-preserved',"select set_config('study.source_hash',(select md5(string_agg(to_jsonb(v)::text,','order by v.id))from ace.syllabus_versions v),true);"+ctx(practice.ADMIN)+call('publish')+"reset role;do $$begin if current_setting('study.source_hash')is distinct from(select md5(string_agg(to_jsonb(v)::text,','order by v.id))from ace.syllabus_versions v where version=2)then raise exception 'Private source changed';end if;end$$;")
 add('source-drift-refused',"update ace.subtopics set name='Changed'where id=(select id from ace.subtopics limit1);".replace('limit1','limit 1')+ctx(practice.ADMIN)+call('publish'),'Source concept drift')
 add('source-version-drift-refused',"update ace.syllabus_versions set source_url='https://example.invalid/changed';"+ctx(practice.ADMIN)+call('publish'),'Private review version drift')
 add('published-content-drift-refused',ctx(practice.ADMIN)+call('publish')+"update ace.topics set name='Changed'where id=(select id from ace.topics where active limit 1);"+call('check'),'Study topic drift')
 add('package-byte-drift-refused',ctx(practice.ADMIN)+call('publish').replace(lit(package['digest']),lit('0'*64)),'Reviewed study package mismatch')
 add('partial-insertion-rolls-back',"alter table ace.subtopics add constraint synthetic_reject_index check(description is not null)not valid;"+ctx(practice.ADMIN)+"do $$begin begin perform ace.manage_fcb02_study_index('publish',"+lit(package['digest'])+','+lit(package['payload'])+");raise exception 'Expected insertion refusal';exception when check_violation then null;end;if(select count(*)from ace.syllabus_versions)<>25 then raise exception 'Partial rows survived';end if;end$$;")
 for isolation in ['repeatable read','serializable']:add('refuse-'+isolation,ctx(practice.ADMIN)+call('publish'),'Read committed transaction required',isolation)
 add('student-sees-only-published-index',ctx(practice.ADMIN)+call('publish')+ctx(practice.STUDENT)+"do $$begin if(select count(*)from ace.topics)<>108 or(select count(*)from ace.subtopics)<>1167 then raise exception 'Published index not visible';end if;if exists(select 1 from ace.syllabus_versions where version=2)then raise exception 'Private source leaked';end if;end$$;"+ctx(practice.ADMIN)+call('withdraw')+ctx(practice.STUDENT)+"do $$begin if exists(select 1 from ace.topics)or exists(select 1 from ace.subtopics)or exists(select 1 from ace.syllabus_versions)then raise exception 'Withdrawn index leaked';end if;end$$;")
 add('withdraw-survives-source-and-content-drift',ctx(practice.ADMIN)+call('publish')+"update ace.topics set name='Changed'where id=(select id from ace.topics where active limit 1);update ace.subtopics set name='Changed source'where id=(select id from ace.subtopics where not active limit 1);"+call('withdraw')+call('check')+"reset role;do $$begin if exists(select 1 from ace.topics where active)or exists(select 1 from ace.syllabus_versions where rights_status='approved')then raise exception 'Emergency withdrawal failed';end if;end$$;")
 add('withdraw-confirms-count-drift',ctx(practice.ADMIN)+call('publish')+"insert into ace.topics(subject_id,syllabus_version_id,name,active)select subject_id,syllabus_version_id,'Extra administrator topic',true from ace.topics where active limit 1;"+call('withdraw')+"do $$declare r jsonb;begin r:=ace.manage_fcb02_study_index('check',"+lit(package['digest'])+','+lit(package['payload'])+");if r->>'state'<>'withdrawn'or(r->>'topics')::int<>109 then raise exception 'Takedown count readback incorrect';end if;end$$;")
 add('untrusted-definer-denied'  ,"alter function ace.manage_fcb02_study_index(text,text,text)owner to authenticated;"+ctx(practice.ADMIN)+call('publish'),'Trusted executor owner required')
 add('bad-action-denied',ctx(practice.ADMIN)+call('other'),'Invalid study-index action')
 return {'fixture':fixture,'cases':cases,'package':package}

def races(p,command,env,run):
 import time
 sessions=module('study_sessions',ROOT/'tests/sql/fcb_01_role_concurrency.py')
 practice=module('study_actors',ROOT/'tests/sql/fcb02_2026_practice.py')
 lit=lambda s:"'"+s.replace("'","''")+"'"
 ctx=lambda actor:"set local role authenticated;select set_config('request.jwt.claim.sub',"+lit(actor)+",true);"
 call="select ace.manage_fcb02_study_index('publish',"+lit(p['package']['digest'])+','+lit(p['package']['payload'])+")->>'state';"
 def must(sql):
  result=run(sql)
  if result.returncode:raise RuntimeError(result.stderr)
  return result.stdout.strip()
 def contend(name,first_sql,second_sql,error=None):
  first=sessions.Session(command,env,'study_'+name+'_first');second=sessions.Session(command,env,'study_'+name+'_second')
  try:
   first.send(first_sql+"\n\\echo FIRST_HELD\n");first.until('FIRST_HELD')
   second.send(second_sql+"commit;\n")
   deadline=time.monotonic()+5
   while time.monotonic()<deadline:
    if must("select wait_event_type from pg_stat_activity where pid="+str(second.backend_pid)+";")=='Lock':break
    time.sleep(.05)
   else:raise RuntimeError(name+' did not wait for expected lock')
   first.send("commit;\n")
   if first.finish()!=0:raise RuntimeError(first.output[-1500:])
   code=second.finish()
   if error:
    if code==0 or error not in second.output:raise RuntimeError(name+': '+second.output[-1500:])
   elif code!=0:raise RuntimeError(name+': '+second.output[-1500:])
   print('PASS native-contention-'+name,flush=True)
  finally:first.close();second.close()
 must('begin;'+p['fixture']+'commit;')
 row_id=must('select id from ace.subtopics order by id limit 1;')
 contend('source-edit',"begin;"+ctx(practice.ADMIN)+"update ace.subtopics set name=name||' drift'where id="+lit(row_id)+';', 'begin;'+ctx(practice.ADMIN)+call,'Source concept drift')
 must('begin;'+ctx(practice.ADMIN)+"update ace.subtopics set name=left(name,length(name)-6)where id="+lit(row_id)+';commit;')
 contend('concurrent-publication','begin;'+ctx(practice.ADMIN)+call,'begin;'+ctx(practice.ADMIN)+call)
 if must("select count(*)from ace.audit_events where event_type='ace_study_index_published';")!='1':raise RuntimeError('Duplicate publication audit')
 must("update ace.roles set role='admin'where user_id="+lit(practice.EDITOR)+';')
 for first_demotes in [True,False]:
  demote="begin;update ace.roles set role='editor'where user_id="+lit(practice.ADMIN)+';'
  check='begin;'+ctx(practice.ADMIN)+call
  contend('demotion-first'if first_demotes else'publication-first',demote if first_demotes else check,check if first_demotes else demote,'Authenticated administrator context required'if first_demotes else None)
  must("update ace.roles set role='admin'where user_id="+lit(practice.ADMIN)+';')
 return 4

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--emit',type=Path);args=parser.parse_args();p=plan()
 if args.emit: args.emit.write_text(json.dumps(p))
 else:
  import os, subprocess
  if os.environ.get('ACE_FCB02_DISPOSABLE_TEST')!='1': raise SystemExit('Explicit disposable test required')
  transport=module('bounded_study_transport',ROOT/'tests/sql/fcb_02_draft_import.py')
  command,env=transport.connection()
  def run(sql):return subprocess.run(command,input=sql,text=True,capture_output=True,cwd=ROOT,env=env,timeout=40)
  preflight=run("do $$begin if (select array_agg(column_name::text order by ordinal_position)from information_schema.columns where table_schema='auth'and table_name='users')is distinct from array['id','email','raw_user_meta_data']::text[] or exists(select 1 from auth.users)or exists(select 1 from ace.subjects)or exists(select 1 from ace.exam_configs)then raise exception 'Empty recovered disposable database required';end if;end$$;")
  if preflight.returncode:raise SystemExit(preflight.stderr)
  install=run((ROOT/'supabase/proposals/fcb02_2026_practice_draft.sql').read_text()+(ROOT/'supabase/proposals/fcb02_study_publication.sql').read_text())
  if install.returncode:raise SystemExit(install.stderr)
  for case in p['cases']:
   r=run(case['sql']);ok=(r.returncode!=0 and case['error']in r.stderr)if case['error']else r.returncode==0
   if not ok:raise SystemExit(case['name']+'\n'+r.stderr)
   print('PASS '+case['name'],flush=True)
  count=len(p['cases'])+races(p,command,env,run)
  print(str(count)+' native study-index SQL cases passed')
