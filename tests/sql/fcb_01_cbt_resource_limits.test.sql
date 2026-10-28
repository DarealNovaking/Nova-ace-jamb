-- Disposable recovered schema only. Numeric policies below are synthetic tests,
-- never launch limits or production defaults.
\i supabase/proposals/fcb_01_cbt_mutation_contract.sql
\i tests/sql/fixtures/fcb_01_cbt_content.sql
delete from ace.cbt_runtime_policy;
set local role authenticated;
do $$ begin
 begin
  perform ace.start_attempt('practice',null,1,600,null);
  perform ace.start_attempt('practice',null,1,600,null);
  raise exception 'unconfigured unlimited attempt starts accepted';
 exception when sqlstate '42501' then null;
 end;
end $$;
reset role;
\i tests/sql/fixtures/fcb_01_cbt_policy.sql
-- Policy tables/counters and internal factory cannot become a client bypass.
do $$ declare t text; f text; begin
 foreach t in array array['cbt_runtime_policy','cbt_mode_access','cbt_start_usage'] loop
  if has_table_privilege('authenticated','ace.'||t,'SELECT')
   or has_table_privilege('authenticated','ace.'||t,'INSERT')
   or has_table_privilege('authenticated','ace.'||t,'UPDATE')
   or has_table_privilege('anon','ace.'||t,'SELECT') then raise exception 'resource tables exposed'; end if;
  if not (select relrowsecurity from pg_class where oid=('ace.'||t)::regclass) then raise exception 'resource RLS missing'; end if;
 end loop;
 foreach f in array array['ace.reserve_cbt_start(text,integer,integer)',
  'ace.create_attempt_internal(text,uuid,integer,integer,uuid[],boolean)','ace.audit_cbt_policy()'] loop
  if has_function_privilege('authenticated',f,'EXECUTE') or has_function_privilege('anon',f,'EXECUTE') then raise exception 'private factory/gate exposed'; end if;
 end loop;
end $$;
update ace.cbt_mode_access set max_questions=1,max_duration_seconds=600 where mode='practice';
set local role authenticated;
do $$ begin
 begin perform ace.start_attempt('practice',null,2,600,null); raise exception 'count limit bypass' using errcode='Z0001'; exception when sqlstate '22023' then null; end;
 begin perform ace.start_attempt('practice',null,1,601,null); raise exception 'duration limit bypass' using errcode='Z0001'; exception when sqlstate '22023' then null; end;
end $$;
reset role;
update ace.cbt_mode_access set enabled=false where mode='practice';
set local role authenticated;
do $$ begin
 begin perform ace.start_attempt('practice',null,1,600,null); raise exception 'disabled mode bypass' using errcode='Z0001'; exception when sqlstate '42501' then null; end;
end $$;
reset role;
update ace.cbt_mode_access set enabled=true where mode='practice';
update ace.cbt_runtime_policy set enabled=false;
set local role authenticated;
do $$ begin
 begin perform ace.start_attempt('practice',null,1,600,null); raise exception 'disabled runtime bypass' using errcode='Z0001'; exception when sqlstate '42501' then null; end;
end $$;
reset role;
update ace.cbt_runtime_policy set enabled=true,max_starts=2;
set local role authenticated;
select ace.start_attempt('practice',null,1,600,null);
select ace.start_attempt('revision',null,1,600,null);
do $$ begin
 begin perform ace.start_attempt('cbt',null,1,600,null); raise exception 'cross-mode quota bypass' using errcode='Z0001'; exception when sqlstate 'P0001' then null; end;
end $$;
reset role;
do $$ begin
 if (select starts from ace.cbt_start_usage where user_id='31000000-0000-4000-8000-000000000001')<>2
  or (select count(*) from ace.attempts)<>2 then raise exception 'rejected start changed quota or left attempt'; end if;
end $$;
-- Active slots, rather than lifetime attempt count; expiry releases a slot.
update ace.cbt_runtime_policy set max_starts=100,max_active=2;
set local role authenticated;
do $$ begin
 begin perform ace.start_attempt('practice',null,1,600,null); raise exception 'active limit bypass' using errcode='Z0001'; exception when sqlstate 'P0001' then null; end;
end $$;
reset role;
update ace.attempts set started_at=clock_timestamp()-interval '1 hour';
set local role authenticated;
select ace.start_attempt('practice',null,1,600,null);
reset role;
-- Counter rollover and global cooldown use server time after the serialization lock.
update ace.cbt_runtime_policy set max_starts=2,max_active=100,cooldown_seconds=60;
update ace.cbt_start_usage set starts=2,window_started_at=clock_timestamp()-interval '2 hours',last_start_at=clock_timestamp()-interval '2 hours';
set local role authenticated;
select ace.start_attempt('practice',null,1,600,null);
do $$ begin
 begin perform ace.start_attempt('revision',null,1,600,null); raise exception 'cooldown bypass' using errcode='Z0001'; exception when sqlstate 'P0001' then null; end;
end $$;
reset role;
do $$ begin
 if (select starts from ace.cbt_start_usage where user_id='31000000-0000-4000-8000-000000000001')<>1 then raise exception 'window did not reset once'; end if;
end $$;
update ace.cbt_start_usage set last_start_at=clock_timestamp()-interval '61 seconds';
set local role authenticated;
select ace.start_attempt('revision',null,1,600,null);
reset role;
update ace.cbt_runtime_policy set max_starts=100,cooldown_seconds=0;
-- Empty/withdrawn-bank failures must not consume starts or leave attempt rows.
update ace.questions set rights_status='unknown';
set local role authenticated;
do $$ begin
 begin perform ace.start_attempt('practice',null,1,600,null); raise exception 'withdrawn bank accepted' using errcode='Z0001'; exception when sqlstate 'P0001' then null; end;
end $$;
reset role;
do $$ begin
 if (select starts from ace.cbt_start_usage where user_id='31000000-0000-4000-8000-000000000001')<>2 then raise exception 'failed bank consumed quota'; end if;
end $$;
update ace.questions set rights_status='owned';
-- Entitlements are checked for the current caller, including expiry and revocation.
insert into ace.products(id,code,name,price_minor) values('99000000-0000-4000-8000-000000000001','synthetic_pass','Synthetic test access',0);
update ace.cbt_mode_access set entitlement_product_code='synthetic_pass' where mode='practice';
insert into ace.entitlements(user_id,product_id,source,starts_at,ends_at)
values('32000000-0000-4000-8000-000000000002','99000000-0000-4000-8000-000000000001','admin',clock_timestamp()-interval '1 minute',clock_timestamp()+interval '1 hour');
set local role authenticated;
do $$ begin
 begin perform ace.start_attempt('practice',null,1,600,null); raise exception 'another user entitlement accepted' using errcode='Z0001'; exception when sqlstate '42501' then null; end;
end $$;
reset role;
insert into ace.entitlements(user_id,product_id,source,starts_at,ends_at,status)
values('31000000-0000-4000-8000-000000000001','99000000-0000-4000-8000-000000000001','admin',clock_timestamp()-interval '1 hour',clock_timestamp()-interval '1 second','active');
set local role authenticated;
do $$ begin
 begin perform ace.start_attempt('practice',null,1,600,null); raise exception 'expired access accepted' using errcode='Z0001'; exception when sqlstate '42501' then null; end;
end $$;
reset role;
update ace.entitlements set ends_at=clock_timestamp()+interval '1 hour',status='revoked' where user_id='31000000-0000-4000-8000-000000000001';
set local role authenticated;
do $$ begin
 begin perform ace.start_attempt('practice',null,1,600,null); raise exception 'revoked access accepted' using errcode='Z0001'; exception when sqlstate '42501' then null; end;
end $$;
reset role;
update ace.entitlements set status='active' where user_id='31000000-0000-4000-8000-000000000001';
set local role authenticated;
select ace.start_attempt('practice',null,1,600,null);
reset role;
-- Editors/admins do not bypass access merely because they can author content.
update ace.roles set role='admin' where user_id='31000000-0000-4000-8000-000000000001';
update ace.entitlements set status='revoked' where user_id='31000000-0000-4000-8000-000000000001';
set local role authenticated;
do $$ begin
 begin perform ace.start_attempt('practice',null,1,600,null); raise exception 'admin access bypass' using errcode='Z0001'; exception when sqlstate '42501' then null; end;
end $$;
reset role;
do $$ begin
 if not exists(select 1 from ace.audit_events where event_type='cbt_policy_changed'
  and metadata->>'operation'='UPDATE' and metadata ? 'before' and metadata ? 'after') then raise exception 'policy changes unaudited'; end if;
end $$;
rollback;
select 'FCB-01 CBT resource policy tests passed' result;
