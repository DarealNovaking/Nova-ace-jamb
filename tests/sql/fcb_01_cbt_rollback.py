"""Verify coordinated source/metadata rollback on an empty local recovery only."""
import json
from pathlib import Path
import subprocess
import sys
from fcb_01_role_concurrency import connection, query


def main():
    args, env = connection()
    shape = query(args, env, """select case when
      (select array_agg(column_name::text order by ordinal_position) from information_schema.columns
       where table_schema='auth' and table_name='users')=array['id','email','raw_user_meta_data']::text[]
      and (select count(*) from auth.users)=0 and (select count(*) from ace.attempts)=0
      and (select count(*) from pg_tables where schemaname='ace')=51
      then 'empty-recovered-fixture' else 'refuse' end;""")
    if shape!='empty-recovered-fixture':
        raise RuntimeError('Refusing nonempty/non-synthetic rollback fixture')
    catalog = Path('tests/sql/fcb_01_schema_catalog.sql').read_text()
    before = json.loads(query(args, env, catalog))
    rollback = Path('docs/rollback/fcb-01-cbt-resource-before.sql').read_text()
    # Root-only synthetic insert, not a public factory; no production fixtures.
    # Run fixture + attempted rollback in one session; its failure rolls back.
    fixture = """begin;
      insert into auth.users(id,email,raw_user_meta_data) values('99300000-0000-4000-8000-000000000001','rollback@example.invalid','{}');
      insert into ace.attempts(user_id,mode,duration_seconds,question_snapshot)
      values('99300000-0000-4000-8000-000000000001','practice',600,'[{}]');"""
    try:
        query(args, env, fixture+rollback)
    except RuntimeError as error:
        if '23514' not in str(error) or 'captured papers' not in str(error):
            raise
    else:
        raise RuntimeError('Rollback silently discarded a captured paper')
    if query(args, env, 'select count(*) from auth.users;')!='0':
        raise RuntimeError('Rollback guard fixture leaked an account')
    query(args, env, rollback)
    # Verify the six-fix baseline is restored, then upgrade it back to current.
    restored = query(args, env, """select
      (select count(*) from pg_tables where schemaname='ace')||':'||
      (select count(*) from pg_proc where pronamespace='ace'::regnamespace)||':'||
      (select bool_and(not prosecdef) from pg_proc where pronamespace='ace'::regnamespace
        and proname in ('start_attempt','resume_attempt','save_attempt_answer','submit_attempt'));""")
    if restored!='48:32:true':
        raise RuntimeError('Rollback did not restore original fail-closed RPCs: '+restored)
    paths = [line.split(maxsplit=1)[1] for line in Path('tests/sql/fixtures/fcb_01_cbt_contract.sql').read_text().splitlines()
             if line.startswith('\\i ')]
    paths += ['supabase/migrations/20261028043630_fcb_01_attempt_question_delivery.sql',
              'supabase/migrations/20261028043747_fcb_01_mock_contract.sql']
    for path in paths:
        query(args, env, Path(path).read_text())
    after = json.loads(query(args, env, catalog))
    if before!=after:
        raise RuntimeError('Rollback catalog/ACL mismatch: '+','.join(k for k in before if before[k]!=after.get(k)))
    print('PASS coordinated CBT rollback/upgrade: original RPCs restored, current catalog exact; captured papers refused')


if __name__ == '__main__':
    try:
        main()
    except (RuntimeError, OSError, subprocess.SubprocessError) as error:
        print('FAIL CBT rollback: '+str(error), file=sys.stderr)
        sys.exit(1)
