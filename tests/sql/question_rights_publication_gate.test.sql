-- Disposable PostgreSQL regression test for question rights visibility and RPC enforcement.
drop schema if exists ace cascade;
drop schema if exists auth cascade;
create schema ace;
create schema auth;

do $roles$
begin
  create role anon;
exception when duplicate_object then null;
end
$roles$;
do $roles$
begin
  create role authenticated;
exception when duplicate_object then null;
end
$roles$;

create function auth.uid()
returns uuid language sql stable
as $fn$ select nullif(current_setting('test.user_id', true), '')::uuid $fn$;
create function ace.is_admin_or_editor()
returns boolean language sql stable
as $fn$ select coalesce(current_setting('test.is_editor', true), 'false') = 'true' $fn$;

create table ace.questions (
  id uuid primary key,
  subject_id uuid,
  active boolean not null,
  review_status text not null,
  rights_status text not null,
  options jsonb not null,
  correct_option_key text not null
);
create table ace.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  mode text not null,
  subject_id uuid,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  duration_seconds integer not null,
  random_seed bigint,
  question_order jsonb not null,
  option_order jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  score numeric,
  correct_count integer not null default 0,
  answered_count integer not null default 0
);
create table ace.attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references ace.attempts(id),
  question_id uuid not null references ace.questions(id),
  selected_option_key text,
  is_correct boolean,
  response_ms integer,
  answered_at timestamptz,
  unique(attempt_id, question_id)
);
alter table ace.questions enable row level security;
alter table ace.attempts enable row level security;
alter table ace.attempt_answers enable row level security;

-- Reproduce the pre-fix policy before applying the forward migration.
create policy questions_public_read on ace.questions
for select to public
using ((active and review_status = 'published') or ace.is_admin_or_editor());
create policy attempts_owner on ace.attempts
for all to public using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy answers_owner on ace.attempt_answers
for all to public
using (exists(select 1 from ace.attempts a where a.id = attempt_answers.attempt_id and a.user_id = auth.uid()))
with check (exists(select 1 from ace.attempts a where a.id = attempt_answers.attempt_id and a.user_id = auth.uid()));

grant usage on schema ace, auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
grant execute on function ace.is_admin_or_editor() to anon, authenticated;
grant select on ace.questions to anon, authenticated;
grant select, insert, update on ace.attempts, ace.attempt_answers to authenticated;
grant usage, select on all sequences in schema ace to authenticated;

insert into ace.questions(id,active,review_status,rights_status,options,correct_option_key) values
 ('10000000-0000-4000-8000-000000000001',true,'published','owned','[{"key":"A","text":"A"}]'::jsonb,'A'),
 ('10000000-0000-4000-8000-000000000002',true,'published','licensed','[{"key":"A","text":"A"}]'::jsonb,'A'),
 ('10000000-0000-4000-8000-000000000003',true,'published','permitted','[{"key":"A","text":"A"}]'::jsonb,'A'),
 ('10000000-0000-4000-8000-000000000004',true,'published','restricted','[{"key":"A","text":"A"}]'::jsonb,'A'),
 ('10000000-0000-4000-8000-000000000005',true,'published','unknown','[{"key":"A","text":"A"}]'::jsonb,'A');

\i supabase/migrations/20261021100000_question_rights_publication_gate.sql

set role anon;
do $assert$
declare v_count integer;
begin
  select count(*) into v_count from ace.questions;
  if v_count <> 3 then raise exception 'anon must see only owned/licensed/permitted published questions; got %',v_count; end if;
end
$assert$;
reset role;

select set_config('test.user_id','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',false);
select set_config('test.is_editor','true',false);
set role authenticated;
do $assert$
declare
  v_count integer;
  v_started jsonb;
  v_attempt_id uuid;
  v_restricted_id uuid := '10000000-0000-4000-8000-000000000004';
begin
  select count(*) into v_count from ace.questions;
  if v_count <> 5 then raise exception 'editor should retain review access to all five fixtures; got %',v_count; end if;

  v_started := ace.start_attempt('practice', null, 10, 1800, null);
  if (v_started->>'question_count')::integer <> 3 then
    raise exception 'start_attempt must exclude restricted and unknown-rights questions even for editors; result=%',v_started;
  end if;
  if exists (
    select 1 from jsonb_array_elements_text(v_started->'question_order') q(id)
    where q.id in ('10000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000005')
  ) then raise exception 'start_attempt included a question without approved rights'; end if;

  begin
    perform ace.start_attempt('practice', null, 10, 1800, array[v_restricted_id]);
    raise exception 'explicit question IDs must not bypass rights checks';
  exception when others then
    if sqlerrm <> 'No published questions available for this attempt' then raise; end if;
  end;

  insert into ace.attempts(user_id,mode,duration_seconds,question_order,status)
  values(auth.uid(),'practice',1800,jsonb_build_array(v_restricted_id::text),'active')
  returning id into v_attempt_id;
  begin
    perform ace.save_attempt_answer(v_attempt_id,v_restricted_id,'A',null);
    raise exception 'save_attempt_answer must reject a question whose rights are restricted';
  exception when others then
    if sqlerrm <> 'Question unavailable' then raise; end if;
  end;
end
$assert$;
reset role;

select 'question rights publication gate tests passed' as result;
