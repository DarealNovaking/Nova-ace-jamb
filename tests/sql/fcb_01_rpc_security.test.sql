-- Disposable database only. Never run this fixture against production.
drop schema if exists ace cascade;
drop schema if exists auth cascade;
create schema ace;
create schema auth;
do $$ begin create role anon; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated; exception when duplicate_object then null; end $$;
create function auth.uid() returns uuid language sql stable as $$
 select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
$$;
create table auth.users(id uuid primary key);
create table ace.roles(user_id uuid primary key, role text not null);
create table ace.products(id uuid primary key, code text);
create table ace.entitlements(user_id uuid,product_id uuid,status text,starts_at timestamptz,ends_at timestamptz);
create table ace.catalog_sources(id uuid primary key,title text,status text,source_type text);
create table ace.catalog_import_batches(id uuid primary key,status text,row_count integer,snapshot_hash text);
create table ace.institutions(id uuid primary key,name text,state text,institution_type text,status text);
create table ace.audit_events(actor_user_id uuid,event_type text,entity_type text,entity_id uuid,metadata jsonb);
create table ace.subjects(id uuid primary key,code text,active boolean,sort_order integer);
create table ace.student_subjects(user_id uuid,subject_id uuid,is_primary boolean,sort_order integer, primary key(user_id,subject_id));
create table ace.profiles(id uuid primary key,display_name text,target_score smallint,institution text,course text);
create table ace.student_preferences(user_id uuid primary key,daily_minutes integer,updated_at timestamptz default now());
create table ace.exam_configs(id uuid primary key,duration_seconds integer,total_questions integer,option_count integer);
create table ace.exam_config_subjects(exam_config_id uuid,required boolean,question_count integer);
alter table ace.catalog_sources enable row level security;
alter table ace.catalog_import_batches enable row level security;
create table ace.catalog_import_rows(id uuid primary key,validation_status text);
alter table ace.catalog_import_rows enable row level security;
\i tests/sql/fixtures/fcb_01_live_rpc_baseline.sql
create policy catalog_sources_read_editor on ace.catalog_sources for select to authenticated using(ace.is_admin_or_editor());
create policy catalog_sources_manage_editor on ace.catalog_sources for all to authenticated using(ace.is_admin_or_editor()) with check(ace.is_admin_or_editor());
create policy catalog_batches_read_editor on ace.catalog_import_batches for select to authenticated using(ace.is_admin_or_editor());
create policy catalog_batches_manage_editor on ace.catalog_import_batches for all to authenticated using(ace.is_admin_or_editor()) with check(ace.is_admin_or_editor());
create policy catalog_rows_read_editor on ace.catalog_import_rows for select to authenticated using(ace.is_admin_or_editor());
create policy catalog_rows_manage_editor on ace.catalog_import_rows for all to authenticated using(ace.is_admin_or_editor()) with check(ace.is_admin_or_editor());
-- Match production RPC grants; no direct table privileges for either API role.
revoke execute on all functions in schema ace from public,anon;
grant execute on all functions in schema ace to authenticated;
grant usage on schema ace,auth to authenticated;
grant select,insert,update,delete on ace.catalog_sources,ace.catalog_import_batches,ace.catalog_import_rows to authenticated;
insert into auth.users values
 ('00000000-0000-4000-8000-000000000001'),
 ('00000000-0000-4000-8000-000000000002'),
 ('00000000-0000-4000-8000-000000000003'),
 ('00000000-0000-4000-8000-000000000004');
insert into ace.roles select id,case right(id::text,1) when '3' then 'editor' when '4' then 'admin' else 'student' end from auth.users;
insert into ace.profiles(id) select id from auth.users;
insert into ace.products values ('10000000-0000-4000-8000-000000000001','ace_pass');
insert into ace.entitlements values ('00000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','active',now()-interval '1 day',now()+interval '1 day');
insert into ace.catalog_sources values ('20000000-0000-4000-8000-000000000001','Private review','reviewed','official');
insert into ace.catalog_import_batches values ('30000000-0000-4000-8000-000000000001','staged',1,'private-hash');
insert into ace.institutions values ('40000000-0000-4000-8000-000000000001','Private draft','Ondo','university','draft');
insert into ace.catalog_import_rows values ('60000000-0000-4000-8000-000000000001','valid');
insert into ace.subjects select ('50000000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid,case when i=1 then 'ENG' else 'SUB'||i end,true,i from generate_series(1,5) i;

-- CI applies the remediation here. For RED reproduction, omit this include.
\i supabase/migrations/20261027151954_fcb_01_rpc_security_boundaries.sql

set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',false);
do $$ begin
 if ace.has_active_entitlement('00000000-0000-4000-8000-000000000002') then raise exception 'student can inspect another student entitlement'; end if;
 if ace.has_active_entitlement('00000000-0000-4000-8000-000000000001') then raise exception 'non-entitled student received access'; end if;
 if exists(select 1 from ace.get_catalog_institutions()) then raise exception 'student can enumerate draft institutions'; end if;
 if exists(select 1 from ace.get_catalog_source('20000000-0000-4000-8000-000000000001')) then raise exception 'student can read private source'; end if;
 if exists(select 1 from ace.check_catalog_import_idempotency('private-hash')) then raise exception 'student can read staged batch'; end if;
 begin
  perform ace.validate_exam_config('70000000-0000-4000-8000-000000000001');
  raise exception 'student can inspect draft exam validation';
 exception when insufficient_privilege then null; end;
 begin
  perform ace.set_user_role('00000000-0000-4000-8000-000000000001','admin');
  raise exception 'student escalated role';
 exception when insufficient_privilege then null; end;
 begin
  perform ace.set_student_subjects(array['50000000-0000-4000-8000-000000000002'::uuid]);
  raise exception 'legacy RPC accepted incomplete subject set';
 exception when invalid_parameter_value then null; end;
 begin
  perform ace.set_student_subjects(array['50000000-0000-4000-8000-000000000002'::uuid,'50000000-0000-4000-8000-000000000003','50000000-0000-4000-8000-000000000004','50000000-0000-4000-8000-000000000005']);
  raise exception 'legacy RPC allowed missing English';
 exception when invalid_parameter_value then null; end;
 begin
  perform ace.save_student_foundation('Student',250::smallint,'Goal','Course',60,
   array['50000000-0000-4000-8000-000000000002'::uuid,'50000000-0000-4000-8000-000000000003','50000000-0000-4000-8000-000000000004','50000000-0000-4000-8000-000000000005']);
  raise exception 'legacy profile save allowed missing English';
 exception when invalid_parameter_value then null; end;
 perform ace.set_student_subjects(array['50000000-0000-4000-8000-000000000004'::uuid,'50000000-0000-4000-8000-000000000003','50000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000001']);
 perform ace.save_student_foundation('Student',250::smallint,'Goal','Course',60,
   array['50000000-0000-4000-8000-000000000004'::uuid,'50000000-0000-4000-8000-000000000003','50000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000001']);
end $$;
reset role;
do $$ begin
 if (select count(*) from ace.student_subjects)<>4 then raise exception 'valid subject selection not saved'; end if;
 if not exists(select 1 from ace.student_subjects where subject_id='50000000-0000-4000-8000-000000000001' and is_primary and sort_order=0) then raise exception 'English must be primary and first'; end if;
 if has_function_privilege('anon','ace.has_active_entitlement(uuid,text)','execute') then raise exception 'anon can call entitlement RPC'; end if;
end $$;
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',false);
do $$ begin
 if not ace.has_active_entitlement(auth.uid()) then raise exception 'owner cannot read own entitlement'; end if;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',false);
do $$ declare v_count integer; begin
 if ace.has_active_entitlement('00000000-0000-4000-8000-000000000002') then raise exception 'editor can inspect another entitlement'; end if;
 if (select count(*) from ace.get_catalog_institutions())<>1 then raise exception 'authorized editor read regressed'; end if;
 if (ace.validate_exam_config('70000000-0000-4000-8000-000000000001')->>'valid')::boolean then raise exception 'missing configuration reported valid'; end if;
 update ace.catalog_sources set status='approved';
 get diagnostics v_count=row_count;
 if v_count<>0 then raise exception 'editor bypassed source approval'; end if;
 update ace.catalog_import_batches set status='approved';
 get diagnostics v_count=row_count;
 if v_count<>0 then raise exception 'editor bypassed batch approval'; end if;
 update ace.catalog_import_rows set validation_status='approved';
 get diagnostics v_count=row_count;
 if v_count<>0 then raise exception 'editor bypassed row approval'; end if;
 begin
  insert into ace.catalog_sources values(gen_random_uuid(),'Forged','approved','official');
  raise exception 'editor inserted a self-approved source';
 exception when insufficient_privilege then null; end;
 begin
  perform ace.set_user_role('00000000-0000-4000-8000-000000000001','admin');
  raise exception 'editor escalated role';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000004',false);
do $$ begin
 if not ace.has_active_entitlement('00000000-0000-4000-8000-000000000002') then raise exception 'admin reconciliation read regressed'; end if;
 begin
  perform ace.set_user_role(auth.uid(),'student');
  raise exception 'last administrator removed';
 exception when check_violation then null; end;
 begin
  perform ace.set_user_role('00000000-0000-4000-8000-000000000001',null);
  raise exception 'NULL role accepted';
 exception when invalid_parameter_value then null; end;
 perform ace.set_user_role('00000000-0000-4000-8000-000000000001','editor');
end $$;
reset role;
do $$ begin
 if (select count(*) from ace.audit_events where event_type='role_changed')<>1 then raise exception 'role change was not audited exactly once'; end if;
end $$;
select 'FCB-01 RPC authorization tests passed' as result;
