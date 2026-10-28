-- Applied with explicit owner authorization on 28 October 2026.
-- Exact reviewed coordinated CBT bundle, applied in safe stages.
begin;
-- Reviewed coordinated CBT runtime stage, now applied to production.
-- Authenticated owner operations replace unsafe direct API table mutation.
-- Private immutable question versions are captured at start.
-- No runtime/access policy is seeded here: business limits require explicit review.


create table if not exists ace.cbt_runtime_policy (
 singleton boolean primary key default true check(singleton),
 enabled boolean not null default false,
 window_seconds integer not null check(window_seconds between 1 and 86400),
 max_starts integer not null check(max_starts between 1 and 100000),
 max_active integer not null check(max_active between 1 and 1000),
 cooldown_seconds integer not null check(cooldown_seconds between 0 and 86400)
);
create table if not exists ace.cbt_mode_access (
 mode text primary key check(mode in ('practice','cbt','mock','learning','revision','ai_practice')),
 enabled boolean not null default false,
 entitlement_product_code text references ace.products(code),
 max_questions integer not null check(max_questions between 1 and 500),
 max_duration_seconds integer not null check(max_duration_seconds between 60 and 86400)
);
create table if not exists ace.cbt_start_usage (
 user_id uuid primary key references auth.users(id) on delete cascade,
 window_started_at timestamptz,
 starts integer not null default 0 check(starts>=0),
 last_start_at timestamptz
);
alter table ace.cbt_runtime_policy enable row level security;
alter table ace.cbt_mode_access enable row level security;
alter table ace.cbt_start_usage enable row level security;
revoke all on ace.cbt_runtime_policy,ace.cbt_mode_access,ace.cbt_start_usage from public,anon,authenticated;

create or replace function ace.audit_cbt_policy() returns trigger
language plpgsql security definer set search_path=pg_catalog,ace as $$
begin
 insert into ace.audit_events(actor_user_id,event_type,entity_type,metadata)
 values(auth.uid(),'cbt_policy_changed',tg_table_name,jsonb_build_object('operation',tg_op,
  'before',case when tg_op<>'INSERT' then to_jsonb(old) else null end,
  'after',case when tg_op<>'DELETE' then to_jsonb(new) else null end));
 if tg_op='DELETE' then return old; end if;
 return new;
end;
$$;
revoke all on function ace.audit_cbt_policy() from public,anon,authenticated;
drop trigger if exists audit_cbt_policy on ace.cbt_runtime_policy;
create trigger audit_cbt_policy after insert or update or delete on ace.cbt_runtime_policy
for each row execute function ace.audit_cbt_policy();
drop trigger if exists audit_cbt_policy on ace.cbt_mode_access;
create trigger audit_cbt_policy after insert or update or delete on ace.cbt_mode_access
for each row execute function ace.audit_cbt_policy();

create or replace function ace.reserve_cbt_start(p_mode text,p_count integer,p_duration integer)
returns void language plpgsql security definer set search_path=pg_catalog,ace as $$
declare policy ace.cbt_runtime_policy%rowtype; access ace.cbt_mode_access%rowtype;
 gate ace.cbt_start_usage%rowtype; v_user uuid:=auth.uid(); v_now timestamptz; v_entitlements uuid[];
begin
 if v_user is null then raise exception 'Authentication required' using errcode='28000'; end if;
 select * into policy from ace.cbt_runtime_policy where singleton and enabled for share;
 if not found then raise exception 'CBT runtime policy unavailable' using errcode='42501'; end if;
 select * into access from ace.cbt_mode_access where mode=p_mode and enabled for share;
 if not found then raise exception 'Attempt mode unavailable' using errcode='42501'; end if;
 if p_count is null or p_duration is null or p_count<1 or p_count>access.max_questions
    or p_duration<60 or p_duration>access.max_duration_seconds then
  raise exception 'Attempt exceeds configured bounds' using errcode='22023';
 end if;
 -- One row per user across ALL modes: switching modes cannot evade limits.
 -- An actual UPDATE also invalidates a stale REPEATABLE READ snapshot.
 insert into ace.cbt_start_usage(user_id) values(v_user)
 on conflict(user_id) do update set user_id=excluded.user_id returning * into gate;
 if access.entitlement_product_code is not null then
  select array_agg(id) into v_entitlements from (
   select e.id from ace.entitlements e join ace.products p on p.id=e.product_id
    where e.user_id=v_user and p.code=access.entitlement_product_code and e.status='active'
    order by e.id for share of e,p
  ) locked;
 end if;
 -- Neither user-row contention nor an entitlement lock may freeze the clock.
 v_now:=clock_timestamp();
 if access.entitlement_product_code is not null and not exists(
  select 1 from ace.entitlements where id=any(v_entitlements) and starts_at<=v_now and ends_at>v_now) then
  raise exception 'Active access required' using errcode='42501';
 end if;
 if gate.last_start_at is not null and gate.last_start_at+policy.cooldown_seconds*interval '1 second'>v_now then
  raise exception 'Attempt start cooldown' using errcode='P0001';
 end if;
 if gate.window_started_at is null or gate.window_started_at+policy.window_seconds*interval '1 second'<=v_now then
  gate.window_started_at:=v_now; gate.starts:=0;
 end if;
 if gate.starts>=policy.max_starts then raise exception 'Attempt start limit reached' using errcode='P0001'; end if;
 if (select count(*) from ace.attempts where user_id=v_user and status='active'
   and (duration_seconds is null or started_at+duration_seconds*interval '1 second'>v_now))>=policy.max_active then
  raise exception 'Active attempt limit reached' using errcode='P0001';
 end if;
 update ace.cbt_start_usage set window_started_at=gate.window_started_at,
  starts=gate.starts+1,last_start_at=v_now where user_id=v_user;
end;
$$;
revoke all on function ace.reserve_cbt_start(text,integer,integer) from public,anon,authenticated;

alter table ace.attempts add column if not exists question_snapshot jsonb not null default '[]'::jsonb;
create index if not exists idx_attempts_active_user on ace.attempts(user_id,started_at) where status='active';
create or replace function ace.guard_attempt_snapshot() returns trigger
language plpgsql set search_path=pg_catalog,ace as $$
begin
 if new.question_snapshot is distinct from old.question_snapshot
    or new.question_order is distinct from old.question_order
    or new.option_order is distinct from old.option_order then
  raise exception 'Attempt paper is immutable' using errcode='23514';
 end if;
 return new;
end;
$$;
revoke all on function ace.guard_attempt_snapshot() from public,anon,authenticated;
drop trigger if exists guard_attempt_snapshot on ace.attempts;
create trigger guard_attempt_snapshot before update of question_snapshot,question_order,option_order
on ace.attempts for each row execute function ace.guard_attempt_snapshot();


commit;
