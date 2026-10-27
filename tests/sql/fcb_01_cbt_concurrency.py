"""Disposable recovered-schema CBT races; never run against an external database."""
from pathlib import Path
import re
import subprocess
import sys
import time
from threading import Event
from fcb_01_role_concurrency import Session, connection, query

USER = '31000000-0000-4000-8000-000000000001'
QUESTION = '11000000-0000-4000-8000-000000000001'

def fixture(args, env):
    shape = query(args, env, """select case when
      (select array_agg(column_name::text order by ordinal_position) from information_schema.columns
       where table_schema='auth' and table_name='users')=array['id','email','raw_user_meta_data']::text[]
      and (select count(*) from auth.users)=0 and (select count(*) from ace.questions)=0
      and (select count(*) from pg_tables where schemaname='ace')=48
      then 'synthetic-recovered-fixture' else 'refused' end;""")
    if shape != 'synthetic-recovered-fixture':
        raise RuntimeError('Refusing database: exact empty synthetic auth/recovered schema required')
    sql = Path('tests/sql/fcb_01_cbt_mutations.test.sql').read_text()
    seed = sql[sql.index('begin;'):sql.index('set local role authenticated;')]
    query(args, env, seed + '\ncommit;')

def as_user(sql):
    return f"set local role authenticated; select set_config('request.jwt.claim.sub','{USER}',true); {sql}"

def run_case(args, env, isolation, action):
    previous = int(query(args, env, f"select coalesce(sum(attempts),0) from ace.student_question_stats where user_id='{USER}';"))
    attempt = query(args, env, 'begin;'+as_user(f"select ace.start_attempt('practice',null,1,600,null)->>'attempt_id';")+'commit;').splitlines()[-1]
    if not re.fullmatch(r'[0-9a-f-]{36}', attempt):
        raise RuntimeError('Missing synthetic attempt ID')
    query(args, env, 'begin;'+as_user(f"select ace.save_attempt_answer('{attempt}','{QUESTION}','A',1);")+'commit;')
    sessions = []
    try:
        a, b = Session(args, env, 'cbt_a'), Session(args, env, 'cbt_b')
        sessions.extend([a,b])
        a.send('begin;'+as_user("select 'A_READY';")+'\n\\echo A_READY\n')
        a.until('A_READY')
        b.send(f'begin isolation level {isolation};'+as_user(f"select ace.resume_attempt('{attempt}')->>'status';")+'\n\\echo B_SNAPSHOT\n')
        b.until('B_SNAPSHOT')
        a.send(f"select ace.submit_attempt('{attempt}');\n\\echo A_SCORED\n")
        a.until('A_SCORED')
        operation = f"ace.submit_attempt('{attempt}')" if action == 'submit' else f"ace.save_attempt_answer('{attempt}','{QUESTION}','B',2)"
        b.send(f"set local statement_timeout='15s'; select {operation}; commit;\n\\echo B_FINISHED\n")
        deadline, poll = time.monotonic()+10, Event()
        while query(args, env, f'select {a.backend_pid}=any(pg_blocking_pids({b.backend_pid}));') != 't':
            if b.process.poll() is not None or time.monotonic() >= deadline:
                raise RuntimeError('Competing mutation did not wait for the attempt lock')
            poll.wait(0.05)
        a.send('commit;\n\\echo A_COMMITTED\n');a.until('A_COMMITTED')
        if a.finish() != 0:
            raise RuntimeError('First submission failed: '+a.output)
        second_status = b.finish()
        if isolation == 'REPEATABLE READ':
            if second_status == 0 or '40001' not in b.output:
                raise RuntimeError('Stale submission did not fail with serialization error: '+b.output)
            # A retried request must return the stored result without crediting again.
            query(args, env, 'begin;'+as_user(f"select ace.submit_attempt('{attempt}');")+'commit;')
        elif action == 'save':
            if second_status == 0 or '22023' not in b.output:
                raise RuntimeError('Save after submission was not rejected: '+b.output)
        elif second_status != 0:
            raise RuntimeError('Concurrent replay did not return stored result: '+b.output)
        result = query(args, env, f"select status||':'||score::integer||':'||correct_count from ace.attempts where id='{attempt}';")
        stats = int(query(args, env, f"select sum(attempts) from ace.student_question_stats where user_id='{USER}';"))
        answer = query(args, env, f"select selected_option_key from ace.attempt_answers where attempt_id='{attempt}';")
        if result != 'completed:100:1' or stats != previous+1 or answer != 'A':
            raise RuntimeError(f'Non-atomic scoring/statistics/answer result: {result}/{stats}/{answer}')
        print(f'PASS CBT {isolation} {action}: one score/statistics credit; terminal answers preserved')
    finally:
        for session in sessions:
            session.close()

def main():
    args, env = connection()
    fixture(args, env)
    run_case(args, env, 'READ COMMITTED', 'submit')
    run_case(args, env, 'REPEATABLE READ', 'submit')
    run_case(args, env, 'READ COMMITTED', 'save')

if __name__ == '__main__':
    try:
        main()
    except (RuntimeError, TimeoutError, OSError, subprocess.SubprocessError) as error:
        print('FAIL CBT concurrency: '+str(error),file=sys.stderr)
        sys.exit(1)
