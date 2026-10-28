"""Run last, after CBT races, on the exact local synthetic recovered fixture."""
import subprocess
import sys
import time
from threading import Event
from fcb_01_role_concurrency import Session, connection, query
from fcb_01_cbt_concurrency import USER, QUESTION, as_user


def require_fixture(args, env):
    shape = query(args, env, f"""select case when
      (select array_agg(column_name::text order by ordinal_position) from information_schema.columns
       where table_schema='auth' and table_name='users')=array['id','email','raw_user_meta_data']::text[]
      and (select array_agg(id::text order by id) from auth.users)=array[
       '{USER}','32000000-0000-4000-8000-000000000002']::text[]
      and (select array_agg(id::text) from ace.questions)=array['{QUESTION}']::text[]
      and (select count(*) from pg_tables where schemaname='ace')=51
      and to_regclass('ace.cbt_start_usage') is not null
      then 'synthetic-resource-fixture' else 'refuse' end;""")
    if shape != 'synthetic-resource-fixture':
        raise RuntimeError('Refusing non-local/non-synthetic resource fixture')


def run_case(args, env, isolation, limit, existing=False):
    # Synthetic-only state; no production defaults are asserted by these values.
    settings = {'starts': (1, 100, 0), 'active': (100, 1, 0), 'cooldown': (100, 100, 60)}
    starts, active, cooldown = settings[limit]
    query(args, env, f"""delete from ace.cbt_start_usage where user_id='{USER}';
      update ace.cbt_runtime_policy set enabled=true,max_starts={starts},max_active={active},cooldown_seconds={cooldown};""")
    if existing:
        query(args, env, f"insert into ace.cbt_start_usage(user_id,window_started_at,starts) values('{USER}',clock_timestamp(),0);")
    previous = int(query(args, env, f"select count(*) from ace.attempts where user_id='{USER}';"))
    a = Session(args, env, 'quota_a')
    b = Session(args, env, 'quota_b')
    try:
        a.send('begin;'+as_user("select ace.start_attempt('practice',null,1,600,null);")+'\n\\echo RESERVED_A\n')
        a.until('RESERVED_A')
        b.send(f'begin isolation level {isolation};'+as_user('select ace.is_admin();')+'\n\\echo SNAPSHOT_B\n')
        b.until('SNAPSHOT_B')
        # A different mode still shares the same user start/cooldown/active boundary.
        b.send("set local statement_timeout='15s'; select ace.start_attempt('revision',null,1,600,null); commit;\n\\echo FINISHED_B\n")
        deadline, poll = time.monotonic()+10, Event()
        while query(args, env, f'select {a.backend_pid}=any(pg_blocking_pids({b.backend_pid}));') != 't':
            if b.process.poll() is not None or time.monotonic()>=deadline:
                raise RuntimeError('Second start did not wait for user reservation')
            poll.wait(0.05)
        a.send('commit;\n')
        if a.finish()!=0:
            raise RuntimeError('First reservation failed: '+a.output)
        status = b.finish()
        expected = '40001' if isolation=='REPEATABLE READ' else 'P0001'
        if status==0 or expected not in b.output:
            raise RuntimeError('Competing start exceeded policy: '+b.output)
        if isolation=='REPEATABLE READ':
            # Retrying a stale transaction must recheck the limit, not bypass it.
            query(args, env, 'begin;'+as_user("""do $$ begin
              begin perform ace.start_attempt('revision',null,1,600,null);
                raise exception 'retry bypassed policy' using errcode='Z0001';
              exception when sqlstate 'P0001' then null; end;
              end $$;""")+'commit;')
        observed = query(args, env, f"""select
          (select count(*) from ace.attempts where user_id='{USER}')||':'||
          (select starts from ace.cbt_start_usage where user_id='{USER}');""")
        if observed != f'{previous+1}:1':
            raise RuntimeError('Quota/attempt overshoot: '+observed)
        print(f'PASS resource {limit} {isolation} existing={existing}: one start, no cross-mode overshoot')
    finally:
        a.close()
        b.close()
        query(args, env, f"delete from ace.attempts where user_id='{USER}' and status='active';")


def entitlement_expiry(args, env):
    product = '99200000-0000-4000-8000-000000000001'
    entitlement = '99200000-0000-4000-8000-000000000002'
    query(args, env, f"""delete from ace.cbt_start_usage where user_id='{USER}';
      update ace.cbt_runtime_policy set max_starts=100,max_active=100,cooldown_seconds=0;
      insert into ace.products(id,code,name,price_minor) values('{product}','synthetic_race_pass','Synthetic lock-expiry access',0);
      update ace.cbt_mode_access set entitlement_product_code='synthetic_race_pass' where mode='practice';
      insert into ace.entitlements(id,user_id,product_id,source,starts_at,ends_at)
      values('{entitlement}','{USER}','{product}','admin',clock_timestamp()-interval '1 minute',clock_timestamp()+interval '2 seconds');""")
    previous = query(args, env, f"select count(*) from ace.attempts where user_id='{USER}';")
    a = Session(args, env, 'entitlement_lock')
    b = Session(args, env, 'entitlement_start')
    try:
        a.send(f"begin; update ace.entitlements set metadata='{{\"synthetic_lock\":true}}' where id='{entitlement}';\n\\echo ENTITLEMENT_LOCKED\n")
        a.until('ENTITLEMENT_LOCKED')
        b.send('begin;'+as_user("set local statement_timeout='10s'; select ace.start_attempt('practice',null,1,600,null);")+'commit;\n')
        deadline, poll = time.monotonic()+8, Event()
        while query(args, env, f'select {a.backend_pid}=any(pg_blocking_pids({b.backend_pid}));') != 't':
            if b.process.poll() is not None or time.monotonic()>=deadline:
                raise RuntimeError('Start did not wait for entitlement lock')
            poll.wait(0.05)
        while query(args, env, f"select clock_timestamp()>ends_at from ace.entitlements where id='{entitlement}';")!='t':
            if time.monotonic()>=deadline:
                raise RuntimeError('Synthetic entitlement expiry timed out')
            poll.wait(0.05)
        a.send('commit;\n')
        if a.finish()!=0:
            raise RuntimeError('Entitlement lock commit failed: '+a.output)
        if b.finish()==0 or '42501' not in b.output:
            raise RuntimeError('Expired entitlement authorized after lock wait: '+b.output)
        after = query(args, env, f"select count(*) from ace.attempts where user_id='{USER}';")
        usage = query(args, env, f"select count(*) from ace.cbt_start_usage where user_id='{USER}';")
        if after!=previous or usage!='0':
            raise RuntimeError('Expired access left attempt or reservation')
        print('PASS resource entitlement expiry during lock: denied using fresh server time')
    finally:
        a.close()
        b.close()
        query(args, env, f"""update ace.cbt_mode_access set entitlement_product_code=null where mode='practice';
          delete from ace.entitlements where id='{entitlement}'; delete from ace.products where id='{product}';""")


def main():
    args, env = connection()
    require_fixture(args, env)
    for limit in ('starts', 'active'):
        for isolation in ('READ COMMITTED', 'REPEATABLE READ'):
            run_case(args, env, isolation, limit)
    run_case(args, env, 'READ COMMITTED', 'cooldown')
    for isolation in ('READ COMMITTED', 'REPEATABLE READ'):
        run_case(args, env, isolation, 'starts', existing=True)
    entitlement_expiry(args, env)


if __name__ == '__main__':
    try:
        main()
    except (RuntimeError, TimeoutError, OSError, subprocess.SubprocessError) as error:
        print('FAIL CBT resource concurrency: '+str(error), file=sys.stderr)
        sys.exit(1)
