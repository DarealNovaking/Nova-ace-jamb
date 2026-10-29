"""Question workflow cases. Identities and records exist only in disposable tests."""
import argparse
import json
import os
from pathlib import Path
import subprocess
import importlib.util
import time

ROOT = Path(__file__).resolve().parents[2]
AUTHOR = '03000000-0000-4000-8000-000000000001'
REVIEWER = '03000000-0000-4000-8000-000000000002'
STUDENT = '03000000-0000-4000-8000-000000000003'
Q = '03000000-0000-4000-8000-000000000004'
SUBJECT = '03000000-0000-4000-8000-000000000005'
TOPIC = '03000000-0000-4000-8000-000000000006'
SUBTOPIC = '03000000-0000-4000-8000-000000000007'
VERSION = '03000000-0000-4000-8000-000000000008'
SEASON = '03000000-0000-4000-8000-000000000009'

def literal(value):
    return "'" + json.dumps(value, ensure_ascii=False).replace("'", "''") + "'::jsonb"

def context(actor):
    return "set local role authenticated;select set_config('request.jwt.claim.sub','" + actor + "',true);"

def payload(**changes):
    return dict(subject_id=SUBJECT, topic_id=TOPIC, subtopic_id=SUBTOPIC,
                stem='What is 3 + 4?', options=[dict(key=k, text=t) for k, t in zip('ABCD', ['5','6','7','8'])],
                correct_option_key='C', explanation='Adding four to three gives seven.', difficulty='easy',
                exam='ACE practice', exam_year=None,
                provenance=dict(source_kind='original', source_title='ACE original arithmetic',
                                author_label='ACE content team', source_url=None,
                                rights_evidence='Original exercise composed for ACE; no copied source wording.'), **{}) | changes

def call(action, version, data=None, qid=Q):
    return "select ace.manage_question('" + action + "','" + qid + "'," + str(version) + ',' + literal(data or {}) + ');'

def plan():
    fixture = """do $$begin if exists(select 1 from auth.users)or exists(select 1 from ace.subjects)then raise exception 'Empty disposable fixture required';end if;end$$;
insert into auth.users(id,email,raw_user_meta_data)values('%s','author@example.invalid','{}'),('%s','reviewer@example.invalid','{}'),('%s','student@example.invalid','{}');
update ace.roles set role='editor'where user_id='%s';update ace.roles set role='admin'where user_id='%s';
select set_config('request.jwt.claim.sub','%s',true);
insert into ace.subjects(id,code,name,active)values('%s','MTH','Mathematics',true);
insert into ace.exam_seasons(id,code,name,exam_year,status)values('%s','question-test','Preparation',2027,'active');
insert into ace.syllabus_versions(id,season_id,subject_id,version,title,rights_status,status,activated_at)values('%s','%s','%s',3,'Original index','approved','active',now());
insert into ace.topics(id,subject_id,syllabus_version_id,name,active)values('%s','%s','%s','Numbers',true);
insert into ace.subtopics(id,topic_id,syllabus_version_id,name,active)values('%s','%s','%s','Addition',true);
""" % (AUTHOR,REVIEWER,STUDENT,AUTHOR,REVIEWER,REVIEWER,SUBJECT,SEASON,VERSION,SEASON,SUBJECT,TOPIC,SUBJECT,VERSION,SUBTOPIC,TOPIC,VERSION)
    create = context(AUTHOR) + call('save', 0, payload())
    submit = create + call('submit', 1)
    approve = submit + context(REVIEWER) + call('approve', 2)
    published = approve + call('publish', 3)
    cases = []
    def add(name, sql, error=None, isolation='read committed'):
        cases.append(dict(name=name, sql='begin isolation level '+isolation+';'+fixture+sql+'rollback;', error=error))
    def check(sql):
        return 'reset role;do $$begin '+sql+'end$$;'
    add('creates-private-versioned-audited-draft', create+check("if not exists(select 1 from ace.questions where id='"+Q+"'and review_status='draft'and not active and rights_status='unknown'and content_version=1 and created_by='"+AUTHOR+"')or(select count(*)from ace.question_versions)<>1 or(select count(*)from ace.audit_events where event_type='question_saved')<>1 then raise exception 'Draft was not created atomically';end if;"))
    add('independent-review-publication-withdrawal',published+call('withdraw',4,{'reason':'Acceptance takedown'})+check("if not exists(select 1 from ace.questions where review_status='approved'and not active and content_version=5)or(select count(*)from ace.question_versions)<>5 then raise exception 'Lifecycle failed';end if;"))
    for actor,name in [(STUDENT,'student'),('','identity-free')]:
        add(name+'-authoring-denied',context(actor)+call('save',0,payload()),'Question authoring permission required')
        add(name+'-review-list-denied',context(actor)+"select ace.review_questions(null,0);",'Question authoring permission required')
    add('anonymous-denied','set local role anon;'+call('save',0,payload()),'permission denied')
    add('editor-cannot-approve',submit+call('approve',2),'Administrator review required')
    add('administrator-cannot-approve-own-content',"update ace.roles set role='admin'where user_id='"+AUTHOR+"';"+submit+call('approve',2),'Independent reviewer required')
    add('cannot-publish-before-approval',submit+context(REVIEWER)+call('publish',2),'Invalid question transition')
    add('stale-revision-refused',create+call('save',0,payload(stem='Changed question')),'Question revision changed')
    add('duplicate-creation-refused',create+call('save',0,payload(stem='  WHAT  is 3 + 4?  '),qid='03000000-0000-4000-8000-000000000099'),'Duplicate question')
    add('published-edit-refused',published+context(AUTHOR)+call('save',4,payload()),'Withdraw published question before editing')
    add('edit-resets-review-and-preserves-old-history',approve+context(AUTHOR)+call('save',3,payload(stem='What is four plus three?'))+check("if not exists(select 1 from ace.questions where review_status='draft'and rights_status='unknown'and reviewed_by is null and content_version=4)or(select snapshot->>'stem'from ace.question_versions where version=1)<>'What is 3 + 4?'then raise exception 'Edit did not reset approval or preserve history';end if;"))
    add('direct-table-write-denied',create+"update ace.questions set active=true;",'permission denied')
    add('student-answer-key-read-denied',published+context(STUDENT)+"select correct_option_key from ace.questions;",'permission denied')
    add('student-history-read-denied',published+context(STUDENT)+"select *from ace.question_versions;",'permission denied')
    add('history-immutable',create+"reset role;update ace.question_versions set snapshot='{}';",'Question history is immutable')
    add('reject-requires-note',submit+context(REVIEWER)+call('reject',2),'Review reason required')
    add('rejection-remains-private',submit+context(REVIEWER)+call('reject',2,{'reason':'Ambiguous wording'})+check("if not exists(select 1 from ace.questions where review_status='rejected'and not active and rights_status='unknown')then raise exception 'Rejection failed';end if;"))
    add('history-insert-failure-rolls-back',"alter table ace.question_versions add constraint reject_snapshot check(false)not valid;"+context(AUTHOR)+"do $$begin begin perform ace.manage_question('save','"+Q+"',0,"+literal(payload())+");raise exception 'Expected history insert failure';exception when check_violation then null;end;end$$;"+check("if exists(select 1 from ace.questions)or exists(select 1 from ace.audit_events where event_type='question_saved')then raise exception 'Partial mutation survived';end if;"))
    for name,data in [('blank-stem',payload(stem=' ')),('bad-answer',payload(correct_option_key='E')),('repeated-option',payload(options=[{'key':k,'text':'same'}for k in 'ABCD'])),('missing-explanation',payload(explanation='')),('unknown-field',payload(active=True)),('oversized-stem',payload(stem='x'*20001)),('wrong-ancestry',payload(subject_id=STUDENT)),('unsupported-media',payload(media=[{'url':'https://example.invalid'}])),('false-past-year',payload(exam_year=2026)),('rights-notes-missing',payload(provenance={}))]:
        add(name+'-refused',context(AUTHOR)+call('save',0,data),'Invalid question')
    add('inactive-taxonomy-refused',"update ace.topics set active=false;"+context(AUTHOR)+call('save',0,payload()),'Invalid question taxonomy')
    for value,label in [('\t\n','ascii'),('\u00a0','nbsp'),('\ufeff','bom'),('\u2028','line-separator')]:
        for field in ['stem','explanation']:
            add(label+'-blank-'+field+'-refused',context(AUTHOR)+call('save',0,payload(**{field:value})),'Invalid question')
        add(label+'-blank-source-refused',context(AUTHOR)+call('save',0,payload(provenance=payload()['provenance']|{'rights_evidence':value})),'Invalid question')
        add(label+'-duplicate-stem-refused',create+call('save',0,payload(stem=value+'WHAT is 3 + 4?'+value),qid='03000000-0000-4000-8000-000000000099'),'Duplicate question')
        add(label+'-duplicate-option-refused',context(AUTHOR)+call('save',0,payload(options=[{'key':'A','text':'5'},{'key':'B','text':value+'5'+value},{'key':'C','text':'7'},{'key':'D','text':'8'}])),'Invalid question')
    add('untrusted-executor-refused',"alter function ace.manage_question(text,uuid,integer,jsonb)owner to authenticated;"+create,'Trusted executor owner required')
    add('repeatable-read-refused',create,'Read committed transaction required','repeatable read')
    add('listing-paginates-and-filters',create+"do $$declare r jsonb;begin r:=ace.review_questions('draft',0);if jsonb_array_length(r->'questions')<>1 or(r->>'has_next')::boolean then raise exception 'Incorrect queue';end if;end$$;")
    add('bad-page-refused',context(AUTHOR)+"select ace.review_questions(null,-1);",'Invalid question page')
    add('snapshot-owner-denial-does-not-enable-history-edit',create+"delete from ace.question_versions;",'permission denied')
    return dict(fixture=fixture,cases=cases)

def races(command, env, run):
    spec=importlib.util.spec_from_file_location('question_sessions',ROOT/'tests/sql/fcb_01_role_concurrency.py')
    sessions=importlib.util.module_from_spec(spec);spec.loader.exec_module(sessions)
    def must(sql):
        result=run(sql)
        if result.returncode:raise RuntimeError(result.stderr)
        # psql's default table display is avoided for the observer's scalar queries.
        return result.stdout
    def contend(name, first_sql, second_sql, error=None):
        first=sessions.Session(command,env,'question_'+name+'_first');second=sessions.Session(command,env,'question_'+name+'_second')
        try:
            first.send(first_sql+'\n\\echo FIRST_HELD\n');first.until('FIRST_HELD')
            second.send(second_sql+'commit;\n')
            deadline=time.monotonic()+5
            while time.monotonic()<deadline:
                if 'Lock' in must('select wait_event_type from pg_stat_activity where pid='+str(second.backend_pid)+';'):break
                time.sleep(.05)
            else:raise RuntimeError(name+' did not wait for the expected lock')
            first.send('commit;\n')
            if first.finish()!=0:raise RuntimeError(first.output[-2000:])
            code=second.finish()
            if error:
                if code==0 or error not in second.output:raise RuntimeError(name+': '+second.output[-2000:])
            elif code!=0:raise RuntimeError(name+': '+second.output[-2000:])
            print('PASS native-contention-'+name,flush=True)
        finally:first.close();second.close()
    must('begin;'+plan()['fixture']+'commit;')
    create=call('save',0,payload())
    contend('duplicate-create','begin;'+context(AUTHOR)+create,'begin;'+context(AUTHOR)+call('save',0,payload(),qid='03000000-0000-4000-8000-000000000099'),'Duplicate question')
    contend('stale-edit','begin;'+context(AUTHOR)+call('save',1,payload(stem='First concurrent edit')),'begin;'+context(AUTHOR)+call('save',1,payload(stem='Second concurrent edit')),'Question revision changed')
    demote="begin;update ace.roles set role='student'where user_id='"+AUTHOR+"';"
    edit='begin;'+context(AUTHOR)+call('save',2,payload(stem='Authorized before demotion'))
    contend('authoring-before-demotion',edit,demote)
    must("update ace.roles set role='editor'where user_id='"+AUTHOR+"';")
    contend('demotion-before-authoring',demote,'begin;'+context(AUTHOR)+call('save',3,payload(stem='Refused after demotion')),'Question authoring permission required')
    must("do $$begin if(select content_version from ace.questions where id='"+Q+"')<>3 or(select count(*)from ace.question_versions)<>3 then raise exception 'Concurrent revisions were lost or duplicated';end if;end$$;")

if __name__ == '__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--emit',action='store_true');parser.add_argument('--races',action='store_true');args=parser.parse_args()
    if args.emit:
        print(json.dumps(plan()));raise SystemExit
    # A full recovered schema may only be tested in the explicitly named disposable database.
    if os.environ.get('ACE_FCB03_DISPOSABLE_TEST')!='1' or os.environ.get('PGDATABASE')!='fcb03_question_test' or os.environ.get('PGHOST')!='127.0.0.1' or os.environ.get('PGUSER')!='postgres':
        raise SystemExit('Explicit local fcb03_question_test disposable database required')
    port=os.environ.get('PGPORT','5432')
    if not port.isdigit() or not 1<=int(port)<=65535:raise SystemExit('Invalid disposable port')
    env={k:v for k,v in os.environ.items()if not k.startswith('PG')}
    if 'PGPASSWORD'in os.environ:env['PGPASSWORD']=os.environ['PGPASSWORD']
    env['PGCONNECT_TIMEOUT']='5'
    command=['psql','-X','-qAt','--no-password','--host=127.0.0.1','--port='+port,'--username=postgres','--dbname=fcb03_question_test','-v','ON_ERROR_STOP=1']
    def run(sql):return subprocess.run(command,input=sql,text=True,capture_output=True,cwd=ROOT,env=env,timeout=30)
    preflight=run("do $$begin if(select array_agg(column_name::text order by ordinal_position)from information_schema.columns where table_schema='auth'and table_name='users')is distinct from array['id','email','raw_user_meta_data']::text[] or exists(select 1 from auth.users)or exists(select 1 from ace.questions)or exists(select 1 from ace.subjects)then raise exception 'Empty recovered disposable database required';end if;end$$;")
    if preflight.returncode:raise SystemExit(preflight.stderr)
    installed=run((ROOT/'supabase/proposals/fcb03_question_workflow.sql').read_text())
    if installed.returncode:raise SystemExit(installed.stderr)
    for case in plan()['cases']:
        result=run(case['sql']);error=case['error']
        if (error and (result.returncode==0 or error not in result.stderr))or(not error and result.returncode):raise SystemExit(case['name']+': '+result.stderr)
        print('PASS '+case['name'])
    if args.races:races(command,env,run)
