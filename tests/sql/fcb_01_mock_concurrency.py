"""Local synthetic-only mock start versus configuration approval regression."""
from pathlib import Path
import re
import subprocess
import sys
import time
from threading import Event
from fcb_01_role_concurrency import Session, connection, query
from fcb_01_exam_config_concurrency import ADMIN, FIRST, OTHER, cleanup

STUDENT = '86000000-0000-4000-8000-000000000003'


def expand(path):
    return re.sub(r'^\\i\s+(.+)$', lambda m: expand(m[1].strip()), Path(path).read_text(), flags=re.M)


def seed(args, env):
    shape = query(args, env, """select case when
      (select array_agg(column_name::text order by ordinal_position) from information_schema.columns
       where table_schema='auth' and table_name='users')=array['id','email','raw_user_meta_data']::text[]
      and (select count(*) from auth.users)=0 and (select count(*) from ace.questions)=0
      and (select count(*) from ace.exam_seasons)=0 and (select count(*) from pg_tables where schemaname='ace')=48
      then 'synthetic-approved' else 'refuse' end;""")
    if shape != 'synthetic-approved':
        raise RuntimeError('Refusing nonempty/non-synthetic database')
    query(args, env, expand('tests/sql/fixtures/fcb_01_mock_content.sql') + 'commit;')


def race(args, env, isolation):
    query(args, env, f"begin; select set_config('request.jwt.claim.sub','{ADMIN}',true); select ace.activate_exam_config('{FIRST}'); commit;")
    a = Session(args, env, 'mock_start')
    b = Session(args, env, 'mock_approval')
    try:
        a.send(f"begin isolation level {isolation}; set local role authenticated; select set_config('request.jwt.claim.sub','{STUDENT}',true);\n"
               f"select ace.start_mock_attempt('{FIRST}',array(select subject_id from ace.exam_config_subjects where exam_config_id='{FIRST}'));\n\\echo MOCK_READY\n")
        a.until('MOCK_READY')
        b.send(f"begin; set local statement_timeout='15s'; set local role authenticated; select set_config('request.jwt.claim.sub','{ADMIN}',true); "
               f"select ace.activate_exam_config('{OTHER}'); commit;\n\\echo APPROVED\n")
        deadline, poll = time.monotonic()+10, Event()
        while query(args, env, f'select {a.backend_pid}=any(pg_blocking_pids({b.backend_pid}));') != 't':
            if b.process.poll() is not None or time.monotonic() >= deadline:
                raise RuntimeError('Approval did not wait for mock paper capture')
            poll.wait(0.05)
        a.send('commit;\n')
        if a.finish() != 0:
            raise RuntimeError('Mock creation failed: '+a.output)
        if b.finish() != 0:
            raise RuntimeError('Approval failed: '+b.output)
        state = query(args, env, f"""select count(*)||':'||min(duration_seconds)||':'||min(exam_config_snapshot->>'version')
            from ace.attempts where user_id='{STUDENT}' and exam_config_id='{FIRST}' and mode='mock';""")
        if state != '1:600:1':
            raise RuntimeError('Mixed/wrong approved paper: '+state)
        active = query(args, env, f"select id from ace.exam_configs where active;")
        if active != OTHER:
            raise RuntimeError('Approval did not become current after capture')
        query(args, env, f"delete from ace.attempts where user_id='{STUDENT}';")
        print(f'PASS mock {isolation}: approval waits; original paper/config retained')
    finally:
        a.close()
        b.close()


def main():
    args, env = connection()
    seed(args, env)
    try:
        race(args, env, 'READ COMMITTED')
        race(args, env, 'REPEATABLE READ')
    finally:
        query(args, env, f"delete from ace.attempts where user_id='{STUDENT}'; delete from ace.questions where subject_id in(select subject_id from ace.exam_config_subjects where exam_config_id='{FIRST}');")
        cleanup(args, env)


if __name__ == '__main__':
    try:
        main()
    except (RuntimeError, TimeoutError, OSError, subprocess.SubprocessError) as error:
        print('FAIL mock approval concurrency: '+str(error), file=sys.stderr)
        sys.exit(1)
