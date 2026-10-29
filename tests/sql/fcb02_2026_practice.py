#!/usr/bin/env python3
"""Fixed baseline behavior on an empty isolated recovered database only."""
import argparse,json,os,subprocess
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
 def add(name,body,error=None):cases.append({'name':name,'sql':'begin;'+fixture+body+'rollback;','error':error})
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
 add('new-draft-student-invisible',ctx(ADMIN)+call+ctx(STUDENT)+"do $$begin if exists(select 1 from ace.exam_configs where id='"+TARGET+"')or exists(select 1 from ace.exam_config_subjects where exam_config_id='"+TARGET+"')then raise exception 'Draft leaked';end if;end$$;")
 return {'fixture':fixture,'cases':cases}
def main():
 a=argparse.ArgumentParser();a.add_argument('--emit',type=Path);a.add_argument('--installer',type=Path,default=ROOT/'supabase/proposals/fcb02_2026_practice_draft.sql');v=a.parse_args();p=plan()
 if v.emit:v.emit.write_text(json.dumps(p));return
 if os.environ.get('ACE_FCB02_DISPOSABLE_TEST')!='1' or not os.environ.get('PGDATABASE','').endswith('_test'):raise SystemExit('Explicit disposable *_test database required')
 def run(sql):return subprocess.run(['psql','-X','-v','ON_ERROR_STOP=1'],input=sql,text=True,capture_output=True)
 r=run(v.installer.read_text())
 if r.returncode:raise SystemExit(r.stderr)
 for c in p['cases']:
  r=run(c['sql']);ok=(r.returncode!=0 and c['error']in r.stderr)if c['error']else r.returncode==0
  if not ok:raise SystemExit(c['name']+'\n'+r.stderr+'\n'+r.stdout[-800:])
  print('PASS',c['name'],flush=True)
 print('2026 practice draft: '+str(len(p['cases']))+' native SQL cases passed')
if __name__=='__main__':main()
