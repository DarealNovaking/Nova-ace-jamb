"""Local synthetic-only approval races; reuses native psql session primitives."""
from pathlib import Path
import subprocess
import sys
import time
from threading import Event
from fcb_01_role_concurrency import Session, connection, query

ADMIN='81000000-0000-4000-8000-000000000001'
SECOND='82000000-0000-4000-8000-000000000002'
SEASON='83000000-0000-4000-8000-000000000001'
OTHER_SEASON='83000000-0000-4000-8000-000000000002'
FIRST='85000000-0000-4000-8000-000000000001'
OTHER='85000000-0000-4000-8000-000000000002'
THIRD='85000000-0000-4000-8000-000000000003'

def user(sql,uid=ADMIN):
    return f"set local role authenticated; select set_config('request.jwt.claim.sub','{uid}',true); {sql}"

def seed(args,env):
    shape=query(args,env,"""select case when
      (select array_agg(column_name::text order by ordinal_position) from information_schema.columns
       where table_schema='auth' and table_name='users')=array['id','email','raw_user_meta_data']::text[]
      and (select count(*) from auth.users)=0 and (select count(*) from ace.questions)=0
      and (select count(*) from ace.exam_seasons)=0 and (select count(*) from pg_tables where schemaname='ace')=51
      and to_regclass('ace.cbt_start_usage') is not null
      then 'synthetic-approval-fixture' else 'refused' end;""")
    if shape!='synthetic-approval-fixture':
        raise RuntimeError('Refusing database: exact empty synthetic recovered fixture required')
    query(args,env,Path('tests/sql/fixtures/fcb_01_exam_config.sql').read_text()+f"\nupdate ace.roles set role='admin' where user_id='{SECOND}'; commit;")

def race(args,env,isolation,kind):
    season=kind=='season'
    if season:
        query(args,env,"update ace.exam_seasons set status='draft';")
    else:
        query(args,env,f"update ace.roles set role='{ 'editor' if kind=='edit' else 'admin'}' where user_id='{SECOND}';")
    first=f"ace.activate_exam_season('{SEASON}')" if season else f"ace.activate_exam_config('{FIRST}')"
    second=f"ace.activate_exam_season('{OTHER_SEASON}')" if season else f"ace.activate_exam_config('{OTHER}')"
    if kind=='edit':
        command=f"update ace.exam_config_subjects set question_count=2 where exam_config_id='{FIRST}';"
    else:
        command=f'select {second};'
    sessions=[]
    try:
        a,b=Session(args,env,'approval_a'),Session(args,env,'approval_b');sessions.extend([a,b])
        a.send('begin;'+user("select 'FIRST_READY';")+'\n\\echo FIRST_READY\n');a.until('FIRST_READY')
        snapshot="select count(*) from ace.exam_seasons;" if season else f"select ace.validate_exam_config('{OTHER}');"
        b.send(f'begin isolation level {isolation};'+user(snapshot,SECOND)+'\n\\echo SECOND_SNAPSHOT\n');b.until('SECOND_SNAPSHOT')
        a.send(f'select {first};\n\\echo FIRST_APPROVED\n');a.until('FIRST_APPROVED')
        b.send("set local statement_timeout='15s';"+command+'commit;\n\\echo SECOND_FINISHED\n')
        deadline,poll=time.monotonic()+10,Event()
        while query(args,env,f'select {a.backend_pid}=any(pg_blocking_pids({b.backend_pid}));')!='t':
            if b.process.poll() is not None or time.monotonic()>=deadline:
                raise RuntimeError('Competing approval/edit did not wait for approval lock')
            poll.wait(0.05)
        a.send('commit;\n\\echo FIRST_COMMITTED\n');a.until('FIRST_COMMITTED')
        if a.finish()!=0: raise RuntimeError('First approval failed: '+a.output)
        status=b.finish()
        if isolation=='REPEATABLE READ':
            if status==0 or '40001' not in b.output: raise RuntimeError('Stale approval was not rejected: '+b.output)
            query(args,env,'begin;'+user(f'select {second};',SECOND)+'commit;')
        elif kind=='edit':
            if status==0 or '42501' not in b.output: raise RuntimeError('Editor changed newly active composition: '+b.output)
        elif status!=0: raise RuntimeError('Second approval failed: '+b.output)
        if season:
            observed=query(args,env,"select id from ace.exam_seasons where status='active';")
            if observed!=OTHER_SEASON: raise RuntimeError('Multiple/wrong active seasons: '+observed)
        else:
            observed=query(args,env,f"select id from ace.exam_configs where season_id='{SEASON}' and active;")
            expected=FIRST if kind=='edit' else OTHER
            if observed!=expected: raise RuntimeError('Multiple/wrong active configurations: '+observed)
            if kind=='edit' and query(args,env,f"select max(question_count) from ace.exam_config_subjects where exam_config_id='{FIRST}';")!='1':
                raise RuntimeError('Approved composition changed')
        print(f'PASS approval {kind} {isolation}: single approved state; stale/unauthorized writes excluded')
    finally:
        for session in sessions: session.close()

def prepare_seasons(args,env):
    query(args,env,f"""begin; select set_config('request.jwt.claim.sub','{ADMIN}',true);
      update ace.roles set role='admin' where user_id='{SECOND}';
      insert into ace.exam_seasons(id,code,name,exam_year) values ('{OTHER_SEASON}','approval-fixture-two','Synthetic second season',2028);
      insert into ace.exam_configs(id,season_id,name,duration_seconds,total_questions,option_count,version)
        values ('{THIRD}','{OTHER_SEASON}','Synthetic season configuration',600,4,4,1);
      insert into ace.exam_config_subjects(exam_config_id,subject_id,required,question_count)
        select '{THIRD}',subject_id,required,question_count from ace.exam_config_subjects where exam_config_id='{FIRST}';
      select ace.activate_exam_config('{THIRD}');
      insert into ace.syllabus_versions(season_id,subject_id,title,status,rights_status)
        select se.id,s.id,'Synthetic approved tree','active','approved' from ace.exam_seasons se cross join ace.subjects s;
      insert into ace.topics(subject_id,syllabus_version_id,name) select subject_id,id,'Synthetic topic' from ace.syllabus_versions;
      insert into ace.subtopics(topic_id,syllabus_version_id,name) select id,syllabus_version_id,'Synthetic subtopic' from ace.topics;
      commit;""")

def cleanup(args,env):
    # Only reached after the exact local fixture check and synthetic seeding.
    query(args,env,f"""begin; select set_config('request.jwt.claim.sub','{ADMIN}',true);
      update ace.exam_configs set active=false where id in ('{FIRST}','{OTHER}','{THIRD}');
      delete from ace.topics where syllabus_version_id in (select id from ace.syllabus_versions where season_id in ('{SEASON}','{OTHER_SEASON}'));
      delete from ace.syllabus_versions where season_id in ('{SEASON}','{OTHER_SEASON}');
      delete from ace.exam_configs where id in ('{FIRST}','{OTHER}','{THIRD}');
      delete from ace.exam_seasons where id in ('{SEASON}','{OTHER_SEASON}');
      delete from ace.subjects where id in ('84000000-0000-4000-8000-000000000001','84000000-0000-4000-8000-000000000002','84000000-0000-4000-8000-000000000003','84000000-0000-4000-8000-000000000004');
      delete from ace.audit_events where actor_user_id in ('{ADMIN}','{SECOND}','86000000-0000-4000-8000-000000000003');
      delete from auth.users where id in ('{ADMIN}','{SECOND}','86000000-0000-4000-8000-000000000003');
      commit;""")

def main():
    args,env=connection();seed(args,env)
    race(args,env,'READ COMMITTED','config')
    race(args,env,'REPEATABLE READ','config')
    race(args,env,'READ COMMITTED','edit')
    prepare_seasons(args,env)
    race(args,env,'READ COMMITTED','season')
    race(args,env,'REPEATABLE READ','season')
    cleanup(args,env)

if __name__=='__main__':
    try: main()
    except (RuntimeError,TimeoutError,OSError,subprocess.SubprocessError) as error:
        print('FAIL configuration approval concurrency: '+str(error),file=sys.stderr);sys.exit(1)
