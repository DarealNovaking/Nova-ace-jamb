#!/usr/bin/env python3
"""Real SQL scenarios for an explicitly isolated recovered test database only."""
import argparse
import copy
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location('fcb02_import', ROOT/'scripts/prepare-fcb02-import.py')
module = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(module)
ADMIN = '02000000-0000-4000-8000-000000000001'
EDITOR = '02000000-0000-4000-8000-000000000002'
STUDENT = '02000000-0000-4000-8000-000000000003'


def literal(value): return module.sql_literal(json.dumps(value,ensure_ascii=False))


def fixture(p):
    snapshot = json.loads((ROOT/'docs/content-review/fcb-02-import-target-snapshot-2026-10-28.json').read_text())['snapshot']
    old = [{**v, 'provenance': {'synthetic_test_fixture': True}, 'activated_at': None} for v in snapshot['versions']]
    seasons = snapshot['seasons']
    # Refuse a populated database before inserting any fixture.
    return f"""begin;
do $$ begin
 if (select array_agg(column_name::text order by ordinal_position) from information_schema.columns where table_schema='auth' and table_name='users') is distinct from array['id','email','raw_user_meta_data']::text[] then raise exception 'Unexpected auth schema; refusing fixture';end if;
 if exists(select 1 from ace.subjects) or exists(select 1 from ace.syllabus_versions) or exists(select 1 from auth.users) then
  raise exception 'FCB-02 fixture requires empty recovered test database';
 end if;
end $$;
insert into auth.users(id,email,raw_user_meta_data) values
 ('{ADMIN}','fcb02-admin@example.invalid','{{}}'),('{EDITOR}','fcb02-editor@example.invalid','{{}}'),('{STUDENT}','fcb02-student@example.invalid','{{}}');
update ace.roles set role='admin' where user_id='{ADMIN}';
update ace.roles set role='editor' where user_id='{EDITOR}';
select set_config('request.jwt.claim.sub','{ADMIN}',true);
insert into ace.subjects(id,code,name,active) select id,code,name,active from jsonb_populate_recordset(null::ace.subjects,{literal(p['subjects'])}::jsonb);
""" + ''.join(f"insert into ace.exam_seasons(id,code,name,exam_year,status) values ('{s['id']}','fcb02-synthetic-{s['exam_year']}',{module.sql_literal(s['name'])},{s['exam_year']},{module.sql_literal(s['status'])});\n" for s in seasons) + f"insert into ace.syllabus_versions({module.COLUMNS['versions']}) select {module.COLUMNS['versions']} from jsonb_populate_recordset(null::ace.syllabus_versions,{literal(old)}::jsonb);\ncommit;\n"


def context(p, actor=ADMIN, digest=True):
    return f"set local role authenticated; select set_config('request.jwt.claim.sub','{actor}',true);" + (f"select set_config('ace.fcb02_review_digest','{p['review_digest']}',true);" if digest else '')


def counts_sql(versions=50, topics=0, subtopics=0):
    return f"""do $$ begin
 if (select count(*) from ace.syllabus_versions)<>{versions} or (select count(*) from ace.topics)<>{topics} or (select count(*) from ace.subtopics)<>{subtopics} then raise exception 'Unexpected taxonomy counts'; end if;
end $$;"""


def scenarios(p):
    apply = module.render_body(p)
    undo = module.render_body(p,rollback=True)
    ctx = context(p)
    cases = []
    def add(name,sql,error=None): cases.append({'name':name,'sql':sql,'expected_error':error})
    add('missing-reviewed-digest','begin;'+context(p,digest=False)+apply+'rollback;', 'Explicit reviewed package digest required')
    add('identity-free-owner-denied','begin;'+context(p,actor='')+apply+'rollback;','Authenticated administrator context required')
    for name,actor in [('student',STUDENT),('editor',EDITOR)]:
        add(name+'-bulk-import-denied','begin;'+context(p,actor=actor)+apply+'rollback;','Authenticated administrator context required')
    add('atomic-inactive-stage-and-exact-replay','begin;'+ctx+apply+counts_sql(75,214,954)+apply+counts_sql(75,214,954)+
        "reset role;do $$ begin if (select count(*) from ace.audit_events where event_type='syllabus_version_created')<>75 then raise exception 'Replay duplicated version audit'; end if; end $$;rollback;")
    add('student-cannot-read-staged-content','begin;'+ctx+apply+context(p,actor=STUDENT)+counts_sql(0,0,0)+'rollback;')
    add('anon-cannot-read-staged-taxonomy','begin;'+ctx+apply+'set local role anon;'+
        "do $$ begin if exists(select 1 from ace.topics) or exists(select 1 from ace.subtopics) then raise exception 'Anonymous draft leak'; end if;end $$;rollback;",'permission denied')
    add('rls-filtered-admin-undo-refused','begin;'+ctx+apply+undo+'rollback;','Rollback requires trusted database owner context')
    add('guarded-undo-roundtrip','begin;'+ctx+apply+'reset role;'+undo+counts_sql()+undo+counts_sql()+'rollback;')
    topic=p['topics'][0];sub=p['subtopics'][0];version=p['versions'][0]
    add('edited-topic-refuses-replay','begin;'+ctx+apply+f"update ace.topics set name='Edited after staging' where id='{topic['id']}';"+apply+'rollback;','Package row drift in topics')
    add('edited-child-refuses-undo','begin;'+ctx+apply+f"update ace.subtopics set description='Edited after staging' where id='{sub['id']}';"+'reset role;'+undo+'rollback;','Package row drift in subtopics')
    add('approved-version-refuses-undo','begin;'+ctx+apply+f"update ace.syllabus_versions set rights_status='approved' where id='{version['id']}';"+'reset role;'+undo+'rollback;','Package row drift in syllabus_versions')
    add('additional-child-refuses-undo','begin;'+ctx+apply+f"insert into ace.subtopics(topic_id,syllabus_version_id,name,active) values('{topic['id']}','{topic['syllabus_version_id']}','Later authored child',false);"+'reset role;'+undo+'rollback;','Package row drift in subtopics')
    add('referenced-flashcard-refuses-undo','begin;'+ctx+apply+'reset role;'+f"insert into ace.flashcards(topic_id,subject_id,front,back,active) values('{topic['id']}','{topic['subject_id']}','Synthetic front','Synthetic back',false);"+'reset role;'+undo+'rollback;','Referenced draft content: flashcards')
    add('target-season-drift-refused',"begin;"+ctx+"reset role;update ace.exam_seasons set name='Changed season title' where exam_year=2027;set local role authenticated;"+apply+'rollback;','Target season drift')
    add('schema-reference-drift-refused',"begin;create table ace.fcb02_synthetic_reference(topic_id uuid references ace.topics(id) on delete cascade);"+ctx+apply+'rollback;','Foreign-key contract drift')
    referenced = p['subtopics'][0]
    add('other-student-progress-refuses-undo','begin;'+ctx+apply+'reset role;'+f"insert into ace.learning_progress(user_id,subject_id,topic_id,subtopic_id) values('{STUDENT}',(select subject_id from ace.topics where id='{referenced['topic_id']}'),'{referenced['topic_id']}','{referenced['id']}');"+undo+'rollback;','Referenced draft content: learning_progress')
    special = copy.deepcopy(p)
    malicious = "O'Brien \\ $fcb02$ test'); drop table ace.subjects; --"
    special['topics'][0]['name'] = malicious
    special['review_digest'] = module.digest({k:v for k,v in special.items() if k!='review_digest'})
    encoded = malicious.encode().hex()
    add('quoted-text-is-data-not-sql','begin;'+context(special)+module.render_body(special)+f"do $$ begin if (select encode(convert_to(name,'UTF8'),'hex') from ace.topics where id='{special['topics'][0]['id']}')<>'{encoded}' then raise exception 'Quoted text changed';end if;end $$;"+counts_sql(75,214,954)+'rollback;')
    tampered = copy.deepcopy(p)
    tampered['topics'][0]['name'] = 'Payload altered without reviewed digest'
    add('payload-tampering-refused','begin;'+ctx+module.render_body(tampered)+'rollback;','Payload digest mismatch')
    # Exercise actual generated transaction wrappers, including default preview ROLLBACK.
    session=f"set role authenticated;select set_config('request.jwt.claim.sub','{ADMIN}',false);select set_config('ace.fcb02_review_digest','{p['review_digest']}',false);"
    add('generated-preview-rolls-back',session+module.render_sql(p,'preview')+'reset role;'+counts_sql())
    add('generated-apply-replay-and-rollback',session+module.render_sql(p,'apply')+counts_sql(75,214,954)+module.render_sql(p,'apply')+counts_sql(75,214,954)+'reset role;'+module.render_sql(p,'rollback')+counts_sql()+'reset role;')
    return cases


def executor_scenarios(p):
    cases=[]
    def add(name,sql,error=None): cases.append({'name':'executor-'+name,'sql':sql,'expected_error':error})
    def call(action='preview', payload=None, review=None):
        return "select ace.manage_fcb02_draft("+','.join(module.sql_literal(v) for v in (action,review or p['review_digest'],payload if payload is not None else module.payload_text(p)))+");"
    ctx=context(p,digest=False)
    add('preview-does-not-stage','begin;'+ctx+call()+counts_sql()+'rollback;')
    for name,actor in [('student',STUDENT),('editor',EDITOR),('no-identity','')]:
        add(name+'-denied','begin;'+context(p,actor=actor,digest=False)+call('stage')+'rollback;','Authenticated administrator context required')
    add('anon-denied','begin;set local role anon;'+call()+'rollback;','permission denied')
    add('untrusted-owner-denied',"begin;alter function ace.manage_fcb02_draft(text,text,text) owner to authenticated;"+ctx+call('undo')+'rollback;','Trusted executor owner required')
    add('invalid-action','begin;'+ctx+call('publish')+'rollback;','Invalid package action')
    add('wrong-digest','begin;'+ctx+call(review='0'*64)+'rollback;','Reviewed package mismatch')
    add('tampered-payload','begin;'+ctx+call(payload=module.payload_text(p).replace('IBASS','OTHER',1))+'rollback;','Reviewed package mismatch')
    add('malformed-payload','begin;'+ctx+call(payload='{')+'rollback;','Reviewed package mismatch')
    add('stage-replay-private-and-undo','begin;'+ctx+call('stage')+counts_sql(75,214,954)+call('stage')+call()+context(p,actor=STUDENT)+counts_sql(0,0,0)+ctx+call('undo')+counts_sql()+call('undo')+"reset role;do $$ begin if (select count(*) from ace.audit_events where event_type in ('syllabus_review_package_staged','syllabus_review_package_removed'))<>2 then raise exception 'Replay duplicated bulk audit';end if;end $$;rollback;")
    topic=p['topics'][0]
    add('edited-content-undo-refused','begin;'+ctx+call('stage')+f"update ace.topics set name='Changed' where id='{topic['id']}';"+call('undo')+'rollback;','Package row drift in topics')
    referenced=p['subtopics'][0]
    reference=f"insert into ace.learning_progress(user_id,subject_id,topic_id,subtopic_id) values('{STUDENT}',(select subject_id from ace.topics where id='{referenced['topic_id']}'),'{referenced['topic_id']}','{referenced['id']}');"
    add('hidden-reference-preview-disabled','begin;'+ctx+call('stage')+'reset role;'+reference+ctx+"do $test$ declare result jsonb;begin "+call().replace('select ace.', 'result := ace.').rstrip(';')+";if (result->>'can_undo')::boolean then raise exception 'Unsafe removal offered';end if;end $test$;rollback;")
    add('hidden-reference-undo-refused','begin;'+ctx+call('stage')+'reset role;'+reference+ctx+call('undo')+'rollback;','Referenced draft content; removal refused')
    uninstall=module.render_uninstall(p).replace('begin;','',1).rsplit('commit;',1)[0]
    add('uninstall-only-helper','begin;'+uninstall+counts_sql()+'rollback;')
    add('changed-helper-uninstall-refused',"begin;alter function ace.manage_fcb02_draft(text,text,text) security invoker;"+uninstall+'rollback;','Executor definition drift')
    return cases


def connection():
    if os.environ.get('PGHOST','127.0.0.1')!='127.0.0.1' or os.environ.get('PGDATABASE')!='fcb02_review_test' or os.environ.get('PGUSER','postgres')!='postgres':
        raise RuntimeError('Only local postgres/fcb02_review_test disposable database is permitted')
    port=os.environ.get('PGPORT','5432')
    if not port.isdigit() or not 1<=int(port)<=65535:raise RuntimeError('Invalid disposable port')
    env={k:v for k,v in os.environ.items() if not k.startswith('PG')}
    if 'PGPASSWORD' in os.environ:env['PGPASSWORD']=os.environ['PGPASSWORD']
    env['PGCONNECT_TIMEOUT']='5'
    args=['psql','-X','-qAt','--no-password','-v','ON_ERROR_STOP=1','-v','VERBOSITY=verbose','--host=127.0.0.1',f'--port={port}','--username=postgres','--dbname=fcb02_review_test']
    return args,env


def run_psql(sql):
    args,env=connection()
    return subprocess.run(args,input="set log_min_error_statement=panic;"+sql,text=True,capture_output=True,cwd=ROOT,env=env,timeout=40)


def reference_race(p, executor=False):
    # Reuse the bounded psql session transport; its fixture-specific connection helper is not used.
    spec=importlib.util.spec_from_file_location('fcb01_sessions',ROOT/'tests/sql/fcb_01_role_concurrency.py')
    sessions_module=importlib.util.module_from_spec(spec);spec.loader.exec_module(sessions_module)
    args,env=connection();sessions=[]
    session_context=f"select set_config('request.jwt.claim.sub','{ADMIN}',false);select set_config('ace.fcb02_review_digest','{p['review_digest']}',false);"
    def rpc(action): return "select ace.manage_fcb02_draft("+','.join(module.sql_literal(v) for v in (action,p['review_digest'],module.payload_text(p)))+");"
    stage_sql="begin;set local role authenticated;"+session_context+rpc('stage')+"commit;" if executor else session_context+module.render_sql(p,'apply')
    undo_sql="begin;set local role authenticated;"+session_context+rpc('undo')+"commit;" if executor else session_context+module.render_sql(p,'rollback')
    staged=run_psql(stage_sql)
    if staged.returncode:raise RuntimeError(staged.stderr)
    topic=p['topics'][0];flashcard='03000000-0000-4000-8000-000000000001'
    try:
        writer=sessions_module.Session(args,env,'fcb02_reference_writer');sessions.append(writer)
        writer.send(f"begin;insert into ace.flashcards(id,topic_id,subject_id,front,back,active) values('{flashcard}','{topic['id']}','{topic['subject_id']}','Synthetic race','Synthetic answer',false);"+chr(10)+chr(92)+"echo REFERENCE_HELD"+chr(10))
        writer.until('REFERENCE_HELD')
        undo=sessions_module.Session(args,env,'fcb02_undo');sessions.append(undo)
        undo.send('set log_min_error_statement=panic;'+undo_sql)
        deadline=time.monotonic()+10
        while time.monotonic()<deadline:
            waiting=run_psql(f"select wait_event_type from pg_stat_activity where pid={undo.backend_pid};")
            if waiting.stdout.strip()=='Lock':break
            time.sleep(0.05)
        else:raise RuntimeError('Rollback did not wait for concurrent reference writer')
        writer.send("commit;"+chr(10));writer.finish()
        if undo.finish()==0 or ('Referenced draft content; removal refused' if executor else 'Referenced draft content: flashcards') not in undo.output:
            raise RuntimeError('Concurrent reference was not protected: '+undo.output[-1500:])
        check=run_psql(f"select count(*) from ace.flashcards where id='{flashcard}' and topic_id='{topic['id']}';")
        if check.stdout.strip()!='1':raise RuntimeError('Concurrent reference was detached or deleted')
    finally:
        for session in sessions:session.close()
        cleanup=run_psql(f"delete from ace.flashcards where id='{flashcard}';"+undo_sql)
        if cleanup.returncode:raise RuntimeError(cleanup.stderr)
    final=run_psql(counts_sql())
    if final.returncode:raise RuntimeError(final.stderr)
    return {'name':('executor-' if executor else '')+'concurrent-reference-protects-rollback','status':'PASS'}


def executor_role_race(p, demotion_first):
    spec=importlib.util.spec_from_file_location('fcb01_sessions',ROOT/'tests/sql/fcb_01_role_concurrency.py')
    transport=importlib.util.module_from_spec(spec);spec.loader.exec_module(transport)
    args,env=connection();sessions=[]
    # A second synthetic admin avoids testing the unrelated last-admin invariant.
    setup=run_psql(f"update ace.roles set role='admin' where user_id='{EDITOR}';")
    if setup.returncode:raise RuntimeError(setup.stderr)
    call="select ace.manage_fcb02_draft("+','.join(module.sql_literal(v) for v in ('stage',p['review_digest'],module.payload_text(p)))+");"
    try:
        demoter=transport.Session(args,env,'executor_demoter');sessions.append(demoter)
        actor=transport.Session(args,env,'executor_actor');sessions.append(actor)
        first,second=(demoter,actor) if demotion_first else (actor,demoter)
        demote=f"begin;update ace.roles set role='editor' where user_id='{ADMIN}';"
        stage="set log_min_error_statement=panic;begin;"+context(p,digest=False)+call
        first.send((demote if demotion_first else stage)+chr(10)+chr(92)+"echo FIRST_HELD"+chr(10));first.until('FIRST_HELD')
        second.send((stage if demotion_first else demote)+"commit;"+chr(10))
        deadline=time.monotonic()+10
        while time.monotonic()<deadline:
            wait=run_psql(f"select wait_event_type from pg_stat_activity where pid={second.backend_pid};")
            if wait.stdout.strip()=='Lock':break
            time.sleep(0.05)
        else:raise RuntimeError('Executor authorization did not serialize with demotion')
        first.send("commit;"+chr(10))
        if first.finish()!=0:raise RuntimeError(first.output[-1500:])
        result=second.finish()
        if demotion_first:
            if result==0 or 'Authenticated administrator context required' not in second.output:raise RuntimeError('Demoted actor executed package')
        elif result!=0:raise RuntimeError(second.output[-1500:])
        check=run_psql(counts_sql() if demotion_first else counts_sql(75,214,954))
        if check.returncode:raise RuntimeError(check.stderr)
    finally:
        for session in sessions:session.close()
        cleanup=run_psql(f"update ace.roles set role='admin' where user_id='{ADMIN}';update ace.roles set role='editor' where user_id='{EDITOR}';begin;"+context(p,digest=False)+"select ace.manage_fcb02_draft("+','.join(module.sql_literal(v) for v in ('undo',p['review_digest'],module.payload_text(p)))+");commit;")
        if cleanup.returncode:raise RuntimeError(cleanup.stderr)
    return {'name':'executor-'+('demotion-first-denies-stage' if demotion_first else 'stage-holds-authorization-until-commit'),'status':'PASS'}


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output-dir',type=Path,required=True)
    parser.add_argument('--emit-cases',type=Path)
    args=parser.parse_args()
    p=json.loads((args.output_dir/'proposal.json').read_text())
    plan={'fixture':fixture(p)+module.render_executor(p),'cases':scenarios(p)+executor_scenarios(p)}
    if args.emit_cases:
        args.emit_cases.write_text(json.dumps(plan));return
    if os.environ.get('ACE_FCB02_DISPOSABLE_TEST')!='1' or not os.environ.get('PGDATABASE','').endswith('_test'):
        raise SystemExit('Explicit isolated *_test database and ACE_FCB02_DISPOSABLE_TEST=1 required')
    result=run_psql(plan['fixture'])
    if result.returncode:raise SystemExit(result.stderr)
    outcomes=[]
    for case in plan['cases']:
        result=run_psql(case['sql'])
        expected=case['expected_error']
        ok=(expected in result.stderr and result.returncode!=0) if expected else result.returncode==0
        if not ok:raise SystemExit(case['name']+'\n'+result.stderr+'\n'+result.stdout[-1500:])
        # A failed transaction and every temporary scenario must preserve all original rows.
        verify=run_psql(counts_sql())
        if verify.returncode:raise SystemExit(case['name']+' left partial data: '+verify.stderr)
        outcomes.append({'name':case['name'],'status':'PASS'})
        print('PASS',case['name'],flush=True)
    outcomes.append(reference_race(p))
    print('PASS concurrent-reference-protects-rollback',flush=True)
    for outcome in (reference_race(p,executor=True),executor_role_race(p,True),executor_role_race(p,False)):
        outcomes.append(outcome);print('PASS',outcome['name'],flush=True)
    (args.output_dir/'test-results.json').write_text(json.dumps({'engine':'native PostgreSQL','cases':outcomes},indent=2)+'\n')
    print(f'FCB-02 draft import: {len(outcomes)} native SQL scenarios passed')

if __name__=='__main__':main()
